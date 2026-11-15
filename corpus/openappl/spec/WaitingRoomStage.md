# WaitingRoomStage

**Level:** `subsection` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoomStage in Part 1](../ontology/WaitingRoomStage.md)

**Name:** an instance is named by `name`.

Defines one Redis admission stage with a rate ceiling, optional rate floor and capacity. One staged admission gate (a Redis room): `name`, the `admissionRatePerSecond` CEILING the adaptive metered promoter drains this room's front at, an optional `minAdmissionRatePerSecond` floor for the closed-loop back-off, and an optional `capacity`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional human-readable name for this room/stage (e.g. `lobby`, `preCheckout`). Defaults to `room<index>` by position. Used in position channel frames and the Redis key suffix. |
| `admissionRatePerSecond` | `Integer` | yes |  |  |  | The CEILING on waiters per second the metered promoter advances INTO this room from the previous room's front (the final room's rate = the effective admission rate into the target API). This is the throttle that converts a thundering herd into a safe trickle. The promoter is CLOSED-LOOP: while the service's database is healthy it drains at exactly this rate, and under sustained DB saturation an internal PI controller (setpoint and gains are platform internals, never authored) lowers the effective rate toward the stage's floor (`minAdmissionRatePerSecond`), climbing back to the ceiling as the database recovers. Ops kill-switch: `WAITINGROOM_ADAPTIVE_DISABLED=true` (or a service with no relational DB signal) reverts to a static drain at exactly this rate. REQUIRED per room. |
| `minAdmissionRatePerSecond` | `Integer` | no |  |  |  | Optional FLOOR on waiters per second for the adaptive promoter: under sustained database saturation the closed-loop controller never lowers the effective drain rate below this (admission slows, never stops). When absent the floor defaults to max(1, 10% of `admissionRatePerSecond`). Values above the ceiling are clamped to it. Irrelevant while adaptive admission is off (`WAITINGROOM_ADAPTIVE_DISABLED=true`) or the service has no relational DB saturation signal — the promoter then drains statically at the ceiling. |
| `capacity` | `Integer` | no |  |  |  | Optional maximum number of waiters allowed to occupy this room at once (a ceiling on the in-flight set). When the room is full the promoter stalls upstream advancement until it drains. When absent the room is unbounded (rate-limited only). |

## Constraints

Property rules:

- `admissionRatePerSecond` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
