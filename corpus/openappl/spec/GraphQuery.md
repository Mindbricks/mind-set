# GraphQuery

**Level:** `section` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [GraphQuery in Part 1](../ontology/GraphQuery.md)

**Name:** an instance is named by `name`.

A declarative graph-traversal query archetype on a service (docs/ADR-graph-database-layer.md §8b). Follows the ComputeJob idiom exactly: `type` (GraphQueryType) selects the archetype, and a single `spec` wrapper (GraphQuerySpec) holds every typed sub-spec as nullable sub-objects — the one matching `type` is read by codegen and compiled to a parameterized Cypher template. Referenced by name from GraphQueryAction.query and ComputeJob.graphIO.reads.query. `permissionExplain` is the differentiator — it returns the matched PATH (which group/folder/grant), not just a boolean.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The query name. Unique within the service; used as the lookup key from GraphQueryAction.query (`named:<name>`) and ComputeJob.graphIO.reads.query, and to name the generated query runner. Must be a valid codeName. |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider to run against (must match a projectSettings.graphProvidersSettings.graphProviders[].name). |
| `type` | `GraphQueryType` | yes |  | 11 values, see [GraphQueryType](#graphquerytype) |  | Selects the curated traversal archetype (GraphQueryType) — which sub-spec under `spec` is active and which Cypher template is compiled. |
| `spec` | [`GraphQuerySpec`](./GraphQuerySpec.md) | no |  |  |  | The type-specific payload, keyed by `type`. Because the pattern system has no native discriminated-union type, `spec` is a single GraphQuerySpec wrapper holding all typed sub-specs as nullable sub-objects; the active one matches `type`. Codegen reads only the spec keyed by `type` (mirrors ComputeJobSpec). |

## Allowed values

### GraphQueryType

`reachableNodes`, `effectivePermission`, `permissionExplain`, `ancestors`, `descendants`, `shortestPath`, `neighborhood`, `recommendation`, `custom`, `scopedRolePermission`, `scopedRoleExplain`

## Constraints

Property rules:

- `name`, `provider`, `type` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
