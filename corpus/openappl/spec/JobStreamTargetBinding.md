# JobStreamTargetBinding

**Level:** `section` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamTargetBinding in Part 1](../ontology/JobStreamTargetBinding.md)

Binds a job stream to a processing BusinessApi in the same service. Binds the processing BusinessApi a JobStream drives (section): the target `api` name (a businessLogic[] BusinessApi in THIS service) + `action`, the enqueue `inputMapping` MScript, `resultLinkField`, and `keepPublicRoute`. The binding emits a Kafka WORKER controller on the job topic and suppresses the target's public REST route unless `keepPublicRoute` is set.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `api` | `String` | yes |  |  |  | Name of the processing BusinessApi this stream drives — a `businessLogic[].basics.apiOptions.name` declared in THIS service. Binding it as a JobStream target makes codegen emit a kafka WORKER controller on the job topic and SUPPRESS the target's public REST route. REQUIRED. The worker runs the target with the session the enqueue gate forwarded and no session manager, so a target that declares `authOptions.permissionCheck` is refused (403) on every run and the job is marked failed; validation warns (PERMISSION_CHECK_ON_CALLERLESS_DOOR). Gate a JobStream target with `checkRoles` / `absoluteRoles` / `ownershipCheck`. |
| `action` | `String` | no |  |  |  | Optional name of the specific action/operation on the target BusinessApi the worker invokes, when the API exposes more than one. Defaults to the API's primary action. |
| `keepPublicRoute` | `Boolean` | no | `false` |  |  | Override the default suppression: when true, the target BusinessApi ALSO keeps its public REST route (in addition to the kafka worker controller). Default false — binding as a JobStream target drops the api's public REST route, so the stream's worker is normally its only caller. Suppression is REST-ONLY: a target that ALSO declares a gRPC, SSE or kafka controller keeps that transport mounted with its own auth posture, so 'internal-only' holds only when REST is the api's sole transport. |
| `inputMapping` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript mapping the enqueue payload (the inputSchema fields) onto the target BusinessApi input. When absent, codegen maps inputSchema fields onto same-named API inputs. |
| `resultLinkField` | `String` | no |  |  |  | Optional name of the field on the target API result that holds the result reference/link carried in the terminal `ended` event (e.g. `reportUrl`). When absent, jobState.resultLinkField is used (and the whole result is attached if neither is set). |

## Constraints

Property rules:

- `api` must be present. (`REQUIRED_FIELD_MISSING`)
