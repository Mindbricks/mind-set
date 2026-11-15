# WaitingRoomStages

**Level:** `section` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoomStages in Part 1](../ontology/WaitingRoomStages.md)

The staged admission gates of a WaitingRoom (section): the ordered `stages` list — room 0 (the entry room a join lands in) through the final room (final admission mints the QueToken). The adaptive promoter advances front-of-each-room into the next room, capped by the next room's `admissionRatePerSecond` ceiling (backing off toward each stage's `minAdmissionRatePerSecond` floor under DB saturation).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `stages` | [`WaitingRoomStage`](./WaitingRoomStage.md)[] | no |  |  |  | The ordered list of staged admission gates (WaitingRoomStage[]) — room 0 (the entry room a join lands in) through the final room (final admission mints the token). The metered promoter advances front-of-each-room into the next room capped by the NEXT room's admissionRatePerSecond. At least one room is required. |

## Constraints

Property rules:

- The items of `stages` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
