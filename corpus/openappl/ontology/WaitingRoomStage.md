# WaitingRoomStage

**Level:** `subsection` · **Family:** [WaitingRoom](./families.md#waitingroom) (domain `Service`)

**Specification:** [WaitingRoomStage in Part 2](../spec/WaitingRoomStage.md)

Defines one Redis admission stage with a rate ceiling, optional rate floor and capacity. One staged admission gate (a Redis room): `name`, the `admissionRatePerSecond` CEILING the adaptive metered promoter drains this room's front at, an optional `minAdmissionRatePerSecond` floor for the closed-loop back-off, and an optional `capacity`.

## Contained in

- [WaitingRoomStages](./WaitingRoomStages.md) as `stages` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
