# WaitingRoomTargetBinding

**Level:** `section` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoomTargetBinding in Part 2](../spec/WaitingRoomTargetBinding.md)

Binds the PUBLIC BusinessApi a WaitingRoom fronts (section): the target `api` name (a businessLogic[] BusinessApi in THIS service) + `action`. Unlike JobStream, the binding does NOT suppress the target — it keeps its public route and gains the QueToken gate.

## Contained in

- [WaitingRoom](./WaitingRoom.md) as `targetApi`

Blueprint paths:

- `services.waitingRooms.targetApi`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
