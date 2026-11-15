# WaitingRoomBasics

**Level:** `section` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoomBasics in Part 2](../spec/WaitingRoomBasics.md)

Defines a waiting room's identity, fairness policy and abandonment timeout. The waiting room's scalar identity + global policy (section): name/codeName/description, the `fairnessPolicy` (`fifo` default | `randomizedDraw` to defeat bots) and `abandonmentTtlSeconds` (a waiter who stops heart-beating past it is dropped from its Redis room so it stops holding a slot).

## Contained in

- [WaitingRoom](./WaitingRoom.md) as `roomBasics`

Blueprint paths:

- `services.waitingRooms.roomBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
