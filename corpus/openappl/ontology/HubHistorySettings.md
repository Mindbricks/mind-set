# HubHistorySettings

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubHistorySettings in Part 2](../spec/HubHistorySettings.md)

Controls whether message history is sent to clients when they join a room. When enabled, the server queries the message DataObject for the most recent messages and emits them as a 'hub:history' event immediately after join confirmation.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `historySettings`

Blueprint paths:

- `services.realtimeHubs.historySettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
