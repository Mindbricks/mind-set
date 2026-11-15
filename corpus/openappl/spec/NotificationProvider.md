# NotificationProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [NotificationProvider in Part 1](../ontology/NotificationProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [notificationProvider](./providers/notificationProvider.md).

A named notification provider configuration. The `name` is the lookup key used by EventNotification.providerName / send*Action.provider and the env-var prefix (e.g. `mainSmtp` → `NOTIFICATION_PROVIDER_MAINSMTP_*`). The `kind` selects the channel; the `provider` enum selects the backend SDK. `kind` and `provider` are orthogonal — the same SDK (e.g. Twilio) can serve multiple kinds via separate entries. The `configuration` is a free-form key/value list whose required keys depend on the chosen `provider`; the UI and the agent ontology doc enforce the per-provider shape.

Expected configuration keys per provider:
- smtp (email): emailFrom, emailHost, emailPort, emailUser, emailPass, isSecure
- sendgrid (email): emailFrom, sendGridApiKey
- resend (email): emailFrom, resendApiKey
- amazonsns (sms, push): awsAccessKeyId, awsSecretAccessKey, awsRegion; push also takes platformApplicationArn (optional). kind=sms publishes direct to a PhoneNumber. kind=push publishes SNS mobile push: a recipient that is an SNS platform-endpoint ARN is published to directly, a raw FCM/APNs device token (what the DeviceToken registry stores) is first registered against platformApplicationArn with CreatePlatformEndpoint. Declare one entry per channel (kind='multi' is refused). NOT email: the AmazonSNS email adapter was removed; email over AWS is amazonses (Amazon SES).
- twilio (sms): twilioAccountSid, twilioAuthToken, twilioSender
- twilio (whatsapp): twilioAccountSid, twilioAuthToken, whatsappFrom (e.g. 'whatsapp:+14155238886'). twilioAuthToken also verifies the delivery-status callbacks of the notification service, which are requested only when SERVICE_URL is set.
- vonage (sms): vonageApiKey, vonageApiSecret, vonageSender
- netgsm (sms): netgsmUsername, netgsmPassword, netgsmSender
- firebase (push): firebaseProjectId, firebaseClientEmail, firebasePrivateKey
- onesignal (push): oneSignalAppId, oneSignalApiKey
- telegram (telegram): telegramBotToken, telegramApiBase (optional, default https://api.telegram.org), telegramWebhookSecret (optional; the secret token Telegram presents on the webhook of an aiAgent surface or an mcpbff exposure bound to this provider - without it that webhook refuses every update). A telegram provider is also the CHANNEL PROVIDER of chat surfaces: an agent surface or mcpbff exposure that names it replies with its telegramBotToken
- whatsapp (whatsapp, Meta Cloud API): whatsappAccessToken, whatsappPhoneNumberId, whatsappApiVersion (optional, default v20.0), whatsappApiBase (optional, default https://graph.facebook.com), whatsappAppSecret and whatsappVerifyToken (they authenticate this provider's ONE inbound door on the notification service, POST/GET /v1/whatsapp-webhooks/meta/<name>, where Meta sends every webhook of the number: inbound customer messages for the agents and bots bound to this provider by name, delivery statuses for the delivery log, other field changes - without them the door refuses every call). An aiAgent chat surface or an mcpbff exposure names this provider in `provider` and carries no credential of its own: its replies post with this provider's whatsappAccessToken, whatsappPhoneNumberId and whatsappApiVersion (chat bots are retired)

Secret keys (emailPass, sendGridApiKey, resendApiKey, awsAccessKeyId, awsSecretAccessKey, twilioAuthToken, vonageApiSecret, netgsmPassword, firebasePrivateKey, oneSignalApiKey, telegramBotToken, telegramWebhookSecret, whatsappAccessToken, whatsappAppSecret, whatsappVerifyToken) are masked in API responses and emitted to NOTIFICATION_PROVIDER_<NAME>_<KEY> env vars at codegen time.

MAIL NEVER SILENTLY FAILS FOR WANT OF A CREDENTIAL. The framework carries a BUILT-IN mock SMTP mail sink, and it is not a provider you declare, seed or maintain — there is no entry for it in this list and there is nothing to point at it. If the email provider a send selected has incomplete credentials at runtime (a required key unset in that deployment's environment), the framework routes that message to the sink instead of failing in the SMTP dialogue: the sink accepts the session and captures the message so email verification, password reset and any other mail flow can be exercised end to end without a real mailbox and without leaking mail to real addresses. A loud WARN names the bypassed provider and the missing variable NAMES; in production the boot report raises the same finding as an ERROR.

THE SINK REPORTS SUCCESS ONLY WHERE ITS HOST EXISTS. The sink is a real mock-SMTP endpoint the deployment must provide (infra requirement `mail-sink`: port 465, cleartext session, accepts any credentials or none, stores what it accepts readably) - it is NOT an in-process log-and-drop. Where an environment has not provisioned that host, every send to the sink FAILS with a named connection error and is retried; the error names the missing requirement, so do not read it as an outage of the provider you declared. On the deployed preview and stage environments the sink is dialled on port 587 in cleartext with the project codename as the SMTP user and a password the sink ignores (`ignored`) - the sink keeps each project's messages apart by that user; the build compiles this coordinate into the service environment (MAILSINK_PORT / MAILSINK_USER / MAILSINK_PASS), so there is nothing to configure. A service whose SendSmsAction sends to the built-in SMS sink because it names no `provider` in a project that declares no sms provider carries the same coordinate, since the SMS sink stores each SMS through it. `GET /v1/mail/mock-status` answers 'is mail sinking here, and why' in one call, and tells the two sink-engagement classes apart: `incomplete-credentials` (an email provider is declared but short of a key) versus `no-channel-match` (no declared provider serves email at all).

WHAT THIS MEANS WHEN YOU DESIGN. Declare the real provider you intend to use, with whatever credentials you have, or declare none at all — both work. There is NO placeholder to add and NO placeholder to remove before going to production: as soon as a provider's configuration is complete the fallback stops engaging for it, automatically, with no blueprint change. Do not invent a placeholder mail provider of your own, and do not treat the sink as a delivery mechanism — mail that reaches it was NOT delivered to its recipients.

ALWAYS DECLARE `kind`. It has a default (`email`), so an entry written without one validates clean at every level and then serves the wrong channel: the runtime resolver finds no provider for the send's channel and the message drains into the same mail sink an incomplete credential drains into - a missing channel TYPE and a missing CREDENTIAL become one silent behaviour. A defaulted kind is reported as the warning NOTIFICATION_PROVIDER_KIND_DEFAULTED, and the organization-level provider store refuses to store an item without one.

SMS FALLS BACK TO THE BUILT-IN SMS SINK OUTSIDE PRODUCTION. A real sms provider, when its credentials are set, is used on every deployment. When a `kind: sms` provider's credentials are NOT set, the send goes to the built-in SMS sink on the dev, preview and stage deployments: the sink stores each SMS in the mail sink above as one mail addressed to `sms-<digits of the number>@sms-sink.invalid`, subject `SMS to <number>`, so a tester reads sunk SMS in the same inbox as sunk mail and no second service is needed. Production has NO SMS sink: an sms provider with incomplete credentials fails the send there and the boot report names it. The SMS sink is not a provider you declare: declare the real sms provider you intend to use (with or without credentials). A `multi` entry is not routed to it when an event notification sends through it; a SendSmsAction that names a `multi` entry sends as sms and is routed like an sms provider.

A PROJECT WITH NO SMS PROVIDER SENDS EVERY SMS TO THE SMS SINK. Under the same rule as mail with no mail provider, a project that declares no sms-capable provider gets a framework-synthesised last-resort entry at build time, so mobile verification, mobile 2FA, reset-by-mobile, sms event notifications and a SendSmsAction without a provider all send to the SMS sink - on EVERY deployment, production included. Declaring a real sms provider takes precedence at once. Project validation raises ONE non-blocking warning, SMS_FLOWS_GO_TO_SINK, listing the SMS flows found, until an sms provider is declared (VERIFICATION_FLOW_MISSING_PROVIDER no longer fires for sms); the `smsSink` block of the mock-status answer reads `no-channel-match`. `GET /v1/mail/mock-status` reports it in its `smsSink` block.

WHATSAPP, TELEGRAM AND PUSH FOLLOW THE SMS SINK TABLE. A declared `kind: whatsapp`, `telegram` or `push` provider whose credentials are NOT set sends to that channel's built-in sink on the dev, preview and stage deployments and fails the send on production. A project that declares no provider of the channel (`multi` counts as declared) gets a framework-synthesised last-resort entry at build time (`__whatsappsink__`, `__telegramsink__`, `__pushsink__`), so an event notification of that jobType builds and sends to the sink on EVERY deployment, production included. Each sunk message is stored in the mail sink as one mail to `whatsapp-<digits>@whatsapp-sink.invalid`, `telegram-<chat id>@telegram-sink.invalid` or `push-<first 16 hex of sha256(device token)>@push-sink.invalid`. Project validation raises one non-blocking warning per channel (WHATSAPP_FLOWS_GO_TO_SINK, TELEGRAM_FLOWS_GO_TO_SINK, PUSH_FLOWS_GO_TO_SINK) listing those event notifications; `GET /v1/mail/mock-status` reports the sinks in `channelSinks` and lists a sunk provider with fallback `whatsappSink` / `telegramSink` / `pushSink`. The java and golang runtimes fail those sends loudly until their sinks are ported.

A PROJECT WITH NO EMAIL PROVIDER IS WARNED TOO. Every mail of a project that declares no email-capable provider goes to the mail sink on every deployment, production included, so project validation raises ONE non-blocking warning, MAIL_FLOWS_GO_TO_SINK, listing the mail flows found (email verification, reset by email, email 2FA, email2FARequiredForLogin, email event notifications), until an email provider is declared.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from EventNotification.providerName / send*Action.provider and the env-var prefix. Must be a valid codeName. |
| `kind` | `NotificationProviderKind` | no | `"email"` | `email`, `sms`, `push`, `telegram`, `whatsapp`, `multi` |  | The notification channel this entry serves. 'email' / 'sms' / 'push' are the traditional channels. 'telegram' / 'whatsapp' are chat platforms. 'multi' is for providers that span multiple channels (e.g. Twilio for SMS + WhatsApp). |
| `provider` | `NotificationProviderType` | no | `"smtp"` | 14 values, see [NotificationProviderType](#notificationprovidertype) |  | The backend provider implementation. Selects which keys are expected in `configuration` and which client module the codegen wires up. The (kind, provider) pair drives the per-channel client variant — e.g. (sms, twilio) emits a plain Twilio SMS client, while (whatsapp, twilio) emits the WhatsApp-channel variant. |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of provider-specific credentials and settings. The required keys depend on `provider` — see the NotificationProvider doc string for the per-provider key list. The UI enforces the right form fields per provider; agents emit only keys that match. Sensitive keys (passwords, tokens, secrets) are masked in API responses and emitted to environment variables at codegen time. |
| `chatHandling` | [`ChatHandlingSettings`](./ChatHandlingSettings.md) | no |  |  |  | OPTIONAL - deterministic chat handlers on this CHANNEL PROVIDER (kind `whatsapp` with provider `whatsapp`, or kind `telegram`; any other kind is refused with CHAT_HANDLER_PROVIDER_KIND_UNSUPPORTED). An ordered list of handlers answers inbound messages of the number or bot by calling a business API and replying from a template, with no AI agent in between: the FIRST handler that matches claims the message, BEFORE an agent surface or mcpbff exposure bound to the same provider sees it; a message no handler claims reaches that conversational consumer exactly as before. The notification service runs every handler (it hosts the WhatsApp door, the Telegram door of a provider no agent binds, and the handler topic `<codename>-chat-handler-inbound`); an agent host only claims a Telegram update and forwards it. Push prompts with choices (approve / reject) are declared here too and are answered by `promptReply` handlers. Leave it null and the provider behaves exactly as before. Generated for nodejs, rust and dotnet for now (CHAT_HANDLER_LANGUAGE_NOT_SUPPORTED otherwise; java waits for its WhatsApp ingress door). |

## Allowed values

### NotificationProviderType

`smtp`, `sendgrid`, `resend`, `amazonsns`, `amazonses`, `mailgun`, `postmark`, `twilio`, `vonage`, `netgsm`, `firebase`, `onesignal`, `telegram`, `whatsapp`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `kind`, `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `NOTIFICATION_PROVIDER_KIND_DEFAULTED` | warning | Notification provider "…" declares no "kind", so it is DEFAULTED to "email" rather than authored. |
| `NOTIFICATION_PROVIDER_KIND_UNSUPPORTED` | error | Notification provider "…" declares kind="multi" but provider="…" has no channel-spanning client: each of its channels (…) is a different call. |
| `NOTIFICATION_PROVIDER_MISSING_CONFIG` | warning | Notification provider "…" (provider=…) is missing recommended configuration key…: …. |
| `NOTIFICATION_PROVIDER_PUSH_PLATFORM_APP_MISSING` | warning | Notification provider "…" (provider=amazonsns, kind=push) has no "platformApplicationArn". |
| `RETIRED_NOTIFICATION_PROVIDER` | error |  |
