# ApiParentOwnershipCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [ApiParentOwnershipCheck in Part 1](../ontology/ApiParentOwnershipCheck.md)

One PARENT-ownership gate for a Business API. At runtime the generated manager fetches the parent row and DENIES (403) unless the caller owns it. `parentObject` names the parent DataObject (in THIS service) whose row is fetched by id; `parentIdField` is the request field carrying that parent row's id; `ownerField` is the session-bound owner property ON the parent object compared against the caller's session userId. Distinct from `ownershipCheck` (which gates the target row itself) — use this for create-under-parent and modify-child-if-you-own-the-parent. LANGUAGE NOTE: every selectable service language emits this gate (nodejs, java, python, dotnet, golang and rust), on every api shape, golang DataView reads (apiOptions.dataViewName on a list or get api) and serviceLayerCall apis included. On the retired php lane, which carries no such gate, a declared parentOwnershipChecks list is the non-bypassable validation error PARENT_OWNERSHIP_UNSUPPORTED_LANGUAGE. The language is the one the service is built in, a build-language override included.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `parentIdField` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The request field (body param or url segment) holding the id of the parent row to authorize against. Read off the api context (`this.<field>`) at gate time. |
| `parentObject` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The parent DataObject name (a data object in THIS service) whose row is fetched by id to check ownership. |
| `ownerField` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The session-bound owner property ON `parentObject` (a property flagged sessionSettings.isOwnerField=true) compared against the caller's session userId. 403 when they differ, when the parent row is missing, or when the owner column is null. |

## Constraints

Property rules:

- `parentIdField`, `parentObject`, `ownerField` must be present. (`REQUIRED_FIELD_MISSING`)
- `parentIdField`, `parentObject`, `ownerField` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
