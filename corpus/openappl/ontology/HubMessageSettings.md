# HubMessageSettings

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubMessageSettings in Part 2](../spec/HubMessageSettings.md)

Controls message structure and persistence. Every hub auto-generates a Message DataObject with system fields (id, roomId, senderId, timestamp), a messageType enum column, and a content JSONB column. Designers select which built-in message types to support (text, image, video, etc.) and can define custom message types with app-specific field schemas. Cross-cutting features (reply threading, reactions, forwarded flag) are toggleable across all message types.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `messageSettings`

Blueprint paths:

- `services.realtimeHubs.messageSettings`

## Contains

- `customMessageTypes`: [HubCustomMessageType](./HubCustomMessageType.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
