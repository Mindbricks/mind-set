# WaitingRoomPositionChannel

**Level:** `section` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoomPositionChannel in Part 1](../ontology/WaitingRoomPositionChannel.md)

The room's own realtime/SSE position channel (section): the `channelName` clients subscribe to for live position (ZRANK) and admission updates, the `transport`, and `emitPositionEverySeconds`. Separate from the target BusinessApi's own event channel — it carries queue lifecycle only.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `channelName` | `String` | no |  |  |  | The SSE/realtime channel + event name clients subscribe to for live position (ZRANK in the front room) and admission frames (the `admitted` event carries the minted QueToken). Defaults to the room name. This channel is SEPARATE from the target BusinessApi's own event channel — it carries queue lifecycle only (joined → position → admitted → expired/abandoned). |
| `transport` | `String` | no | `"sse"` |  |  | The realtime transport for the position channel: `sse` (default — a reconnectable Server-Sent-Events stream keyed by the waiter handle) or `websocket`. Kept as String in v1. |
| `emitPositionEverySeconds` | `Integer` | no | `5` |  |  | How often (seconds) the room pushes a refreshed position frame to a waiting client (a throttle so a deep queue doesn't spam every promoter tick). Defaults to a small interval when absent. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
