# WaitingRoomStages

**Level:** `section` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoomStages in Part 2](../spec/WaitingRoomStages.md)

The staged admission gates of a WaitingRoom (section): the ordered `stages` list — room 0 (the entry room a join lands in) through the final room (final admission mints the QueToken). The adaptive promoter advances front-of-each-room into the next room, capped by the next room's `admissionRatePerSecond` ceiling (backing off toward each stage's `minAdmissionRatePerSecond` floor under DB saturation).

## Contained in

- [WaitingRoom](./WaitingRoom.md) as `rooms`

Blueprint paths:

- `services.waitingRooms.rooms`

## Contains

- `stages`: [WaitingRoomStage](./WaitingRoomStage.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
