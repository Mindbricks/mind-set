# WaitingRoom

**Level:** `chapter` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoom in Part 2](../spec/WaitingRoom.md)

A PULL-mode admission-control queue pattern (docs/ADR-async-job-orchestration-patterns.md, the WaitingRoom section) — the Taylor-Swift-ticketing turnstile. A `WaitingRoom` meters a thundering herd through N gated Redis `rooms` so a bound **public** BusinessApi is never stampeded: clients join the room (a Redis sorted-set keyed by arrival/fairness), see a live `position` over the room's OWN realtime channel, and a metered cron-promoter advances front-of-room → next room → final admission at each room's `admissionRatePerSecond`. When admitted the room mints a one-shot, time-boxed `QueToken` (Redis-backed, single-use, queue-scoped) and the CLIENT calls the target BusinessApi DIRECTLY with it. CONTRAST `JobStream` (push): a WaitingRoom does NOT hide or proxy the target — the target BusinessApi keeps its public REST/SSE/WS route and merely GAINS the `QueToken` gate (`authOptions.queueTokenRequired: <waitingRoomName>`), an additional M2M-parity check beyond login. From ONE declaration codegen emits: a join edge (ZADD into room 0 + return a waiter handle), the metered promoter, the position realtime channel, the admission token-mint, and the Redis one-shot `QueToken` verify the gated target consumes. The position channel is SEPARATE from the target API's own event channel.

## Contained in

- [Service](./Service.md) as `waitingRooms` (a list)

Blueprint paths:

- `services.waitingRooms`

## Contains

- `roomBasics`: [WaitingRoomBasics](./WaitingRoomBasics.md)
- `rooms`: [WaitingRoomStages](./WaitingRoomStages.md)
- `token`: [QueTokenSettings](./QueTokenSettings.md)
- `targetApi`: [WaitingRoomTargetBinding](./WaitingRoomTargetBinding.md)
- `positionChannel`: [WaitingRoomPositionChannel](./WaitingRoomPositionChannel.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
