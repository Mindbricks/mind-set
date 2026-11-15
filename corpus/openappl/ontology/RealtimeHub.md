# RealtimeHub

**Level:** `chapter` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [RealtimeHub in Part 2](../spec/RealtimeHub.md)

Defines a bidirectional realtime communication hub powered by Socket.IO. Each hub provides room-based messaging with built-in message types (text, image, video, audio, document, sticker, contact, location, system) and optional custom message types for app-specific structured data. Messages are always persisted to an auto-generated DataObject. The hub auto-bridges the create, update and delete events of every DataObject of its service via Kafka, and provides standard events (typing, read receipts, presence) as toggles. Hubs are mounted as Socket.IO namespaces and expose auto-generated REST endpoints.

## Contained in

- [Service](./Service.md) as `realtimeHubs` (a list)

Blueprint paths:

- `services.realtimeHubs`

## Contains

- `hubBasics`: [HubBasics](./HubBasics.md)
- `roomSettings`: [HubRoomSettings](./HubRoomSettings.md)
- `hubRoles`: [HubRole](./HubRole.md), a list
- `messageSettings`: [HubMessageSettings](./HubMessageSettings.md)
- `eventSettings`: [HubEventSettings](./HubEventSettings.md)
- `historySettings`: [HubHistorySettings](./HubHistorySettings.md)
- `guardrails`: [HubGuardrails](./HubGuardrails.md)
- `hubLogic`: [HubLogic](./HubLogic.md)
- `contentModeration`: [ContentModeration](./ContentModeration.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
