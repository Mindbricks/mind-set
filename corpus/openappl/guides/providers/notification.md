---
title: "Notification providers: behaviour rules"
---

# Notification providers: behaviour rules

This page states the provider behaviour that every conforming compiler must honour for the
notification family: what a blueprint can rely on when it declares a notification provider,
how each brand addresses its recipients, how a provider's failures map to the result, and the
delivery-status callbacks a generated service accepts. The configuration keys of every brand
(required and optional, which are secret, their defaults) are in the generated catalogue,
[notificationProvider](../../spec/providers/notificationProvider.md); this page does not
repeat them.

## Family rules

### Declaration and selection

- A notification provider is a named entry of
  `projectSettings.notificationProvidersSettings.notificationProviders[]` with a `name`
  (`codeName`, unique in the list), a channel `kind` (`email`, `sms`, `push`, `telegram`,
  `whatsapp` or `multi`), a brand `provider` and a `configuration` list of
  `{ "name": <key>, "value": <value> }` items. Several entries may share a brand (two accounts,
  or one account for SMS and another for WhatsApp).
- `configuration[].value` is a String, including port and boolean settings; an object such as
  `{ "secretName": ... }` is not this field's shape. A secret item is authored as a string with
  `"secret": true`. The placeholder `ENTER_CREDENTIAL` passes validation but leaves the provider
  unconfigured at runtime: it proves no delivery. A compiler masks secret values in every answer
  it gives and never inlines them into generated code.
- A configuration value spelled `$ENV:NAME` is a reference: it is carried as written, never
  treated as a secret value of its own, and every reader reads the variable `NAME`.
- The `(kind, provider)` pair selects the channel variant: `(sms, twilio)` and
  `(whatsapp, twilio)` are different clients, and `(whatsapp, twilio)` and
  `(whatsapp, whatsapp)` are told apart by the `kind`. A pair outside the catalogue is refused.
  `multi` is valid only for a brand that serves two or more channels with one call shape; it is
  refused for `amazonsns`, whose SMS and push are different calls (declare one entry per
  channel).
- A key not in the brand's catalogue is the warning `NOTIFICATION_PROVIDER_UNKNOWN_CONFIG` and
  is ignored at runtime.
- The notification service holds one default provider per channel
  (`notificationService.serviceSettings.serviceOptions.defaultEmailProviderName`,
  `defaultSmsProviderName`, `defaultPushProviderName`, `defaultTelegramProviderName`,
  `defaultWhatsappProviderName`). Each must name an entry of a compatible `kind` (or `multi`).
  A send action's own `provider` overrides the default.
- `EventNotification.providerName` picks an entry by name. A `kind` that does not match the
  channel is `IncompatibleProviderKind` at validation; an unresolved name is
  `UnknownNotificationProvider`.
- A default provider name or an event notification `providerName` that names no declared
  provider (and no built-in sink) stops generation of the notification service: validation
  reports the error `NOTIFICATION_PROVIDER_NOT_DECLARED` at that field, and the channel's
  `*_FLOWS_GO_TO_SINK` warning stays silent for it. An empty or whitespace-only name counts as
  absent: the event then uses the channel default, or the first compatible provider or sink when
  no default is set. A nonblank name keeps its exact spelling; surrounding whitespace is not
  stripped.
- A send action calls the provider directly from the service that runs it: there is no
  message-bus hop and no inter-service call between the action and the provider.
- The brand `fake` is retired. A blueprint that names it is refused with
  `RETIRED_NOTIFICATION_PROVIDER`, and the runtime refuses it too. No sink rescues a `fake`
  entry: a retired brand is a blueprint defect, while the sink answers a deployment condition on
  an otherwise valid selection.

```json
{
  "notificationProvidersSettings": {
    "notificationProviders": [
      {
        "name": "mainSmtp", "kind": "email", "provider": "smtp",
        "configuration": [
          { "name": "emailFrom", "value": "noreply@example.invalid" },
          { "name": "emailHost", "value": "smtp.example.invalid" },
          { "name": "emailPort", "value": "465" },
          { "name": "emailUser", "value": "noreply" },
          { "name": "emailPass", "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "isSecure",  "value": "true" }
        ]
      },
      {
        "name": "mainSms", "kind": "sms", "provider": "twilio",
        "configuration": [
          { "name": "twilioAccountSid", "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "twilioAuthToken",  "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "twilioSender",     "value": "+14155551234" }
        ]
      }
    ]
  }
}
```

```json
{
  "actionType": "SendMailAction",
  "name":      "sendWelcome",
  "provider":  "mainSmtp",
  "to":        { "js": "this.input.email" },
  "subject":   { "js": "'Welcome'" },
  "body":      { "js": "this.renderedHtml" }
}
```

### The send contract

Every brand follows one contract (see also
[Notification service: failure handling](../system-services/notification.md#failure-handling)):

- **Success** resolves with `{ success: true, provider, messageId }` only when the provider
  accepted the request. Accepted is not delivered: delivery is asynchronous on every brand.
  `messageId` is the id the provider assigned, verbatim, and is absent when the accepted
  response carries none. The notification service stores it on the success
  `notificationDeliveryLog` row as `messageId`, the key for correlating the provider's later
  delivery events.
- **Failure** raises a `NotificationSendError` (`name === 'NotificationSendError'`) carrying
  `provider` (the entry name), `providerKind`, `cause` (the original exception or response body)
  and a coarse `code`:

| `code` | Meaning | Retry |
|---|---|---|
| `auth_error` | Credentials wrong, expired or revoked. | Permanent until the credentials change. |
| `rate_limited` | The provider answered 429 or its throttling error. | Retry after backoff. |
| `invalid_recipient` | Bad recipient identifier (address, number, token, chat id). | Permanent: never succeeds without a corrected target. |
| `http_error` | Network or transport failure, classified before the provider's own error. | Transient. |
| `provider_error` | Provider-side error the brand does not classify finer; inspect `cause`. | Depends on `cause`. |
| `unknown` | Reserved; not emitted. | |

A workflow branches on `err.code` (for example in an `onActionError: 'completeApi'` handler)
without parsing provider messages. No credential, password or authorization header ever appears
in an error.

### Built-in sinks

A sink is a capture endpoint, not a provider: it is never declared and has no entry in
`notificationProviders[]`. A message that reaches a sink was **not delivered** to its recipient.
Every sink stores what it accepts as mail in the mail sink, so all sinks need only one capture
host. Where the environment does not provide that host, every send to a sink **fails** (and is
retried) with an error naming the `mail-sink` requirement, not the declared provider. A test
plan therefore cannot assume that mail always reports success outside production.

**Email.** A send that selects an email provider whose credentials are incomplete at runtime (a
required key unset, or still an authoring placeholder) goes to the mail sink instead of failing
in the provider dialogue, on every deployment. The service logs a WARN at construction naming the
bypassed provider and the names (never the values) of the missing settings; in production the same
finding is an ERROR on the boot report and the health surface. A project that declares no email
provider still sends: email verification, password reset and email 2FA resolve against a
last-resort entry (`__mailsink__`) aimed at the sink. Declaring a real provider takes precedence
at once, and as soon as its configuration is complete the sink stops engaging for it, with no
blueprint change. A blueprint must not invent a placeholder mail provider of its own, and must
not treat the sink as a delivery mechanism.

Validation raises one non-blocking warning, `MAIL_FLOWS_GO_TO_SINK`, when the project sends
mail but declares no `email` or `multi` provider, listing active email verification,
reset-by-email, email 2FA, `email2FARequiredForLogin` and every email event notification.
`SendMailAction`s are not listed: one that names a provider names a declared one, and one that
names a `mailAccount` sends through the mailbox, never the sink. Declaring an email provider, even
without credentials, silences the warning.

**SMS, WhatsApp, telegram and push** share one slot table:

| Provider of the channel | non-production deployments | production |
|---|---|---|
| Declared, credentials set | real | real |
| Declared, credentials missing | sink | send fails, and the boot report names it |
| None declared (`multi` counts as declared) | sink | sink |

- "None declared" is decided when the project is compiled: the compiler appends a last-resort
  entry for the channel (`__smssink__`, `__whatsappsink__`, `__telegramsink__`, `__pushsink__`;
  brands `whatsappsink`, `telegramsink`, `pushsink`, which a blueprint cannot declare), so an
  event notification of that `jobType` compiles and resolves to the sink. Nothing is checked at
  runtime.
- A `SendSmsAction`, `SendWhatsAppAction` or `SendPushNotificationAction` may omit `provider`
  only while the project declares no provider of its channel; it then sends to the channel's
  sink on every deployment. Once a provider of the channel is declared, `provider` is required
  again (`REQUIRED_FIELD_MISSING`).
- A `multi` entry used by an event notification is not routed to the SMS sink (its kind is not
  `sms`). A `SendSmsAction` that names a `multi` entry sends as `sms`, so with credentials
  missing it is routed like an SMS provider.
- Validation raises one non-blocking warning per channel when the project has flows of that
  channel but declares no provider of it: `SMS_FLOWS_GO_TO_SINK` (active mobile verification,
  reset-by-mobile, mobile 2FA, `mobile2FARequiredForLogin`, SMS event notifications,
  `SendSmsAction`s: real users receive no code), `WHATSAPP_FLOWS_GO_TO_SINK`,
  `TELEGRAM_FLOWS_GO_TO_SINK` and `PUSH_FLOWS_GO_TO_SINK` (event notifications of the `jobType`
  and provider-less send actions). With no SMS provider the mobile flows are still built, and
  `VERIFICATION_FLOW_MISSING_PROVIDER` is not reported for them. Declaring a provider, even
  without credentials, silences the warning; none of them blocks a save.

How a sunk message is stored (From is `no-reply@<channel>-sink.invalid`; the subject ends with
`(provider "<name>" bypassed)` when a declared provider was sunk):

| Channel | To | Subject | Body |
|---|---|---|---|
| SMS | `sms-<digits of the number>@sms-sink.invalid` (`+90 555 111 22 33` becomes `sms-905551112233@sms-sink.invalid`) | `SMS to <number>` | the text |
| WhatsApp | `whatsapp-<digits>@whatsapp-sink.invalid` | `WhatsApp to <number>` | the text; a template send records the template name, language and parameters |
| Telegram | `telegram-<chat id or handle, lowercased, [a-z0-9_-] only>@telegram-sink.invalid` | `Telegram to <chat id>` | the text |
| Push | `push-<first 16 hex of sha256(device token)>@push-sink.invalid` | `Push to device ...<last 6 of the token> (<hash>)` | `Title: ...` first, then the text |

The push address carries a hash, never the token. A sunk message reports its sink entry
(`__smssink__`, `__whatsappsink__`, ...) as its provider.

### Reserved recipients

A message addressed to a reserved, non-deliverable recipient is never handed to a real provider.
It goes to the channel's sink on every deployment, production included, however complete the
credentials are (a real provider would bounce it, and bounces get the sending account flagged).
It needs no configuration and cannot be switched off.

| Channel | Reserved recipient | Goes to |
|---|---|---|
| email | a domain under `.invalid`, `.test`, `.example` or `.localhost` (RFC 2606 / RFC 6761), or `example.com`, `example.net`, `example.org` and their subdomains | the mail sink, with the provider's own From |
| sms, `multi` | a number reserved for fiction: `+1 NXX 555 0100` to `0199` in any area code, and `+44 7700 900000` to `900999` (national forms too) | the SMS sink |
| whatsapp | the same fiction ranges | the WhatsApp sink |
| push, telegram | not applicable: a token or chat id cannot be reserved | the provider, unchanged |

- The rule is per recipient. An email whose `to` lists several addresses (comma or semicolon
  separated) is split: reserved addresses go to the sink, the provider receives the rest. A list
  of reserved addresses only never reaches the provider.
- Look-alikes are not reserved: `myexample.com`, `example.co`, `invalid.com`, `test.io` are
  delivered.
- The service logs one `RESERVED RECIPIENT` warning per send, naming the provider and the count,
  never the address.
- On the non-production test and stage slots only, an email recipient on `admin.com` or a
  subdomain of it (seed data such as a bootstrap administrator address) is treated as reserved.
  Production delivers it. The slot is read from the service's own deployment slot; an unreadable
  slot counts as production.

### Mock status

A generated service answers `GET /v1/mail/mock-status`, scoped to that service: it lists every
notification provider the service sends through, with its channel `kind` and its completeness,
and a `sink` block naming the host, the `mail-sink` requirement and the engagement class:

- `incomplete-credentials`: an email provider is declared, but a required key is unset or a
  placeholder (fix: set the deployment value);
- `no-channel-match`: no declared provider serves email at all (fix the blueprint; the usual
  cause is an item whose `kind` was never authored, which defaults to `email` in the pattern but
  is missing from the copied item).

A service that sends no mail answers `sink.engaged: false`, `sink.reason: "not-a-mail-sender"`
and names the services that do send in `sink.sendingServices`. Only a mail-sending service's
answer says anything about the project's providers. The same answer carries an `smsSink` block
and `channelSinks.whatsapp`, `.telegram`, `.push` blocks (`engaged`, `reason`, `slotAllowsSink`,
`sunkProviders`, `mailDomain` for the channel sinks); a sunk provider is listed with `fallback:
smsSink` (or `whatsappSink`, `telegramSink`, `pushSink`), and on production a provider with
missing credentials is listed under `blocking`.

## SMTP (email, `smtp`)

- The provider sends `from: emailFrom` and the body as both the text part and the HTML part.
- `emailPort` defaults to `587`. `isSecure: "true"` selects implicit TLS (port 465);
  `"false"` (the default) is STARTTLS on 587.
- When `emailUser` and `emailPass` are both empty the provider skips authentication, for relays
  that authenticate by IP allow-list.
- `attachments` on `SendMailAction` accepts the `{ fileName, content, contentType }` shape that
  `RenderPdfAction` produces.
- One connection pool is kept per provider name.
- `messageId` is the RFC 5322 Message-ID of the accepted message.
- The SMTP transport bounds connection 10 s, greeting 10 s and socket 30 s by default. A send
  still running at the end of the event's delivery budget is recorded as failed.

| SMTP error | `code` |
|---|---|
| `EAUTH` (authentication failure) | `auth_error` |
| `EENVELOPE` (bad sender or recipient address) | `invalid_recipient` |
| anything else | `provider_error` |

**SES over SMTP.** SMTP can point at the regional SES SMTP endpoints
(`email-smtp.<region>.amazonaws.com:587`, `isSecure: "false"`) with SES SMTP credentials, which
are a different pair from the API keys of the `amazonses` brand. `emailFrom` must then be a
verified SES identity; mail from an unverified sender is rejected, and a sandbox account delivers
only to verified recipients. SES's own features (templated bulk send, configuration sets, event
destinations, identity management) are exposed neither by this route nor by `amazonses`. Other
SMTP-speaking services (relays, hosted mail services' SMTP endpoints) are reached the same way.

## Amazon SES (email, `amazonses`)

- A person-addressable email brand: `to` is a real mailbox address. The brand `amazonsns` has no
  email channel: `"kind": "email", "provider": "amazonsns"` is refused at design time with
  `NOTIFICATION_PROVIDER_KIND_UNSUPPORTED`, naming `amazonses` as the replacement.
- `emailFrom` must be a verified SES identity (the address, or an address on a verified domain).
  A sandbox account delivers only to verified recipients.
- `awsRegion` falls back to `us-east-1` when unset.
- Subject and body are sent as given (empty string when absent); the body is both the text and
  the HTML part.
- A reply-mode `SendMailAction` puts `inReplyTo` / `references` into the payload metadata; the
  provider sends them as the `In-Reply-To` and `References` headers so mail clients thread the
  message.
- `messageId` is SES's `MessageId`; every later SES event (bounce, complaint, delivery) is
  published under it.

| SES error | `code` |
|---|---|
| `NotAuthorizedException`, `AccessDeniedException`, `UnrecognizedClientException`, `InvalidClientTokenId`, `SignatureDoesNotMatch` | `auth_error` |
| `TooManyRequestsException`, `LimitExceededException`, `ThrottlingException` | `rate_limited` |
| anything else (sandbox recipient, suspended account, bad address) | `provider_error` |

## SendGrid (email, `sendgrid`)

- The body is sent as both `text` and `html`; text-only clients fall back to the text.
- The `from` is always `emailFrom`; the action's `from` field is ignored by this brand.
- `messageId` is the `x-message-id` response header.
- The provider throttles by API-key tier; bulk sends see 429, surfaced as `rate_limited`.

| HTTP status | `code` |
|---|---|
| 401 / 403 | `auth_error` |
| 429 | `rate_limited` |
| anything else | `provider_error` |

A mail service without a brand of its own (for example one that offers SMTP) is reached through
the `smtp` brand; its own SDK features are out of scope for the native channel.

## Twilio (SMS, `twilio`)

- `twilioSender` is the `from`: an E.164 number or a registered alphanumeric sender. `subject`
  is ignored.
- One client is kept per provider name. The same account pair can serve a `(whatsapp, twilio)`
  entry.
- Bodies above 160 GSM-7 characters (70 UCS-2) are segmented by the provider and billed per
  segment. Sender authorization differs by destination country; some markets require
  pre-registered alphanumeric senders.
- `messageId` is the message SID.

| Response | `code` |
|---|---|
| HTTP 401 / 403 | `auth_error` |
| HTTP 429, or provider code `20429` | `rate_limited` |
| provider code `21211` / `21614` (invalid `To`) | `invalid_recipient` |
| anything else | `provider_error` |

## Vonage (SMS, `vonage`)

- Sends `{ from: vonageSender, to, text: body }`; `vonageSender` is an E.164 number or an
  alphanumeric sender id. `subject` is ignored.
- Alphanumeric senders are accepted in many European markets and rejected in others (US,
  Canada).
- `messageId` is the message id of the first message part.
- Every rejection is `provider_error`: the brand does not classify finer, because the
  provider's error shape varies between API versions; `cause` carries the diagnostics.

## AWS SNS (SMS, `amazonsns`)

- Direct phone-number publish: `PhoneNumber` is `to`, `Message` is the body. `subject` is
  ignored.
- `to` must be E.164 (`+<country><number>`); anything else fails as `invalid_recipient`. A
  sandbox account delivers only to verified numbers.
- `awsRegion` falls back to `us-east-1`. The same credential triple can serve an
  `amazonsns` push entry (a separate entry; `multi` is refused).
- `messageId` is SNS's `MessageId`.

| SNS error | `code` |
|---|---|
| `AuthorizationErrorException`, `InvalidClientTokenId`, `SignatureDoesNotMatch` | `auth_error` |
| `ThrottlingException`, `Throttling` | `rate_limited` |
| `InvalidParameterException` (bad phone number) | `invalid_recipient` |
| anything else | `provider_error` |

## Netgsm (SMS, `netgsm`)

- Authenticates with HTTP Basic (`netgsmUsername:netgsmPassword`) and posts
  `{ "msgheader": netgsmSender, "messages": [{ "msg": body, "no": to }], "encoding": "TR" }`.
  `appname` is not sent: the account is identified by the Basic header. `subject` is ignored.
- All three keys are required; a provider missing one is incomplete, so outside production its
  SMS goes to the SMS sink and the boot credential report names the missing key.
- `netgsmSender` must be a sender header approved on the account in advance.
- `encoding: "TR"` renders Turkish characters natively; such a message may be billed as UCS-2
  (70 characters per segment).
- Success requires HTTP 2xx **and** body `code` `"00"`: the provider reports a refusal in the
  body even under HTTP 200, so any other code, or a 2xx body without a code, is a failure, and
  the error message carries the provider code and its description. `messageId` is the body's
  `jobid`.

| Response | `code` |
|---|---|
| username or password unset (no request is made) | `auth_error` |
| network failure | `http_error` |
| body code `30` (invalid credentials, no API access, or IP restriction) | `auth_error` |
| any other body code except `00` (for example `40` sender header not defined, `70` invalid parameters) | `http_error` |
| HTTP 401 / 403 | `auth_error` |
| HTTP 429 | `rate_limited` |
| any other non-2xx | `http_error` (`auth_error` when its body carries code `30`) |

## Firebase Cloud Messaging (push, `firebase`)

- Sends `token: to` (an FCM registration token), `notification.title: subject ?? ''`,
  `notification.body: body ?? ''`, and `data` with every `metadata` key stringified. It reaches
  Android, web and iOS (through APNs) by the unified API.
- The three keys form one service-account credential. A `\n` escape sequence in
  `firebasePrivateKey` is replaced by a real newline, so the key may be delivered escaped or raw.
- One client is kept per provider name, so several Firebase entries coexist in a service; a
  client already registered under the same name is reused, not initialized twice.
- For an event or action with `targetKind: 'userId'`, the device tokens are resolved from the
  notification service before the provider is called.
- `messageId` is the FCM message name, `projects/<project>/messages/<id>`.
- The provider rejects payloads above 4 KB; large `metadata` objects exceed it quickly.
- iOS background sends need the `apns-push-type: background` header, which this brand does not
  set.

| Provider error | `code` |
|---|---|
| `messaging/registration-token-not-registered`, `messaging/invalid-registration-token`, `messaging/invalid-argument` | `invalid_recipient` |
| `messaging/quota-exceeded`, `messaging/server-unavailable` | `rate_limited` |
| `messaging/authentication-error`, `app/invalid-credential` | `auth_error` |
| anything else | `provider_error` |

## OneSignal (push, `onesignal`)

- Posts `{ app_id, include_player_ids: [to], headings: { en: subject }, contents: { en: body },
  data: metadata }`. `to` must be a OneSignal **player id**; external user ids are not used, so
  resolve them to player ids before the send.
- `headings` and `contents` are single-language (`en`); a multi-language send renders the body
  beforehand or uses the provider's templating.
- The key in the `Authorization: Basic <key>` header is the server-side REST API key, not the
  user-auth key.
- `messageId` is the notification `id` of the response body.

| Response | `code` |
|---|---|
| network failure | `http_error` |
| HTTP 400 | `invalid_recipient` |
| HTTP 401 / 403 | `auth_error` |
| HTTP 429 | `rate_limited` |
| any other non-2xx | `http_error` |

## AWS SNS (push, `amazonsns`)

- Publishes one multi-platform JSON message (`MessageStructure: 'json'`): `default` is the body,
  `APNS` and `APNS_SANDBOX` carry `{ aps: { alert: { title, body } } }`, `GCM` carries
  `{ notification: { title, body } }`; SNS delivers the shape that matches the endpoint's
  platform application.
- `to` may be a raw device token (an FCM registration token or an APNs device token, which is
  what the device-token registry stores and what a `userId` fan-out passes) or an SNS endpoint
  ARN (`arn:aws:sns:...:endpoint/...`), published to directly. A raw token is registered against
  `platformApplicationArn` (idempotent for the same token) and the endpoint ARN is cached per
  token for the life of the process; after a restart the registration runs once more and returns
  the same ARN.
- Without `platformApplicationArn` only an endpoint ARN can be sent to; validation warns
  `NOTIFICATION_PROVIDER_PUSH_PLATFORM_APP_MISSING`, and a raw token then fails as
  `invalid_recipient` without any call.
- An event notification that targets a `userId` sends once per device token of that user.
- `awsRegion` falls back to `us-east-1`. `messageId` is SNS's `MessageId`.
- Payloads are capped at 256 KB after JSON encoding. Data-only pushes and collapse keys are not
  offered by this brand.
- `EndpointDisabledException` means the platform rejected the token; the app must register a
  fresh token, and the stale device-token row can be removed.

| Condition | `code` |
|---|---|
| `AuthorizationErrorException`, `InvalidClientTokenId` | `auth_error` |
| `ThrottlingException` | `rate_limited` |
| `EndpointDisabledException`, `InvalidParameterException` (bad endpoint ARN, or a token the platform application refuses) | `invalid_recipient` |
| raw token without `platformApplicationArn` (no call made) | `invalid_recipient` |
| anything else | `provider_error` |

## Telegram Bot API (telegram, `telegram`)

- Calls `<telegramApiBase>/bot<telegramBotToken>/sendMessage` with
  `{ chat_id: to, text: subject + "\n\n" + body, parse_mode: "Markdown" }`.
- `to` is a chat id (positive for users, negative for groups and supergroups) or a channel
  username. The user must have messaged the bot first, or the bot must be a member of the group
  or channel.
- `parse_mode: "Markdown"` is fixed: escape `*`, `_`, `` ` ``, `[`, `]` in dynamic content that
  must not be interpreted.
- Bodies are capped at 4096 UTF-8 characters; a longer one is rejected as `invalid_recipient`.
- Telegram has no send action. A `Send*Action` that references a `telegram` entry is refused with
  `IncompatibleProviderKind`; telegram messages are sent by an `EventNotification` whose
  `eventNotificationBasics.jobType` is `telegram`. Without `providerName` it uses
  `defaultTelegramProviderName`. `targetKind: "telegramHandle"` expects the value at
  `targetPathInData` to be a chat id or `@handle` already; `targetKind: "userId"` is valid when
  the user's `telegramHandle` can be resolved.
- `messageId` is the Bot API `result.message_id`, as a string.

| Response | `code` |
|---|---|
| network failure | `http_error` |
| HTTP 400 / 404 (bad chat id, bot removed) | `invalid_recipient` |
| HTTP 401 / 403 (bad bot token, blocked by the user) | `auth_error` |
| HTTP 429 | `rate_limited` |
| any other non-2xx | `http_error` |

```json
{
  "eventNotificationBasics": { "name": "alertOnSeverity", "jobType": "telegram", "isStored": false },
  "triggerSource": "kafka",
  "eventDataSettings": { "channel": "elastic-index-<project>_incident-created" },
  "providerName": "alertsBot",
  "targets": [
    { "targetName": "opsChannel", "targetKind": "telegramHandle", "targetPathInData": "opsChatId", "isArray": false }
  ],
  "template": {
    "name": "telegramAlert",
    "subjectTemplate": "[ALERT] <%= dataSource.severity %>",
    "bodyTemplate": "<%= dataSource.message %>",
    "parser": "ejs"
  }
}
```

**As a chat channel provider.** A telegram provider can back a chat surface: an AI agent's
`endpointSettings.chatSurfaces[]` entry or an MCP-BFF exposure
(`projectSettings.mcpbffSettings.chatSurfaces[]`) names it in `provider`. The surface's webhook
(`/agents/<agent>/telegram/webhook` on the agent's service, `/chat/<provider>/webhook` on the
MCP-BFF) verifies every update with `telegramWebhookSecret` (the `X-Telegram-Bot-Api-Secret-Token`
header); without that key the webhook refuses every update (it fails closed). Replies are sent
with `telegramBotToken`. A provider backs at most one conversational consumer.
[Chat handlers](../capabilities/chat-handlers.md) declared on the provider (`chatHandling`) claim
a matching update before that consumer sees it; a provider with handlers and no conversational
consumer receives its updates on the notification service at
`/v1/telegram-webhooks/<providerName>`. The retired `chatProvidersSettings` bots convert on load
to a telegram provider that reads the same values. See
[AI chat surfaces](../capabilities/ai-chat-surfaces.md).

## WhatsApp Cloud API (whatsapp, `whatsapp`)

- Posts to `<whatsappApiBase>/<whatsappApiVersion>/<whatsappPhoneNumberId>/messages` with
  `{ messaging_product: "whatsapp", to, type: "text", text: { body } }`. The leading `+` is
  stripped from `to`; `subject` and `body` are joined with a blank line when both are set.
  `whatsappPhoneNumberId` is the provider's phone number id, not the phone number.
- `whatsappApiVersion` defaults to `v20.0`, `whatsappApiBase` to `https://graph.facebook.com`.
- `whatsappBusinessAccountId` is a legacy key: `NOTIFICATION_PROVIDER_UNKNOWN_CONFIG`, ignored at
  runtime.
- A send from the notification service's event handlers carries a fixed
  `biz_opaque_callback_data` marker, which the provider echoes on that message's status webhooks;
  a `SendWhatsAppAction` send does not carry it.
- Access tokens expire; `auth_error` is the signal that `whatsappAccessToken` must be rotated.
- `messageId` is the `wamid` in `messages[0].id`.

| Response | `code` |
|---|---|
| network failure | `http_error` |
| HTTP 400 (rejected payload, bad recipient) | `invalid_recipient` |
| HTTP 401 / 403 (token invalid or expired) | `auth_error` |
| HTTP 429 | `rate_limited` |
| any other non-2xx | `http_error` |

**Templates and the 24-hour window.** Free-form text reaches the recipient only inside the
24-hour customer-service window; outside it the provider refuses the message (error 131047)
**after** the API accepted the send, so the send result reports success. A business-initiated
message (order, shipment, refund, OTP notice) must be an approved template: a `whatsapp`
`EventNotification` names it in `template.whatsappTemplate` (per language in
`template.variants[].whatsappTemplate`), a send action in `SendWhatsAppAction.template` with
`templateVariables`. Validation warns `WHATSAPP_FREEFORM_OUTSIDE_WINDOW` for a notification with
no template of its own. The template name must match the approved template exactly.

The template as submitted can be recorded on the same block. These fields are documentation
only; nothing is sent from them, because the provider renders the approved text:

```json
{
  "whatsappTemplate": {
    "name": "order_received",
    "language": "tr",
    "components": { "js": "[this.payload.orderNumber, this.payload.amountText]" },
    "category": "utility",
    "body": "{{1}} numarali siparisiniz alindi, odemeniz ({{2}}) onaylandi.",
    "footer": "example.com",
    "buttons": [{ "type": "url", "text": "Siparisim", "url": "https://example.com/orders/{{1}}" }],
    "samples": ["B261009-3LHPJQ", "530,00 TL"]
  }
}
```

- `category`: `utility`, `marketing` or `authentication`. `body`: the approved text with
  `{{1}}`, `{{2}}`, ... numbered without gaps. `header` / `footer`: optional text. `buttons`:
  optional `quick_reply`, `url` or `phone_number`. `samples`: one value per variable, in order.
- Validation warns, never blocks: `WHATSAPP_TEMPLATE_DOC_INCOMPLETE` (body without category or
  the reverse), `WHATSAPP_TEMPLATE_PLACEHOLDERS_GAP`, `WHATSAPP_TEMPLATE_SAMPLES_MISMATCH`,
  `WHATSAPP_TEMPLATE_PARAMETER_COUNT_MISMATCH` (a positional `components` array literal whose
  length is not the number of variables).

**One inbound door per provider.** The provider sends everything about a number (inbound
customer messages, the delivery statuses of this service's sends, other field changes) to one
callback URL, so the notification service exposes exactly one door per WhatsApp provider:

```
GET  <notification service URL>/v1/whatsapp-webhooks/meta/<name>   (subscription handshake)
POST <notification service URL>/v1/whatsapp-webhooks/meta/<name>   (every webhook of the number)
```

- The handshake answers `200` with the `hub.challenge` value when `hub.verify_token` equals
  `whatsappVerifyToken`, and `403` `WHATSAPP_INGRESS_UNVERIFIED` otherwise; without
  `whatsappVerifyToken` it is refused. The URL must include the service's gateway path prefix
  where there is one: the same path without it reaches another component that answers `200` with
  an HTML page, and the provider then reports the callback as unverifiable.
- One provider is one app secret is one door; several providers under one app need a callback
  override per number.
- A POST is verified first: `X-Hub-Signature-256` over the raw bytes with this provider's
  `whatsappAppSecret`. An unknown provider name is `404`, a missing secret `503` (the door
  refuses everything), a bad signature `403`. The secret lives only on the provider; a chat
  surface that names the provider carries no credential of its own.
- The body is split per message, per status and per other change, and each item is published per
  provider: a message to the chat surfaces and MCP-BFF exposures that name the provider
  (`<codename>-whatsapp-inbound-message`), a status to the delivery log
  (`<codename>-whatsapp-inbound-status`), any other change to `<codename>-whatsapp-inbound-other`,
  and a message of a provider nothing is bound to to `<codename>-whatsapp-inbound-unrouted` with
  a WARN: never dropped, never a 4xx (the number may belong to another project).
- The door answers `200` only after every event of the body is published; a publish failure
  answers `503` so the provider redelivers. The dedup mark on the provider's id (wamid,
  `wamid:status`) is set only after the publish and the envelope id derives from the same id, so a
  redelivery is a duplicate at the door and at every consumer. The message key is the
  `phone_number_id`, so one number's events keep their order. Every event carries the item,
  `providerName`, `phone_number_id`, the raw body (base64) and the signature header, so a
  receiver can re-check the signature.
- [Chat handlers](../capabilities/chat-handlers.md) declared on the provider claim a matching
  message at the same door before it is routed.
- The former per-receiver URLs (`/v1/notification-webhooks/whatsapp/<name>` for statuses,
  `/agents/<agent>/whatsapp/webhook` for agent messages) no longer exist for this brand;
  validation `WHATSAPP_INGRESS_URL_MIGRATION` names the old and the new URL. A chat surface
  replies with the provider's `whatsappAccessToken`, `whatsappPhoneNumberId` and
  `whatsappApiVersion`; a retired `chatProvidersSettings` WhatsApp bot converts on load
  (`CHAT_BOT_CONVERTED`).

**Delivery statuses.** The status consumer applies each status to the message's
`notificationDeliveryLog` row: `failed` moves it from `success` to `failed` with the provider's
error code and title; `delivered` sets `deliveredAt` and `read` sets `readAt` (and an empty
`deliveredAt`), each at the provider's own status `timestamp` and only while still empty, so a
repeated or out-of-order status never moves or clears one; `sent` is ignored. A status for a
phone number other than `whatsappPhoneNumberId` is skipped. A status the store cannot take after
3 attempts is dead-lettered to `<codename>-whatsapp-inbound-status.dlq` (replay: publish its
`originalEvent` back to the status topic as the raw record value, not re-wrapped), never
dropped.

## Twilio WhatsApp (whatsapp, `twilio`)

- Sends through the provider's messaging API with the `whatsapp:` channel scheme. `whatsappFrom`
  is the sender (`whatsapp:+...`); when it is unset `twilioSender` is used, and the scheme is
  added when missing. The recipient is prefixed with `whatsapp:` when not already. `subject` is
  joined to `body` with a blank line.
- A sandbox sender accepts only opted-in numbers; in production a recipient must start the
  conversation, or receive an approved template. Outside the 24-hour window a template is
  required; this brand expects the template's `contentSid`.
- The same account pair can serve an `(sms, twilio)` entry.
- `messageId` is the message SID. Failure codes are those of [Twilio (SMS)](#twilio-sms-twilio).

**Delivery statuses.** A send from the notification service's event handlers passes
`statusCallback: <service URL>/v1/notification-webhooks/whatsapp/<name>` (only when the service
knows its public URL); a `SendWhatsAppAction` send passes none. The service verifies
`X-Twilio-Signature` with `twilioAuthToken` against that exact URL, so the URL the service
believes it has must equal the URL the provider calls (behind a proxy that rewrites it, every
callback is refused). `failed` and `undelivered` move the `notificationDeliveryLog` row from
`success` to `failed` with the provider's `ErrorCode` (for example 63016); `delivered` sets
`deliveredAt` and `read` sets `readAt` (and an empty `deliveredAt`), at the time the callback
arrives and only while still empty; other statuses are ignored.

## See also

- Catalogue: [notificationProvider](../../spec/providers/notificationProvider.md)
- Specification: [NotificationProvidersSettings](../../spec/NotificationProvidersSettings.md),
  [NotificationProvider](../../spec/NotificationProvider.md),
  [NotificationServiceOptions](../../spec/NotificationServiceOptions.md)
- [Notification service](../system-services/notification.md)
- Actions: `SendMailAction`, `SendSmsAction`, `SendPushNotificationAction`, `SendWhatsAppAction`

## Operations

Environment variables, console configuration, credential setup (account permissions, sender and
domain verification, template submission) and the go-live checklist are operations of a
compiler and are not part of the language. Read the documentation of your compiler for them.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
