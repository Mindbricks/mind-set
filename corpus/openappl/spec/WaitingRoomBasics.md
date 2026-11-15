# WaitingRoomBasics

**Level:** `section` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoomBasics in Part 1](../ontology/WaitingRoomBasics.md)

**Name:** an instance is named by `name`.

Defines a waiting room's identity, fairness policy and abandonment timeout. The waiting room's scalar identity + global policy (section): name/codeName/description, the `fairnessPolicy` (`fifo` default | `randomizedDraw` to defeat bots) and `abandonmentTtlSeconds` (a waiter who stops heart-beating past it is dropped from its Redis room so it stops holding a slot).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique waiting-room identifier within the service and the asset-name-path. Unless `codeName` is set, it is also the room key: the join route base (`/waitingrooms/<key>`), the position channel route, the Redis room key prefix (`waitingroom:<key>:room:<n>`), the QueToken key namespace and the `authOptions.queueTokenRequired` value a gated target references (which may name the room by either). Must be a valid codeName. |
| `codeName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional machine code name override. When set, it is the room key that the routes, the Redis keys and the QueToken namespace use. Defaults to `name` when absent. |
| `description` | `Text` | no |  |  |  | Optional human-readable description of what high-demand event this room meters. |
| `fairnessPolicy` | `WaitingRoomFairnessPolicy` | no | `"fifo"` | `fifo`, `randomizedDraw` |  | How the metered promoter orders who gets admitted next out of the front room: `fifo` (default — strict arrival order, exact position) or `randomizedDraw` (a lottery among the front room to defeat bots; approximate position). Drives the Redis sorted-set score the promoter pops by. |
| `abandonmentTtlSeconds` | `Integer` | no | `120` |  |  | Abandonment / idle TTL in seconds: a waiter whose heartbeat stops (tab closed) or who idles past this window is dropped from its Redis room (its sorted-set member expires) so it stops holding a slot and the line keeps moving. The join/heartbeat edge refreshes it. Defaults to a safe short window when absent. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `fairnessPolicy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name`, `codeName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
