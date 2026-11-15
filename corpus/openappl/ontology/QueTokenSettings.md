# QueTokenSettings

**Level:** `section` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [QueTokenSettings in Part 2](../spec/QueTokenSettings.md)

The admission token config of a WaitingRoom (section): the one-shot, time-boxed `ttlSeconds` and Redis-backed `singleUse` semantics of the QueToken minted when a waiter reaches final admission. The token is queue-scoped (only valid for this room's bound target) and consumed on first use by the target's QueToken gate.

## Contained in

- [WaitingRoom](./WaitingRoom.md) as `token`

Blueprint paths:

- `services.waitingRooms.token`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
