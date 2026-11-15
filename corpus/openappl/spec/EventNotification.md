# EventNotification

**Level:** `chapter` · **Family:** [EventNotification](../ontology/families.md#eventnotification) (domain `NotificationService`)

**Ontology:** [EventNotification in Part 1](../ontology/EventNotification.md)

**Name:** an instance is named by `eventNotificationBasics.name`.

Defines a single event-triggered notification within the project. The trigger is either a Kafka topic (triggerSource='kafka', the default — eventDataSettings.channel names the topic) or a geofence crossing (triggerSource='geofence' — geofenceTrigger names the fences + action). Delivered as email, SMS, push, telegram, whatsapp, or in-app message depending on jobType. Both MScript condition slots, the event-level eventDataSettings.condition and each NotificationTarget.condition, evaluate against the SAME null-normalized receiver: `this.payload`, `this.dataSource`, `this.old`, `this.actor` and `this.metadata` each read as an empty object when the event does not carry them, and a chain rooted at one of those five is null-safe at every link past the root, so a missing-data read evaluates as `undefined` at ANY DEPTH instead of throwing. That can change whether the notification fires, so see eventDataSettings.condition before relying on it. A chain rooted at a declared member is null-safe at EVERY link past the root, so `this.dataSource.owner.tier` on an event with no `owner` folds to `undefined` and answers false - a silent skip, with nothing recorded. On the nodejs listener only a chain rooted OUTSIDE those five members (`this.target.isPublic`, `this.data.owner.id`) still throws, and only that case is recorded as a failed delivery. Which reads fail rather than fold is a per-listener property and not portable: see the LANGUAGE NOTE on eventDataSettings.condition before relying on the failure row.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `eventNotificationBasics` | [`EventNotificationBasics`](./EventNotificationBasics.md) | yes |  |  |  | Basic properties of the event notification, including its name, description, storage behavior, and job type. |
| `eventDataSettings` | [`EventDataSettings`](./EventDataSettings.md) | yes |  |  |  | Settings for how the notification extracts and processes data from the incoming event. For triggerSource='kafka' the channel field names the topic. For triggerSource='geofence' the channel is auto-derived by the factory and the data source is the synthetic crossing payload. |
| `geofenceTrigger` | [`GeofenceTrigger`](./GeofenceTrigger.md) | no |  |  |  | Required when triggerSource='geofence'. Names the fences + action that drive this notification. |
| `targets` | [`NotificationTarget`](./NotificationTarget.md)[] | no |  |  |  | A list of NotificationTarget objects that define how to extract recipients from the rendered data. Each target specifies a path in the notification data where userId/email/phone/handle can be found. |
| `template` | [`NotificationTemplate`](./NotificationTemplate.md) | yes |  |  |  | The notification template used to render the notification content. Template variables are the notification metadata keys at TOP LEVEL — the triggering event record's fields addressed directly (`<%= followerFullname %>`, never `<%= data.followerFullname %>`; the bare `data` root exists only in the condition MScript slots, not in templates). See NotificationTemplate for the full scope. |
| `contentModeration` | [`ContentModeration`](./ContentModeration.md) | no |  |  |  | Decision-moderated outbound content for this notification: objectModeration applied to the RENDERED subject and body. When `enabled`, each distinct rendered content of an event is judged ONCE by a calibrated decision provider before any recipient receives it, on every channel (email, sms, push, inApp, telegram, whatsapp). An `accept` is sent unchanged, a `review` is HELD (nothing sent, nothing stored) in the framework-generated `sys_NotificationModerationReview` object until a reviewer accepts it, and a `reject` is never sent. Optional - omit (or null) when unused. |

## Constraints

Property rules:

- `eventNotificationBasics`, `eventDataSettings`, `template` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INCOMPATIBLE_TARGET_KIND` | error | Target "…" has targetKind="…" but the event's jobType="…" only accepts …. |
| `INVALID_GEOFENCE_ACTION` | error | geofenceTrigger.action must be one of …, got "…". |
| `MISSING_GEOFENCE_TRIGGER` | error | EventNotification with triggerSource='geofence' must declare a geofenceTrigger block (action plus optional fenceTags/fenceFilter/condition). |
| `NOTIF_DATA_LANG_WORKAROUND` | warning | The template stacks its languages as `data-lang` spans (…). |
| `NOTIF_DEDUP_KEY_NOT_EMITTED` | warning | dedupKey is set, but the "…" notification listener does not apply a delivery dedup gate yet: a redelivered event can send again on this service. |
| `NOTIF_DEEPLINK_MALFORMED` | warning | actionDeepLink resolves to the literal "…", which does not look like an app path or deep link (expected a "/path" or "scheme://…" form with no whitespace). |
| `NOTIF_DUPLICATE_TARGET_NAME` | warning | Target #… … in this same EventNotification. |
| `NOTIF_RENDER_PER_RECIPIENT_UNUSED` | warning | renderPerRecipient is true but no template slot reads `recipient`. |
| `NOTIF_TARGET_ARRAY_ITEM_IDENTITY_MISSING` | warning | Target "…" is an isArray target whose targetItemNameInArray ("…") names the array CONTAINER and repeats targetPathInData, and it declares no targetUserIdInArrayTargetItem. |
| `NOTIF_TARGET_CONDITION_RECEIVER_UNKNOWN` | error | … reads `this.…`, which the condition receiver does not carry — `this` exposes only ….… The read is an authoring error and is refused here: `this.…` is absent in EVERY target language, so the condition can never answer … |
| `NOTIF_TARGET_SOURCE_INCOHERENT` | warning | Target "…" has targetKind="userId" (identity lookup by user id) but its payload source "…" names a contact handle ("…"). |
| `NOTIF_TEMPLATE_ROOT_NOT_IN_CONTEXT` | warning | The … template requires …, which nothing in this event's declared context binds at top level. |
| `NOTIF_TEMPLATE_SYNTAX` | warning | The … template does not compile as EJS: …. |
| `NOTIF_TEMPLATE_UNRESOLVED_ROOT` | warning | The … template reads …, which the render scope does not provide. |
| `NOTIF_VARIANT_DUPLICATE_LANGUAGE` | error | Two template variants both declare language "…" (this one and variants[…]). |
| `NOTIF_VARIANT_EMPTY` | error | The "…" template variant carries neither a subjectTemplate nor a bodyTemplate. |
| `NOTIF_VARIANT_MALFORMED` | error | A template variant must be an object with `language` and at least one of `subjectTemplate` / `bodyTemplate`. |
| `NOTIF_VARIANT_NO_FALLBACK` | error | This template declares … language variant(s) (…) but no fallback subjectTemplate/bodyTemplate of its own. |
| `NOTIF_VARIANT_NO_LANGUAGE` | error | A template variant declares no `language`. |
| `NOTIF_VARIANT_NO_LANGUAGE_SOURCE` | warning | This template declares per-language variants (…) but the project's auth user object declares none of the properties the recipient's language is read from (…). |
| `NOTIF_VARIANT_SLOT_MISSING` | warning | The "…" template variant declares no … although the template's own fallback … is set. |
| `NOTIFICATION_TARGET_PATH_IGNORED` | warning | Target "…" is an audience target (targetKind="…") — targetPathInData is IGNORED for audience kinds (the audience comes from targetValue). |
| `NOTIFICATION_TARGET_PATH_MISSING` | error | Target "…" has targetKind="…" (payload-sourced) but declares no targetPathInData — there is nothing to resolve a recipient from. |
| `NOTIFICATION_TARGET_ROLE_UNKNOWN` | error | Target "…" names the role "…", which is not a declared role value. |
| `NOTIFICATION_TARGET_TENANT_SCOPE_UNRESOLVED` | warning | Target "…" is a tenant-scoped … audience, but the consumed topic's producer is not resolvable in this project — the runtime cannot be guaranteed a tenant id (event envelope actor.tenantId or the record's tenant id … |
| `NOTIFICATION_TARGET_USERGROUPS_INACTIVE` | error | Target "…" is a userGroup audience but the project does not enable user groups (authentication.loginDefinition.userSettings.userGroupsActive). |
| `NOTIFICATION_TARGET_VALUE_MISSING` | error | Target "…" has targetKind="…" but declares no targetValue. |
| `WHATSAPP_TEMPLATE_IGNORED` | warning | This notification's jobType is "…", so its whatsappTemplate is never read: only a jobType="whatsapp" notification sends a WhatsApp template. |
| `WHATSAPP_TEMPLATE_NAME_INVALID` | error | A whatsappTemplate block names no template. |

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `triggerSource` | moved | `eventNotificationBasics.triggerSource` | Write the value at the new path. |
| `providerName` | moved | `eventNotificationBasics.providerName` | Write the value at the new path. |
