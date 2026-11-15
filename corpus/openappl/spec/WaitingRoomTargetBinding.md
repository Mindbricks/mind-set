# WaitingRoomTargetBinding

**Level:** `section` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoomTargetBinding in Part 1](../ontology/WaitingRoomTargetBinding.md)

Binds the PUBLIC BusinessApi a WaitingRoom fronts (section): the target `api` name (a businessLogic[] BusinessApi in THIS service) + `action`. Unlike JobStream, the binding does NOT suppress the target — it keeps its public route and gains the QueToken gate.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `api` | `String` | yes |  |  |  | Name of the PUBLIC BusinessApi this room fronts — a `businessLogic[].basics.apiOptions.name` declared in THIS service. UNLIKE a JobStream target, this API is NOT suppressed: it keeps its public REST/SSE/WS route and GAINS the QueToken gate (the codegen pass sets/honours `authOptions.queueTokenRequired: <waitingRoomName>` on it so it requires a valid admission token). The client calls it DIRECTLY with the minted token. REQUIRED. |
| `action` | `String` | no |  |  |  | Optional name of the specific action/operation on the target BusinessApi the admission token authorizes, when the API exposes more than one. Defaults to the API's primary action. |

## Constraints

Property rules:

- `api` must be present. (`REQUIRED_FIELD_MISSING`)
