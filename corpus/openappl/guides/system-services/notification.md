---
title: Notification service
---

# Notification service

Notifications cover five channels (email, SMS, push, Telegram, WhatsApp) and one in-app
message kind. Configuration is two-tier: **named providers at the project level**, and
**event-triggered notifications on the `notificationService` module**.

The same providers are reachable from any business API via `SendMailAction` /
`SendSmsAction` / `SendPushNotificationAction` / `SendWhatsAppAction`.

## Project-level providers

```json
"projectSettings": {
  "notificationProvidersSettings": {
    "notificationProviders": [
      {
        "name":     "mainSendgrid",
        "kind":     "email",
        "provider": "sendgrid",
        "configuration": [
          { "name": "sendGridApiKey", "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "emailFrom",      "value": "no-reply@example.com" }
        ]
      },
      {
        "name":     "smsTwilio",
        "kind":     "sms",
        "provider": "twilio",
        "configuration": [
          { "name": "twilioAccountSid", "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "twilioAuthToken",  "value": "ENTER_CREDENTIAL", "secret": true },
          { "name": "twilioSender",     "value": "+15551234567" }
        ]
      }
    ]
  }
}
```

`kind` is the channel; `provider` is the backend. The pair is orthogonal: the same
backend (for example Twilio) serves multiple channels via separate entries
(`(sms, twilio)` and `(whatsapp, twilio)`). `configuration` items are `{ name, value }`
pairs, with an optional `secret` flag; a secret is never written into the blueprint
(a secret is a reference: `$ENV:NAME`, or the `ENTER_CREDENTIAL` placeholder while the value
is not provided yet; see [Secrets in a blueprint](../blueprint/secrets.md)).

The exact required `configuration` keys per provider are listed on the
[`NotificationProvider`](../../spec/NotificationProvider.md) page. Secrets are masked in API
responses and delivered to the generated service as per-provider environment values.

## NotificationService module

```json
"notificationService": {
  "serviceSettings": {
    "serviceOptions": {
      "defaultEmailProviderName": "mainSendgrid",
      "defaultSmsProviderName":   "smsTwilio",
      "defaultPushProviderName":  "fcmFirebase"
    }
  },
  "eventNotifications": [ "..." ]
}
```

Defaults under `serviceOptions` (`defaultEmailProviderName`, `defaultSmsProviderName`,
`defaultPushProviderName`, `defaultTelegramProviderName`, `defaultWhatsappProviderName`)
are used when an `EventNotification` doesn't override `eventNotificationBasics.providerName`.

## Event-driven notifications

```json
"eventNotifications": [
  {
    "eventNotificationBasics": {
      "name":          "welcomeEmail",
      "jobType":       "email",
      "isStored":      false,
      "triggerSource": "kafka"
    },
    "eventDataSettings": {
      "channel": "auth-user-created"
    },
    "targets": [
      {
        "targetName":       "newUser",
        "targetKind":       "userId",
        "targetPathInData": "id"
      }
    ],
    "template": {
      "name":            "welcome",
      "subjectTemplate": "Welcome <%= fullname %>",
      "bodyTemplate":    "<p>Hello <%= fullname %>, your account is ready.</p>"
    }
  }
]
```

`eventNotificationBasics.triggerSource`:

- `kafka` (default): `eventDataSettings.channel` names a Kafka topic (typically a DB-event
  topic from another service).
- `geofence`: fires when a tracked device crosses one of the named fences in
  `geofenceTrigger`. The compiler derives the underlying channel and synthetic crossing
  payload; authors don't set it.

`eventNotificationBasics.jobType` selects the delivery channel (`email`, `sms`, `push`,
`telegram`, `whatsapp`, `inApp`); `eventNotificationBasics.providerName` (optional)
overrides the matching default for that kind. `targets[]` extracts recipient identifiers
from the event data; `template` renders the body. The template body is EJS; its scope and
the required-locals rules are in [Notification template locals](notification-template-locals.md).

### How a user id becomes an address

A `userId` target (and every member of a `role` / `userGroup` audience) is looked up on
the auth user record, and the channel takes the first of these properties that the record
carries:

| `jobType` | properties, in order |
|---|---|
| `email` | `notificationEmail`, `email` |
| `sms` | `mobilePhone`, `phoneNumber`, `mobile`, `phone` |
| `whatsapp` | `whatsappPhone`, `whatsappNumber`, then the same phone list as `sms` |
| `telegram` | `telegramChatId`, `telegramHandle` |

`sms` and `whatsapp` read ONE shared phone list, so a user whose only number is the auth
`mobile` column is reachable on both. Declare `whatsappPhone` only when WhatsApp must go
to a different number.

A `role` / `userGroup` audience is expanded through the auth service's paged directory
APIs (`listUsersByRole`, `listUsersByUserGroup`). The expansion walks every page the
answer announces, so the audience is the whole membership; a failure on any page fails the
expansion visibly (an error log plus failed delivery rows), never a shorter audience. The
same holds when auth's answer cannot be walked to its end: a cursor it already returned, a
page that adds no new member while more pages are announced, or more pages than the safety
bound can need. One safety bound remains: a maximum audience size (default `10000`)
stops the walk, and reaching it writes an error log naming the role or group, the bound
and auth's reported member count.

A large audience also meets the per-message delivery budget (see
dependency reconnect (see [the compiler specification](../../compiler/index.md))). Recipients the budget
cuts get a **failed** log and delivery row and an error log line naming the userId (never
the address). The rows read like a delivered row: the userId, the channel, the event name,
the rendered subject and body (the event's shared render; a `renderPerRecipient` or
per-language template records its own fallback text rendered once with the event data),
and the address when the target supplied one. A userId recipient's address is not looked
up past the budget, since skipping that lookup is part of what the cut saves. Every budget
failure message starts with the reason token `[delivery_budget_exceeded]`, for a send that
was never started and for one abandoned mid-flight alike. Status stays `failed`, so find
who missed an event by that token. Cut recipients are **not** re-sent automatically. A
transient channel (no `isStored`) has no stored row for the admin resend either.

The recipients of one event are delivered with **bounded concurrency** inside that budget:
up to eight sends are in flight at once, started in audience order, and every send still
runs inside the budget. A 95-member staff audience at about 0.4 s per send needs about 38 s
one at a time (past a 25 s budget) and about 5 s at eight, so it is delivered in full. A
recipient whose delivery fails does not stop the others. Each recipient still gets its log
row and then its delivery row, but rows of different recipients may interleave.

Deployment settings tune this (names as used by the first compiler):

| Setting | Default | What it sets |
|---|---|---|
| `NOTIFICATION_SEND_CONCURRENCY` | `8` | sends of one EventNotification in flight at once for one event, for every provider without its own value |
| `NOTIFICATION_SEND_CONCURRENCY_<PROVIDER>` | the global value | the same, for one provider; `1` sends one at a time |
| `NOTIFICATION_DELIVERY_BUDGET_MS` | see dependency reconnect | the per-message delivery budget |
| `NOTIFICATION_PARTITIONS_CONSUMED_CONCURRENTLY` | `1` (at most 16) | lets the single consumer handle messages of different topics at once |

`<PROVIDER>` is the provider's name upper-cased, every character other than a letter or
digit written as `_`: provider `mainMail` reads `NOTIFICATION_SEND_CONCURRENCY_MAINMAIL`.
Values are positive numbers, rounded down and capped at 64. When a provider's account
limits concurrent connections or messages per second (a mailbox SMTP account that allows
only a few sessions, a sandboxed account, a WhatsApp number in a low messaging tier), set
its per-provider concurrency to what the account allows; otherwise its refusals show up as
failed rows. An audience too large even for concurrent sends still loses its tail on every
event: raise the concurrency or the delivery budget, knowing that a longer budget also
holds the consumer's other notification messages that much longer behind a wedged
provider. Keep `NOTIFICATION_PARTITIONS_CONSUMED_CONCURRENTLY` at `1` unless transactional
mails measurably wait behind a staff fan-out of another topic: raising it multiplies
provider load, and a message abandoned at the hard deadline may cause the other messages in
flight to be delivered again (at-least-once).

### Redelivery and the delivery dedup gate

Event delivery is at-least-once: an eviction, a hard deadline or a restart redelivers a
message and the handlers run again. A conforming service deduplicates each **delivery**
before it happens. Before a provider send (email, sms, push, telegram, whatsapp) or a
stored in-app row, the handler claims

`(event notification name, channel, recipient, dedup key)`

in a shared store with set-if-absent semantics and a TTL. The first claim delivers. A
later claim of the same identity inside the window is skipped, with an info log naming the
event, the channel and the userId (never the address).

- **Dedup key.** The default is the event envelope id, which stops exactly the redelivery
  of one event. `eventNotificationBasics.dedupKey` (an optional MScript) replaces it to
  deduplicate across events: for example, `data.orderId + ':shipped'` sends the shipped
  notice once per order and recipient even when two events announce it. The script is
  evaluated once per event, after the DataView read and `includeData`, with the same
  `this` and `data` as the condition. A null, empty or throwing value falls back to the
  envelope id. A constant value would suppress every later event for the same recipient
  for the whole window. The identity has no tenant part: a key that is unique only inside
  one tenant (a per-tenant order number) should include the tenant id when an address
  recipient can be shared across tenants. A non-envelope (external flat) message with no
  `dedupKey` value has no event identity and is delivered ungated.
- **Recipient.** The resolved userId (`u:<id>`), else the address (`h:<address>`). This is
  the same identity that dedupes recipients across targets. A push recipient is claimed
  once for all of its devices.
- **Window.** 24 hours by default; a deployment setting (`NOTIFICATION_DEDUP_TTL_SECONDS`)
  sets it, values above 30 days clamp, invalid values use the default, `0` turns the gate
  off.
- **A failed delivery gives its claim back**, so a later redelivery may try again: a
  provider send that throws (including one abandoned by the delivery budget), a push
  recipient none of whose devices received it, or an in-app row that could not be written.
  A successful delivery keeps its claim until the TTL ends. A process that dies between the
  claim and the send loses that one delivery for the window. This is the price of claiming
  before the send instead of after it.
- **A missing store fails open.** With no shared store, or a claim that throws or gets no
  answer within 1 s, the delivery goes out ungated and one warning per message says so. A
  lost notification is worse than a rare duplicate.
- **Stored rows keep their own dedup.** In-app and push rows are still unique on
  `(dedupeKey = <envelope id>:<event name>, userId, channel)` in the database. That index
  is permanent and per envelope, and it stays the backstop when the gate fails open. A
  custom `dedupKey` does not change it.

The claim key hashes the whole identity, so no address or user id is stored in it. A target
that does not apply the gate yet draws the `NOTIF_DEDUP_KEY_NOT_EMITTED` warning when a
`dedupKey` is declared.

A notification rendered from the DB events of an object moderated with
[`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace` (or from a
DataView document over it) delivers the row's content whatever its moderation status:
events are a system channel, not a gated read. Filter on the payload's `moderationStatus`
(a target's `condition`) when recipients must not see unapproved content. A `staged`
object publishes its DB events only once a write is accepted.

### Moderating the content before it is sent

An event notification whose content comes from users (a comment, a message, a review) can
be judged by a [decision provider](../capabilities/decision-layer.md) before it goes out:

```json
"contentModeration": {
  "enabled": true,
  "providerName": "mainJev",
  "policy": "No insults, no contact details, no links to unknown sites."
}
```

The **rendered** content is judged right before the first send, on every channel, once per
distinct rendered text however many recipients it fans out to. An `accept` is sent
unchanged; a `review` holds it (nothing is sent, one `sys_NotificationModerationReview` row
records the content and its recipients, and each recipient's log row says `queued`) until a
reviewer's `acceptNotificationModeration` sends it; a `reject` and a provider failure are
never sent. `exemptRoles` and `messageTypes` do not apply to a notification
(`CONTENT_MODERATION_INERT_OPTION`). The direct `send*Action`s of a Business API are not
moderated. The full behaviour is in
[Object content moderation, outbound notification content](../capabilities/object-moderation.md).
See [`ContentModeration`](../../spec/ContentModeration.md).

## Per-language templates

A template may carry per-language **variants**:

```json
"template": {
  "name": "shiftAssigned",
  "subjectTemplate": "Shift assigned",
  "bodyTemplate": "You are on the night shift.",
  "variants": [
    { "language": "tr", "subjectTemplate": "Vardiya atandi", "bodyTemplate": "Gece vardiyasindasiniz." }
  ]
}
```

The service renders each declared variant **at most once per event**, never once per
recipient, and then maps each recipient onto a variant by their language. Two recipients
whose tags are `tr` and `tr-TR` share one render: a regional tag falls back to its base
subtag, and matching is case-insensitive.

**The template's own `subjectTemplate` / `bodyTemplate` stay as a mandatory fallback.** A
recipient whose language matches no variant renders them. Adding a variant to a shipped
template is therefore additive: nobody loses a message.

Selection is **whole-template**. A recipient gets both slots from their variant or both
from the fallback, never one of each: a variant that declares only a body renders an empty
subject rather than borrowing the fallback's, and design time warns
(`NOTIF_VARIANT_SLOT_MISSING`) when that is what a declaration says.

### Where the recipient's language comes from

From the auth user record, through the first of `preferredLanguage`, `language`, `locale`,
`lang` that it carries. **None of those is a standard auth field**: declare the one you use
in `authentication.userProperties[]` and set it when the user picks a language. If the
project declares none of them, every recipient resolves no language and takes the
fallback: the delivery succeeds, in the wrong language, with nothing in the logs saying
why, which is why design time warns about it (`NOTIF_VARIANT_NO_LANGUAGE_SOURCE`).

The lookup rides the same cached user fetch the contact-handle lookup already performs for
that recipient, so a language costs no extra round trip.

### `renderPerRecipient`: the per-recipient opt-in

`template.renderPerRecipient: true` moves the render INSIDE the fan-out, once per
recipient, and is the only thing that binds `recipient` in template scope:

| key | value |
|---|---|
| `recipient.userId` | the resolved user id, or null |
| `recipient.handle` | the address this delivery uses |
| `recipient.language` | the SELECTED variant, or null for the fallback |
| `recipient.channel` | this event's `jobType` |

Turn it on only for genuine per-recipient personalization. Per-language text does **not**
need it (that is what `variants` is for), and a hundred-recipient reminder event pays a
hundred EJS renders for it. Design time says so (`NOTIF_RENDER_PER_RECIPIENT_UNUSED`) when
no slot reads `recipient`.

Reading `recipient` WITHOUT the opt-in is a render-time `ReferenceError`, and the delivery
is refused rather than sent with a hole in it. The design-time
`NOTIF_TEMPLATE_UNRESOLVED_ROOT` warning names the flag.

> A `data-lang` span plus a regex language picker in one template is superseded by
> variants. Email in particular cannot branch on a span, so under that convention every
> recipient received both languages stacked.

## WhatsApp templates

WhatsApp delivers free-form text only inside the 24-hour customer-service window, the 24
hours after the recipient last wrote to you. Outside it the provider refuses the message
(Meta error 131047, Twilio error 63016) after the API has already accepted the request. The
recipient never gets the message; the delivery row turns `failed` only when the status
webhook below is configured, otherwise it keeps `success`. An order, shipment, refund or OTP
notice is business-initiated, so it has to be sent as an approved template.

Declare the template on the notification template with `whatsappTemplate`:

```json
"template": {
  "name": "orderShipped",
  "subjectTemplate": "Order shipped",
  "bodyTemplate": "Your order <%= orderNumber %> has shipped.",
  "whatsappTemplate": {
    "name": "order_shipped",
    "language": "en",
    "components": { "js": "[this.payload.customerName, this.payload.orderNumber]" }
  }
}
```

- `name` is the approved template name (Meta: `^[a-z0-9_]+$`) or, for a Twilio provider,
  the Content SID (`^HX[0-9a-f]{32}$`). It is case-sensitive and never rewritten. The
  format is checked against the event's resolved provider at design time
  (`WHATSAPP_TEMPLATE_NAME_INVALID`, error).
- `language` is the Meta language code. It defaults to the selected variant's language
  (`pt-BR` is sent as `pt_BR`), and to `en` otherwise.
- `components` (Meta) and `contentVariables` (Twilio) are MScripts. They are evaluated once
  per event, with the same receiver as `includeData`: `this.payload`, `this.dataSource`,
  `this.old`, `this.actor`, `this.metadata`, and the bare `data`. For Meta, an array of
  plain values is shorthand for the body parameters `{{1}}`, `{{2}}`, and so on. For
  Twilio, an array is numbered from 1. If a script throws, the delivery fails and the
  failure rows name the slot. Nothing is sent as free-form text in its place.

The provider sends the template instead of the rendered subject and body. Meta receives
`{ type: 'template', template: { name, language: { code }, components } }`, and Twilio
receives `{ contentSid, contentVariables }` with no body. The rendered text still goes to
the notification log.

A variant can declare its own `whatsappTemplate` when its language uses a different
template name or Content SID. A variant without one inherits the template's block, with the
variant's language as the default code. See
[`NotificationWhatsAppTemplate`](../../spec/NotificationWhatsAppTemplate.md) for the
remaining properties (`category`, `body`, `header`, `footer`, `buttons`, `samples`).

A whatsapp notification with no `whatsappTemplate` raises the design-time warning
`WHATSAPP_FREEFORM_OUTSIDE_WINDOW`. `SendWhatsAppAction` has the same warning and uses
`template`, `templateLanguage` and `templateVariables` for the same send. `templateLanguage`
and `templateVariables` are read only when `template` is set; without it they raise the
warning `INERT_OPTION`. Not every compiler target implements template sends; a target that
does not sends free-form text.

## In-app notifications

With `notificationService.serviceSettings.serviceOptions.storedNotice: true`, the service
emits these user routes:

- `GET /notifications` (`listMyNotifications`) lists the caller's stored notifications.
- `POST /notifications/:notificationId/seen` (`markNotificationSeen`) requires no request
  body and writes the constant `isSeen=true` to the caller's notification.

Both require login and apply ownership checks. `listMyNotifications`, and the device list
`GET /devices` (`listMyDevices`), also pin `userId` to the session user in their own where
clause, so they return only the caller's rows for every caller, `superAdmin` included (the
absolute-role bypass of the ownership filter does not widen a "My" list). An operator reads
other users' notifications through `GET /admin/notifications`. There is no bulk
mark-all-read route. The admin surface includes `GET /admin/notifications`
(`listAllNotifications`), `GET /admin/delivery-logs` (`listDeliveryLogs`), and
`POST /admin/notifications/:notificationId/resend` (`resendNotification`).

Resend reads the stored notification through the admin gate (`superAdmin` or `admin`) and
sends its stored subject/body through its named provider once. The response keeps the stored
notification and adds `deliveryLog`: `deliveryLog.id` identifies the new attempt, and
`messageId` contains the provider's correlation ID when supplied. Every invocation creates a
fresh attempt; the route does not automatically retry ambiguous timeouts. `status: success`
means provider acceptance; it does not prove recipient delivery. `attemptedAt` records the
attempt start. Failed sends have `status: failed`, an `errorMessage`, and no `deliveredAt`
or `readAt`. Provider acceptance also leaves these delivery timestamps empty until a
supported provider status arrives. The stored notification, including its historical
`deliveredAt` and `isSeen`, is unchanged. A failed audit insert fails the request without
repeating the send.

Email, SMS, Telegram and WhatsApp resolve the stored owner's current contact through the
normal identity reader. Resend uses the stored text without re-rendering the source event or
recreating approved WhatsApp templates; the provider can refuse a free-form WhatsApp message
outside its allowed window. Push requires exactly one registered device: zero or multiple
tokens produce a failed attempt without sending to an arbitrary device or broadcasting. An
in-app resend creates an audit result without an external send. The delivery-log route is
also emitted with storage disabled; the other four notification routes require storage.

Stored rows require a resolved user ID. Unattributed alerts are not stored as admin-visible
notifications: that would require a separate ownership and visibility model. Delivery
diagnostics belong in notification logs.

Newly stored notification rows keep the event record's flat fields, `actionDeepLink`,
`actionText`, and the values explicitly declared in `eventDataSettings.includeData`. Their
metadata omits `_old` and the DataView document at `dataSource`. `_actor` contains only
`userId` and `displayName`: the supplied actor's `fullname`, then its `name`/`surname` pair,
then `email`. An actor with no supplied name has `displayName: null`; ordinary event
envelopes carry identity only and storing a notification does not fetch the actor's user
profile. An event without an actor retains `_actor: null`. Conditions, subject/body
rendering, and providers still receive the full context; this projection happens only when
the notification row is written. A frontend that needs a value from `_old` or `dataSource`
declares it as a named `includeData` value instead.

### DataView visibility and conditions

A view of the event's OWN row is read until its source version reaches the event's
`updatedAt`, bounded by a wait (default 5000 ms, at most 30000; `0` reads the view once and
never waits). At the bound, or on a read failure, the handler warns and uses the event
record instead of an old projection. A view keyed by another row (a parent or roster view)
is used on the first read.

Pure expression conditions that read only `this.payload` are evaluated before the DataView
read. A false condition performs no read and creates no failure row. Conditions using
`data`, `this.dataSource`, other context members, calls, or statements retain evaluation
after the read. Targets and templates still receive the fetched view when a payload
condition passes.

## Direct-send actions from a business API

For "fire-and-forget from inside an API workflow", use the dedicated action types:

| Action | Channel |
|--------|---------|
| [`SendMailAction`](../../spec/SendMailAction.md) | email |
| [`SendSmsAction`](../../spec/SendSmsAction.md) | SMS |
| [`SendPushNotificationAction`](../../spec/SendPushNotificationAction.md) | push |
| [`SendWhatsAppAction`](../../spec/SendWhatsAppAction.md) | WhatsApp |

Each action accepts a `provider` field (the named entry to use) plus the channel-specific
payload.

## Delivery-log retention

`notificationService.serviceSettings.serviceOptions.logRetentionDays` controls database
retention of `notificationLog` send-attempt rows. Set a positive integer such as `90` to
hard-delete rows whose `createdAt` is strictly older than that many days. New projects start
with `90`; the pattern default is `null`. Unset or `null` keeps the existing database
history and emits no sweep.

The service's scheduler runs a `notificationLogRetention` job hourly in UTC, on one replica
per scheduled tick. Each tick processes a bounded number of rows (10,000); a remaining
backlog continues on the next tick. The delete also maintains the search index and caches.
Operators can inspect the job and its runs through the standard cron-job admin routes.

This setting never deletes user-facing `notification` rows or `notificationDeliveryLog`
rows, and never truncates rendered subject or body. The separate
`notificationLogRetentionDays` setting (default `7`) controls search-index retention; it
does not expire database rows.

## Failure handling

### A template that cannot render is refused, not sent blank

Before a template is rendered, the service compares the required locals recorded for it
against the metadata the handler bound. If any required local is absent, the render is
refused with `renderErrorCode: 'NOTIF_TEMPLATE_MISSING_LOCAL'` and the names in
`missingLocals`, and the handler records a `failed` delivery whose reason NAMES them.
Nothing is sent and nothing is stored, including when the other slot rendered fine, because
a mail whose subject silently lost its only interpolation is worse than no mail.

A key bound to `null` counts as present. A local the template guards with `typeof` is
optional and never refused. Any OTHER render error keeps the older behaviour: both slots
empty because of it means a failed delivery, and a partial failure still delivers. See
[notification template locals](notification-template-locals.md) for the exact definition of
a required local, and for the matching design-time warnings
(`NOTIF_TEMPLATE_UNRESOLVED_ROOT`, `NOTIF_TEMPLATE_ROOT_NOT_IN_CONTEXT`).

### Provider send contract

Every provider adapter follows the same contract:

- **Success**: the send resolves with `{ success: true, provider, messageId }`. The upstream
  provider accepted the request. (That is "accepted", not "delivered to the recipient's
  device": delivery itself is asynchronous on every provider; treat a successful result as
  the hand-off, not as proof of inbox.) `messageId` is the id the provider assigned to the
  accepted message, verbatim, and is absent when the provider returns none. See
  [Delivery log and provider message ids](#delivery-log-and-provider-message-ids).
- **Failure**: the send raises a `NotificationSendError` carrying:
  - `provider`: the configured provider name (matches `notificationProviders[].name`);
  - `providerKind`: `email` / `sms` / `push` / `telegram` / `whatsapp`;
  - `cause`: the original exception or transport rejection, preserved for diagnostics;
  - `code`: a coarse error code (below);
  - `name === 'NotificationSendError'`, for cross-boundary checks.

The `code` enum lets a workflow's `onActionError` branch react without parsing message
strings:

| `code` | Meaning |
|--------|---------|
| `auth_error` | Provider credentials are wrong, expired, or revoked. |
| `rate_limited` | Provider returned 429 or its throttling exception. Retry after backoff. |
| `invalid_recipient` | Bad recipient identifier (phone number, email address, push token, Telegram chat id, ...). The send will never succeed without a corrected target. |
| `http_error` | Network or transport-layer failure, classified before the provider's own error. |
| `provider_error` | Provider-side error that the adapter couldn't classify finer. Inspect `cause`. |
| `unknown` | Reserved; not currently emitted. |

### Delivery log and provider message ids

The notification service's event handlers write one `notificationDeliveryLog` row per send
attempt, on success and on failure. A success row carries:

- `status: 'success'`, `channel`, `attemptedAt`, and `notificationLogId` (the
  `notificationLog` row for the same attempt, which holds the rendered message and the
  recipient).
- `providerName`: the client that actually sent. A send redirected into the built-in mail
  sink is recorded as `__mailsink__`, not the provider that was bypassed.
- `messageId`: the provider-assigned id of the accepted message. This is the correlation
  key for provider-side events: an SES bounce, complaint or delivery notification names the
  SES `MessageId` and nothing else the service stores, so look the delivery row up by
  `messageId`. It is null on a failed attempt and for a provider that returns no id.
- `deliveredAt`, `readAt`: WhatsApp only: when the provider reported the message delivered
  to the recipient's device, and read. Null until the `delivered` / `read` status arrives
  (a recipient with read receipts turned off never produces `read`), and on every other
  channel. A failed row receives no new timestamp; any previously recorded `deliveredAt` or
  `readAt` remains. See [WhatsApp delivery status](#whatsapp-delivery-status).

Each successful send also logs one structured line,
`[<eventName>] notification delivered {"event", "channel", "providerName", "messageId",
"userId", "notificationLogId"}`, carrying the same fields. The recipient address is not in
the line.

What each adapter returns as `messageId`:

| Provider | `messageId` |
|----------|-------------|
| `amazonses` (email) | SES `MessageId` from `SendEmail` |
| `amazonsns` (sms / push) | SNS `MessageId` from `Publish` |
| `smtp`, and the built-in mail sink | the RFC 5322 Message-ID, angle brackets included |
| `sendgrid` | `x-message-id` response header |
| `resend` | `data.id` |
| `mailgun` | `id` from the response body |
| `postmark` | `MessageID` from the response body |
| `twilio` (sms / whatsapp) | message SID |
| `vonage` | message id of the first message part |
| `netgsm` | `jobid` from the response body |
| `firebase` | FCM message name, `projects/<project>/messages/<id>` |
| `onesignal` | notification `id` (absent when nobody was subscribed) |
| `telegram` | `result.message_id`, as a string |
| `whatsapp` (Meta Cloud API) | `messages[0].id` (the `wamid`) |

A `SendMailAction` / `SendSmsAction` / `SendPushNotificationAction` / `SendWhatsAppAction`
runs in a business API's own service, which has no `notificationDeliveryLog` table. It
writes no row; on success it logs `[<actionName>] notification delivered {"action",
"channel", "providerName", "messageId"}` instead. A provider that returns no message id
leaves `messageId` null. Only an accepted send produces the delivered log; a false result or
exception does not. The action retains its boolean result and error propagation, and the log
excludes recipients and payloads. This records provider acceptance, not arrival in the
recipient's inbox.

### WhatsApp inbound dispatcher: one door per provider

Meta sends everything about a WhatsApp number to ONE callback URL: inbound customer
messages (an AI agent's or the MCP-BFF assistant's), the delivery statuses of this
service's own sends, and other field changes. The notification service is therefore
generated whenever the project declares a Meta WhatsApp provider OR binds a WhatsApp chat
surface (an agent surface, an MCP-BFF exposure), and mounts exactly one door per Meta
WhatsApp provider:

```
GET  /v1/whatsapp-webhooks/meta/<providerName>   (Meta subscription handshake)
POST /v1/whatsapp-webhooks/meta/<providerName>   (every webhook of the number)
```

One provider = one Meta app secret = one door. The POST is verified with THAT provider's
`whatsappAppSecret` over the raw request bytes (`X-Hub-Signature-256`; an unknown name is
404, a missing secret 503 `WHATSAPP_INGRESS_NOT_CONFIGURED`, a bad signature 403
`WHATSAPP_INGRESS_UNVERIFIED`); the GET echoes `hub.challenge` only when `hub.verify_token`
matches `whatsappVerifyToken`. The body is split per message, per status and per other
field change, and every item is routed per provider over the event bus:

| Item | Topic | Consumer |
|---|---|---|
| a message of `value.messages[]` | `<codename>-whatsapp-inbound-message` | the agent surfaces and MCP-BFF exposures that name the provider (`chatSurfaces[].provider`) |
| a message a [chat handler](../capabilities/chat-handlers.md) of the provider claims | `<codename>-chat-handler-inbound` | this service's handler consumer (below) |
| a status of `value.statuses[]` | `<codename>-whatsapp-inbound-status` | this service's delivery-log consumer (below) |
| any other field change | `<codename>-whatsapp-inbound-other` | none built in |
| a message of a provider nothing is bound to | `<codename>-whatsapp-inbound-unrouted` | none; logged as a warning, never dropped, never a 4xx |
| an explicit `notificationService.whatsappIngress.routes[]` entry | `<codename>-whatsapp-route-<name>` | whatever the author subscribes |

Meta gets 200 only after every event of the body is on the bus; a publish failure answers
503 so Meta redelivers. The door spends at most a publish budget (default 3000 ms, kept well
inside Meta's callback timeout) publishing one body: when the budget runs out before every
event is published it answers 503 `WHATSAPP_INGRESS_PUBLISH_BUDGET_EXCEEDED` and marks
nothing as deduplicated, so the redelivery publishes the unmarked events again (an event
the bus did take in the meantime is a duplicate for every consumer through the deterministic
envelope id). Dedup is a key on the Meta id (wamid, `wamid:status`), marked only after the
publish; the envelope `id` is derived from the same key and the message key is the
`phone_number_id`, so a redelivery is a duplicate at every consumer and one number's events
keep their order. Each event carries the item, `providerName`, `phone_number_id`, the raw
body (base64) and the signature header. The hosting platform reports each provider's
absolute URL for the Meta callback; registering the URL with Meta is the owner's step.

The former per-provider notification-webhook route is REMOVED for Meta providers (it stays
for Twilio, below): set the Meta callback URL once to the provider's door. See
[`WhatsAppIngressSettings`](../../spec/WhatsAppIngressSettings.md) for explicit routes and
[AI chat surfaces](../capabilities/ai-chat-surfaces.md) for the chat side.

### Chat handlers

A channel provider (WhatsApp Meta or Telegram) can declare deterministic
[chat handlers](../capabilities/chat-handlers.md) in `chatHandling`. The notification
service is the **host of every handler**, for both channels, and is generated whenever the
project declares them (a Telegram provider with handlers and no agent is enough). It:

- claims a WhatsApp message at the door above and publishes it to
  `<codename>-chat-handler-inbound` instead of the agent's topic;
- mounts `POST /v1/telegram-webhooks/<providerName>` for each Telegram provider with
  handlers that no agent surface or MCP-BFF exposure binds (an agent host claims the
  updates of its own bot and publishes them to the same topic);
- consumes that topic, runs each handler at most once, resolves the sender through auth,
  calls the business API over its REST route as that user, and replies with the provider's
  credentials;
- sends the choices of a prompt notification (reply buttons, a list, a template's
  quick-reply buttons, a Telegram inline keyboard) and stores the owner-bound record a tap
  refers to.

Chat-handler hosting is not implemented by every compiler target; see
[the compiler specification](../../compiler/index.md).

### WhatsApp delivery status

Meta and Twilio can accept a WhatsApp message and refuse it later: a free-form message
outside the 24-hour window (Meta 131047, Twilio 63016), a paused or disabled template, an
undeliverable number (Meta 131026). The refusal arrives as a status webhook:

- Meta: through the provider's door above, applied by this service's status consumer. The
  door has already answered Meta 200, so the consumer holds the only copy and never drops
  it: a store failure is retried 3 times (500 ms, then 1 s); a status still failing goes to
  a dead-letter topic (`<codename>-whatsapp-inbound-status.dlq`) with the failure detail and
  the `originalEvent`. When the dead-letter publish fails too, the consumer holds the
  message, does not commit the offset and keeps trying with backoff until one succeeds. To
  replay a dead letter, publish its `originalEvent` unchanged to
  `<codename>-whatsapp-inbound-status` as the raw record value (not through a publisher that
  wraps it in a new envelope); the transition is idempotent (`success -> failed` only, keyed
  by provider and message id), so a replay never applies twice.
- Twilio: on the provider-named status route that stays for Twilio only, because its URL is
  built by this service per send and never pasted into a dashboard:

```
POST /v1/notification-webhooks/whatsapp/<providerName>   (Twilio only)
```

| Provider | Needs | Check |
|---|---|---|
| Meta (`whatsapp`) | `whatsappAppSecret` (POST), `whatsappVerifyToken` (GET), on the door | `X-Hub-Signature-256` HMAC-SHA256 over the exact raw request bytes; the GET echoes `hub.challenge` only when `hub.verify_token` matches |
| Twilio | `twilioAuthToken`, the service's public URL | `X-Twilio-Signature` over the callback URL built from the service's public URL (base path kept, never the request's Host) plus the form parameters |

On the Twilio route a missing key answers 503 `WHATSAPP_STATUS_WEBHOOK_NOT_CONFIGURED`, a bad
signature 403 `WHATSAPP_STATUS_WEBHOOK_UNVERIFIED`, an unknown (or Meta) provider name 404.
Placeholder values (`ENTER_CREDENTIAL`, ...) count as missing (see
[Secrets in a blueprint](../blueprint/secrets.md)).

What the event handlers send so the status comes back: a Twilio send carries a
`statusCallback` of the service's public URL plus
`/v1/notification-webhooks/whatsapp/<providerName>` (the same string the signature is
checked against; no callback when the public URL is unset). A Meta send carries a fixed
opaque callback tag, and the Meta webhook itself is subscribed once in the Meta app
dashboard (the provider's door, verify token = `whatsappVerifyToken`, field `messages`). A
`SendWhatsAppAction` in a business API writes no delivery row and requests no status.

What a status does to the delivery row, found by `providerName` + `messageId`:

- Meta `failed`, Twilio `failed` / `undelivered`: the row moves from `success` to `failed`,
  and `errorMessage` holds the provider error (code, title, message; scrubbed of
  credentials, at most 500 characters). A repeat does nothing, and a recorded failure is
  never moved back.
- `delivered` (Meta and Twilio): sets `deliveredAt` on the `success` row. `read`: sets
  `readAt`, and also `deliveredAt` when it is still empty (a read message was delivered).
  The time is the provider's own status time when it sends one (Meta `timestamp`), otherwise
  the time the status was received (Twilio). Each field is set only while it is empty, so a
  repeated or out-of-order status never moves a timestamp backwards and never clears one; a
  `delivered` arriving after a `read` changes nothing. A row that already recorded a failure
  is never stamped, and a `delivered` / `read` for a `messageId` with no row is dropped.
  `status` stays `success`: it still means "accepted"; the two timestamps say how far the
  message got.
- `sent` (and Twilio `queued` / `sending`): ignored.
- A Meta status for another phone number than the provider's `whatsappPhoneNumberId`, or a
  Twilio status for another `AccountSid`, is ignored.
- More than one row with the same key: nothing changes (ambiguous).
- A failure that arrives before its row exists (the send has returned but the row is not
  written yet) is stored as an early `failed` row whose `errorMessage` starts with
  `[early-provider-status]`. When the handler writes the success row it takes over the
  failure and the early row is removed. For Meta this applies only to messages carrying the
  callback tag above.

The delivery log is not tenant-scoped; the row the callback finds is the scope, and nothing
in the callback selects another. Only the delivery row changes; the `notificationLog` row of
the attempt keeps its status.

### Reacting from a workflow

`BusinessApiAction.onActionError` controls workflow behaviour when an action, including
`SendMailAction` / `SendSmsAction` / `SendPushNotificationAction` / `SendWhatsAppAction`,
throws:

- `onActionError: 'throwError'` (default): the workflow aborts; the HTTP response is the
  action's failure. Use when notification delivery is critical (transactional MFA codes,
  payment receipts).
- `onActionError: 'completeApi'`: the workflow catches the throw, exposes the error as
  `this.<actionName>Error`, and continues. The downstream actions can read
  `this.<actionName>Error.code` and branch (example below):

Both actions live in the business API's action store (`actions.sendMailActions[]` and
`actions.validationActions[]`) and are referenced from its `workflow`:

```json
{
  "actions": {
    "sendMailActions": [
      {
        "name": "sendWelcome",
        "provider": "mainSendgrid",
        "to":      { "js": "this.context.user.email" },
        "subject": { "js": "'Welcome'" },
        "body":    { "js": "this.renderedHtml" },
        "onActionError": "completeApi"
      }
    ],
    "validationActions": [
      {
        "name": "queueRetry",
        "condition": { "js": "this.sendWelcomeError && this.sendWelcomeError.code === 'rate_limited'" },
        "validationScript": { "js": "true" },
        "shouldBeTrue": true,
        "checkType": "liveCheck"
      }
    ]
  }
}
```

The second action runs downstream of the first and reads `this.sendWelcomeError.code` to
branch.

Use `completeApi` for best-effort fan-out (marketing emails, optional push notifications)
where the API should still report success even when one channel drops.

`EventNotification` (the project's event-driven notifications) treats throws as the
listener's failure: the matching event listener records the error and applies the retry /
dead-letter policy of the standard listener semantics.

## Geofence-triggered notifications

A first-class option. Geofences are runtime data (managed via a `GeoFence` data object the
compiler emits); each `EventNotification` with `triggerSource: "geofence"` matches a set of
fences via `fenceTags` / `fenceFilter` ([`GeofenceTrigger`](../../spec/GeofenceTrigger.md)).
The generated service detects entry, exit and dwell events at runtime.

The admin create and update routes require the fields for the selected fence kind: a circle
needs its centre and a positive radius, a polygon needs at least three numeric `{lat,lng}`
vertices in `polygonJson`, and country or admin-area fences need `isoCountry`. An incomplete
shape answers `400 GeoFenceShapeRequired` before writing. A partial update is checked
together with the stored fields. `createdBy` is stamped from the creating administrator and
preserved on updates.

`POST /admin/geofences/:geoFenceId/test-trigger` creates a synthetic crossing audit row for
the body `userId`. Send `action` (`enter`, `exit`, or `dwell`), `lat`, and `lng` along with
that target user. Coordinates must be finite and within latitude/longitude bounds; zero is
valid. For example:

```json
{"userId":"22222222-2222-4222-8222-222222222222","action":"enter","lat":0,"lng":29.1}
```

The fence comes from the URL and its name is copied from the stored fence; body `fenceId`
and `fenceName` cannot redirect or rename the event. An unknown fence returns 404. The
event's `userId` is its subject; its `createdBy` owner is the calling administrator,
regardless of body `createdBy`. The route still requires an `admin` or `superAdmin` session.
Detector writes without a session may leave `createdBy` null. Existing audit rows are not
backfilled.

`POST /geofences/:fenceId/event` also binds the URL fence and snapshots its name, but always
records the calling user as both subject and creator. It ignores body `userId` and
`createdBy` and requires that caller's consent. These create routes write crossing audit
rows; detector-driven notification publication remains part of processing location reports.

`POST /location/consent` creates the caller's consent row with status 201, or updates the
existing row with status 200. `givenAt` records the latest grant time; an explicit opt-out
clears it, and an absent/null flag preserves it. `DELETE /location/consent` removes the
caller's row and returns `optedIn: false` and `givenAt: null`, describing the revoked state.

For how the generated service implements these routes and the detector, see
[the compiler specification](../../compiler/index.md).

## See also

- [Notification template locals](notification-template-locals.md).
- [The decision layer](../capabilities/decision-layer.md): `contentModeration` and the rest
  of the decision pattern family.
- Patterns: [`NotificationProvider`](../../spec/NotificationProvider.md),
  [`NotificationProvidersSettings`](../../spec/NotificationProvidersSettings.md),
  [`NotificationService`](../../spec/NotificationService.md),
  [`EventNotification`](../../spec/EventNotification.md).
