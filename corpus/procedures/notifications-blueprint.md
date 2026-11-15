# Notifications module authoring — core procedure

Harness-agnostic. Every step names the blueprint path it reads or edits. Extracted
from the Ada corpus (#4400); provenance and translation notes in
`../README.md`. Companion to `blueprint-authoring.md` — its tool semantics
(section 3), authoring loop (section 9), MScript descriptor rule, and
result discipline apply here unchanged. This guide covers only what is
DIFFERENT about the notifications module.

**Task shape.** You are given the project's `notification-definitions`
(the design document `design/notification-definitions.md`, written in the design phase) and the current
blueprint state. You wire the `notificationService` module — one
event-notification per definition — binding payload views to the live
`bffService` DataViews, validate clean, and prove completeness against the
spec.

**Lifecycle position: Phase 4, AFTER the BFF module is authored and
built** (`project-lifecycle.md`) — payload views reference DataView shapes,
so the views must exist before this task binds to them. Gated by
`hasNotifications` in `project-basic-setup`. Unlike the old
parallel-apply regime, you verify `dataViewName` references against the
LIVE `bffService/dataViews` state, not against a plan document.

## 1. Scope rules (carried from the corpus)

- **Event-level, not concept-level.** Each notification corresponds to
  exactly ONE business event: `orderCreated`, `paymentConfirmed`,
  `messageReceived` — never a grouped `orderActivity`.
- **Auth flows are out of scope.** Password reset, verification codes,
  login alerts, session events are handled by the auth service — never
  define notifications for them. A welcome email on a business event IS in
  scope.
- **Email is the default channel.** The spec normally collapses channels
  to email; honor its channel column as written. A definition genuinely
  listing multiple channels (rare — time-critical alerts) becomes N
  separate event-notifications, one per channel.
- **Targets are real.** Target roles/recipients come from the spec and
  must resolve to something the project actually has (a field on the
  payload view, or a real declared role value) — never invent.

### Structural map — how it differs from the generic service shape

The module lives at the project-root path `notificationService` (NOT under
`services/`). Top-level pattern `NotificationService` — two chapters:

| Blueprint path | Pattern | What it holds |
|---|---|---|
| `notificationService/serviceSettings/serviceOptions` | `NotificationServiceOptions` | `storedNotice`, `notificationLogRetentionDays`, default provider bindings (below) |
| `notificationService/serviceSettings/documentation` | `ModuleDocumentation` | `frontendDocument` — UX-intent prose (section 5) |
| `notificationService/eventNotifications/<Name>` | `EventNotification` | one named item per notification × channel |
| `... /<Name>` → `eventNotificationBasics` | `EventNotificationBasics` | `name`, `description`, `isStored`, `jobType` (the channel), `triggerSource`, optional `providerName` override, `actionDeepLink`, `fromUser` |
| `... /<Name>` → `eventDataSettings` | `EventDataSettings` | `channel` (Kafka topic), `dataViewName`, `dataViewIdPathInPayload`, `condition`, `includeData` |
| `... /<Name>` → `template` | `NotificationTemplate` | `name`, `subjectTemplate`, `bodyTemplate`, `parser` (`ejs` default) |
| `... /<Name>/targets/<TargetName>` | `NotificationTarget` | recipient resolution — one named item per target |

The path segment is `targets`, NOT `notificationTargets`; the template
section is singular `template`, NOT `templateSettings`. The generated
service builds under the system service name **`notification`**.

### Providers — bound in Phase 1, referenced here by name

The module does NOT carry provider credentials or per-provider settings
blocks. Channel providers live in
`projectSettings/notificationProvidersSettings` and were created in Phase 1
(org-registered integrations; credentials blank/managed). Here you only
BIND by codename: `serviceOptions.defaultEmailProviderName` /
`defaultSmsProviderName` / `defaultPushProviderName` (plus telegram /
whatsapp variants) must each match a `notificationProviders[]` entry of a
compatible kind; a per-notification override goes in
`eventNotificationBasics.providerName`. If a needed provider entry is
missing, that is a Phase 1 gap — surface it to the orchestrator; do not
invent provider entries here.

**WhatsApp (Meta): ONE webhook URL per provider, and it is not yours to
invent.** Meta sends everything about a WhatsApp number - inbound customer
messages, the delivery statuses of the project's own sends, other field
changes - to ONE callback URL. The platform therefore exposes exactly one
door per `kind: "whatsapp", provider: "whatsapp"` entry, on the notification
service: `GET|POST /v1/whatsapp-webhooks/meta/<providerName>`, verified with
that entry's `whatsappAppSecret`, answering the handshake with its
`whatsappVerifyToken`, and routing the messages to the agent surfaces and
mcpbff exposures that name the provider (`chatSurfaces[].provider`) and the
statuses to the delivery log. Design consequences: a chat surface NEVER gets
its own webhook path, app secret, verify token or send credential - it names
the provider (`provider: "<name>"`), and its replies post with the provider's
`whatsappAccessToken` / `whatsappPhoneNumberId` / `whatsappApiVersion`; chat
bots (`chatProvidersSettings`) are RETIRED and never written - an old one
converts on load; a provider backs at most ONE conversational consumer (an
agent surface or an mcpbff exposure), so a second assistant on the same
number is a design error; one provider is one Meta app secret, so a second
Meta app is a second provider entry;
the design never writes the URL into the blueprint - the build answer of the
notification service prints it per deploy slot (`inboundWebhooks`), and the
user pastes it into the Meta dashboard once per number (per-number or
per-WABA callback override when several providers share one app). The older
`/v1/notification-webhooks/whatsapp/<name>` and
`/agents/<agent>/whatsapp/webhook` URLs no longer exist.

**A missing EMAIL provider never produces mail — and only sometimes produces
an error.** Mail has a built-in fallback that needs no declared entry: when
the selected email provider's credentials are incomplete, or when the project
has no `kind: "email"` entry at all, the framework routes the message at its
mock SMTP sink. **Where the sink host is provisioned, the send reports SUCCESS**
— nothing validates red, nothing throws, nothing bounces, the mail
just never arrives, and a module wired against a nonexistent email provider
looks perfectly healthy in every check this guide runs. **Where the sink host
is not provisioned the sends FAIL LOUDLY** instead (SMTP connect timeouts
against `__mailsink__`, retried, `failed` delivery rows) — different noise,
identical cause. Either way the send's own status says nothing about
delivery, so never assert a notification by "the send returned 200": assert
the API's own result, and start every "mail stopped arriving" triage at
`notificationProviders[].kind`. `GET /v1/mail/mock-status` answers "is mail
sinking here, and why" in ONE call — ASK THE NOTIFICATION SERVICE (or another
mail-sending service). On a sender its `sink.reason` tells
`incomplete-credentials` (a provider whose keys are placeholders) apart from
`no-channel-match` (no `kind: "email"` entry at all, the shape an
org-to-project copy used to produce). A service that sends no mail (auth, bff,
most business services) answers `sink.engaged: false`,
`sink.reason: "not-a-mail-sender"` and lists the services that do send in
`sink.sendingServices`; that answer says nothing about the project's
providers, so re-ask one of the named services. `/v1/ai/mock-status` and
`/v1/buckets/mock-status` answer the same question for their families. Treat "no email notification provider in
`projectSettings/notificationProvidersSettings`" as a BLOCKING Phase 1 gap
for any email notification, and say so in the report. (The usual cause is
the mail trap: an email provider written into
`mailAccounts[]`, which is an inbound mailbox, not a send channel.)

> The Ada corpus described enum-valued `emailProvider`/`smsProvider`/
> `pushProvider` fields with per-provider settings blocks on the module —
> that shape is gone; the provider catalog moved to `projectSettings`.
> When in doubt, read `openappl/spec/NotificationServiceOptions.md` and its `openappl.json` entry.

## 2. Per-notification wiring decisions

For each definition in `notification-definitions`, for each of its
channels:

1. **Name** — the definition's camelCase name. With a single channel keep
   the name clean (`orderCreated`, jobType `email`) — do NOT append a
   channel suffix. Only multi-channel definitions get disambiguated names
   (`fraudAlertEmail` / `fraudAlertSms`).
2. **Trigger topic** (`eventDataSettings.channel`) — the Kafka topic the
   listener subscribes to. Derive the REAL topic names of the producing
   service from the blueprint with the event-bus rules
   (`openappl/compiler/07-event-bus.md`); never guess casing. API-event topics are
   `{codename}-{service}-service-{resource}-{actionPassiveForm}`, DB-event
   topics `{codename}-{service}-service-dbevent-{object}-{created|updated|deleted}`,
   all lowercase. A service publishes route events only for the apis that
   set `raiseApiEvent`; explicit `PublishEventAction`s publish their own
   topics. The full four-slot bare-vs-wire table is in
   `blueprint-authoring.md`, "Topic slots".
3. **Payload view** (`eventDataSettings.dataViewName`) — the DataView the
   listener fetches to hydrate template + targets. Verify the name exists
   in `bffService/dataViews` of `blueprint.json`. When the event payload
   alone carries everything the template and targets need, omit the view
   (leave `dataViewName` null) and reference payload fields directly. If a
   needed view is missing, that is a bff-spec gap: route it back to the
   orchestrator (the bff task owns `bffService`) — never write into
   `bffService/dataViews` from this task.
4. **`dataViewIdPathInPayload`** — the key the listener reads from the
   event to look up the view's main record. It resolves against the
   RECORD the event carries (the unwrapped `data`), never the wire
   envelope — write it BARE (`orderId`), never `data.`-prefixed (a
   `data.` prefix resolves to nothing and the notification silently never
   sends). Default is `id` (the record's own id) — omit the field in that
   usual case.
5. **`condition`** (optional MScript) — the receiver carries exactly five
   members: `this.payload`, `this.dataSource` (the fetched view result),
   `this.old`, `this.actor`, `this.metadata`, and it is NULL-NORMALIZED:
   absent members become empty objects, and reads through absent data
   yield `undefined` at any depth instead of throwing. The expression is
   then EVALUATED on that — a positive check (`this.dataSource.tier ===
   'gold'`) folds to false and silently skips, while a negated or
   absence-testing check (`!this.dataSource.blocked`) evaluates TRUE and
   FIRES. Re-read every condition with this in mind, especially on
   notifications with no `dataViewName`.
6. **Templates** — EJS (`<%= field %>`) against the hydrated data. HTML
   body for email; short plain text for sms/push. Use REAL field names
   from the bound DataView (or the payload when unbound) — verify against
   the view's `viewBasics.properties` and aggregate names.
7. **`isStored`** — true for `inApp` (so it lists in the notification
   center); false for email/sms/push.

### Targets

One named item per recipient under
`.../eventNotifications/<Name>/targets/<TargetName>`:

- **`targetKind`** — default `userId`: the value at `targetPathInData` is
  a project user id (contact handles are looked up via the auth
  service). Direct-handle kinds (`email`, `phoneNumber`, `deviceToken`,
  ...) skip the lookup. Audience kinds `role` / `userGroup` fan out to a
  declared audience: set `targetValue` to the role VALUE (a built-in like
  `admin` or a custom `roleItems[].value`) instead of a data path, and in
  multi-tenant projects set `scope` (`tenant` default / `global`).
- **`targetPathInData`** — dot-path to the id/handle inside the
  notification data; rooted at the RECORD, not the envelope. For arrays
  set `isArray: true` (and, when the array holds objects,
  `targetUserIdInArrayTargetItem` for the per-item id field).
- **`condition`** (optional MScript) — per-target gate; the target data
  binds as `target` (without `this`), the view result as
  `this.dataSource`.

Map each spec target to the cheapest kind that resolves it: an
entity-bound persona (buyer, seller, owner) is a `userId` path on the
view; a role-wide audience (all admins) is `targetKind: 'role'` +
`targetValue`. A target that resolves to nothing is a spec gap — record
it in the report, do not fabricate a path.

## 3. Write order (sharded)

Scaffold-then-fill: derive the full inventory first (per definition ×
channel: topic, view binding, template fields, targets), then author one
notification at a time. Run `mind-set validate blueprint.json` after each
write and resolve every error before moving on.

1. **`notificationService/serviceSettings/serviceOptions`**: merge in
   `storedNotice` plus the default provider-name
   bindings that Phase 1 providers support.
2. **Each event-notification: ONE bundled edit at
   `notificationService/eventNotifications/<Name>`**:
   `eventNotificationBasics` + `eventDataSettings` + `template` + the
   FULL `targets` chapter in the same payload (named-item semantics —
   send each notification complete).
3. **`notificationService/serviceSettings/documentation`**: set
   `{ frontendDocument: "..." }` (section 5).

Per-section writes (`.../eventNotifications/<Name>/targets/<T>`) are for
the fix loop and change requests only.

## 4. Validate, build, gate

1. Validate the module (`mind-set validate blueprint.json`, then an OpenAPPL
   validation tool or compiler when one is available) and drive `notificationService` to zero errors.
2. Building the system service **`notification`** and checking its health
   happen on the hosting platform, outside this procedure.
3. **Machine completeness gate:** diff the spec inventory (every
   definition × channel, every target) against the live state
   (`notificationService/eventNotifications` in `blueprint.json`). Every
   definition must have its event-notification; every skipped target or
   unbound view must be a recorded deviation, not an accident.
4. Report: notifications written per channel, view bindings (and any
   definitions left payload-only), targets skipped as unresolvable,
   provider-binding gaps routed to Phase 1, validation status.

## 5. Document UX intent (`frontendDocument`)

At `notificationService/serviceSettings/documentation/frontendDocument` —
4-8 sentences the frontend generation reads for the in-app notification
UI: notification-center surface (bell + badge, page, or panel), realtime
delivery expectation (live push vs polling), read/unread handling,
grouping/filtering, and email template style direction (transactional and
minimal vs branded). Do not write to `notificationService` directly —
module-level primitives do not exist; the field lives in the
`documentation` section.

**Telegram chat surfaces bind the same way.** A `kind: "telegram"` entry is
the channel provider of an agent surface or an mcpbff exposure: its
`telegramBotToken` sends the replies and its `telegramWebhookSecret` (a
catalog key; without it the webhook fails closed) verifies the surface's
webhook. Declare the provider once, with both keys, and name it from
`chatSurfaces[].provider`; never a bot entry, never a `CHAT_PROVIDER_*` env.
