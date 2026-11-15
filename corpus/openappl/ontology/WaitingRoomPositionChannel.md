# WaitingRoomPositionChannel

**Level:** `section` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoomPositionChannel in Part 2](../spec/WaitingRoomPositionChannel.md)

The room's own realtime/SSE position channel (section): the `channelName` clients subscribe to for live position (ZRANK) and admission updates, the `transport`, and `emitPositionEverySeconds`. Separate from the target BusinessApi's own event channel — it carries queue lifecycle only.

## Contained in

- [WaitingRoom](./WaitingRoom.md) as `positionChannel`

Blueprint paths:

- `services.waitingRooms.positionChannel`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
