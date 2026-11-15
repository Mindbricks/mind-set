# RealtimeHub

**Level:** `chapter` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [RealtimeHub in Part 1](../ontology/RealtimeHub.md)

**Name:** an instance is named by `hubBasics.name`.

Defines a bidirectional realtime communication hub powered by Socket.IO. Each hub provides room-based messaging with built-in message types (text, image, video, audio, document, sticker, contact, location, system) and optional custom message types for app-specific structured data. Messages are always persisted to an auto-generated DataObject. The hub auto-bridges the create, update and delete events of every DataObject of its service via Kafka, and provides standard events (typing, read receipts, presence) as toggles. Hubs are mounted as Socket.IO namespaces and expose auto-generated REST endpoints.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hubBasics` | [`HubBasics`](./HubBasics.md) | yes |  |  |  | Core identity of the realtime hub including its name and description. The name determines the Socket.IO namespace path (`/<service>-api/hub/{name}`) and, kebab-cased, the REST endpoint prefix (`/{kebab-name}` under the service's `/<service>-api` route). |
| `roomSettings` | [`HubRoomSettings`](./HubRoomSettings.md) | yes |  |  |  | Configures room management, join authorization, and role assignment. Defines which DataObject represents rooms, eligibility conditions, and a layered authorization flow (absoluteRoles → checkRoles → checkScript → authSources → authScripts) that determines each user's hub role. |
| `hubRoles` | [`HubRole`](./HubRole.md)[] | no |  |  |  | Named permission sets that control what users can do inside a room. Each role specifies read, send, moderate, delete, and manage permissions. Roles are assigned to users by the room authorization flow defined in roomSettings. |
| `messageSettings` | [`HubMessageSettings`](./HubMessageSettings.md) | yes |  |  |  | Controls message structure, built-in message types (text, image, video, audio, etc.), cross-cutting features (reply threading, reactions, forwarded flag), and custom app-specific message types. An auto-generated Message DataObject persists all messages. |
| `eventSettings` | [`HubEventSettings`](./HubEventSettings.md) | yes |  |  |  | Configures standard events (typing, presence, read/delivery receipts), auto-bridged DataObject CRUD events via Kafka, and custom or external Kafka events. Standard events are toggleable and the framework generates the socket handlers automatically. |
| `historySettings` | [`HubHistorySettings`](./HubHistorySettings.md) | yes |  |  |  | Controls whether message history is sent to clients when they join a room and how many recent messages to include. |
| `guardrails` | [`HubGuardrails`](./HubGuardrails.md) | yes |  |  |  | Safety limits, rate controls, moderation settings, and auth caching for the hub. Includes rooms per user, message rate limits, payload size limits, and moderation modes; maxUsersPerRoom is enforced only by the Java and Python runtimes, and connectionTimeout by none. |
| `hubLogic` | [`HubLogic`](./HubLogic.md) | no |  |  |  | Server-side logic hooks for intercepting custom messages with MScript, providing room state on join, and running scheduled interval actions. Enables game loops, collaborative editing, auction countdowns, and other stateful hub behaviors. |
| `contentModeration` | [`ContentModeration`](./ContentModeration.md) | no |  |  |  | Decision-moderated messages for this hub: objectModeration applied to hub messages. When `enabled`, every message a user sends (socket `hub:send` or REST POST) is judged by a calibrated decision provider before it reaches the room. An `accept` is delivered as usual, a `review` is HELD (nothing is stored or broadcast) in a framework-generated `sys_<hubName>HubMessageModerationReview` object until a reviewer accepts it, and a `reject` is dropped with a typed error to the sender. Message types a HubLogic handler processes and system-authored messages are never judged. Optional - omit (or null) when unused. |

## Constraints

Property rules:

- `hubBasics`, `roomSettings`, `messageSettings`, `eventSettings`, `historySettings`, `guardrails` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `hubRoles` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | warning | roomDataObject "…" is not a data object of this service, so the hub can never resolve a room and every hub:join is denied.… |
| `HUB_CUSTOM_FIELD_DEFAULT_INVALID` | error | Custom message field "…" has defaultValue …, which is not a valid ……. |
| `HUB_DATA_OBJECT_CONFLICT` | error | Data object "…" conflicts with an existing data object in this service. |
| `HUB_NO_AUTH_PATH` | warning | This hub declares no way to grant a hub role: absoluteRoles, authSources and authScripts are all empty, so every hub:join is denied ("No matching authorization source") and every REST leg answers 403. |
| `HUB_ROLE_MODERATOR_READS` | warning | Hub role "…" has canModerate true and canRead false. |
