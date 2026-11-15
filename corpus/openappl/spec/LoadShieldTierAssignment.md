# LoadShieldTierAssignment

**Level:** `subsection` · **Family:** [LoadShield](../ontology/families.md#loadshield) (domain `Service`)

**Ontology:** [LoadShieldTierAssignment in Part 1](../ontology/LoadShieldTierAssignment.md)

**Name:** an instance is named by `name`.

One explicit shed-priority assignment: `{name?, api, action?, tier}`. `name` is the assignment's asset identity (derived from `api`/`action` when absent); `api` references a `businessLogic[]` BusinessApi (by `basics.apiOptions.name`) or an edge controller (by `edgeControllerOptions.functionName`) declared in THIS service; `action` optionally narrows the assignment to one action/operation of that API; `tier` is an integer 0-5 (0 = never shed — bypasses the queue entirely; 5 = first to shed under congestion). Under saturation the runtime sheds tier 5 first, then 4, and so on — tier 0 is structurally unsheddable.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional asset identity for this assignment (the array-asset convention — WaitingRoomStage idiom). Defaults transparently on load/validation to `<api>` for an api-level entry and `<api>_<action>` for an action-narrowed one; a colliding derived name gets the lowest free numeric suffix (`<base>1`, `<base>2`, …). This name is what item-addressed blueprint writes/reads use: `services/<svc>/loadShield/tiers/assignments/<name>`. Must be unique (case-insensitive) within `assignments[]`. |
| `api` | `String` | yes |  |  |  | Name of the API this assignment tiers — a `businessLogic[].basics.apiOptions.name` BusinessApi or an `edgeControllers[].edgeControllerOptions.functionName` edge controller declared in THIS service. A dangling name fails validation (LOADSHIELD_TARGET_UNKNOWN). REQUIRED. |
| `action` | `String` | no |  |  |  | Optional name of the specific action/operation on the target API this assignment narrows to, when the API exposes more than one. Absent = the assignment covers the whole API. |
| `tier` | `Integer` | yes |  |  |  | The shed-priority tier: an integer 0-5. 0 = never shed (platform/health-critical — bypasses the shield queue entirely), 1 = auth-critical, 2 = core writes (committed user intent), 3 = single reads, 4 = lists/search/reports (the queries that amplify DB load), 5 = explicitly expendable (bulk/batch/analytics — never auto-assigned, always a designer statement). Values outside 0-5 fail validation (LOADSHIELD_TIER_INVALID). REQUIRED. |

## Constraints

Property rules:

- `api`, `tier` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `LOADSHIELD_TIER_INVALID` | error | LoadShield tier assignment… has tier … — tier must be an integer between 0 (never shed) and 5 (first to shed). |
