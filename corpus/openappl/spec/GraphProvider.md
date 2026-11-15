# GraphProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [GraphProvider in Part 1](../ontology/GraphProvider.md)

**Name:** an instance is named by `name`.

A named graph-database provider configuration. The `name` is the lookup key used everywhere a graph provider is referenced (objectSettings.graphProjection.provider, property graphEdge, service.graphLayer (edges/queries/resources), GraphQueryAction.provider, ComputeJob.graphIO.provider) and the env-var prefix (e.g. `mainGraph` → `GRAPH_MAINGRAPH_*`). The `provider` enum selects the backend driver (only `neo4j` ships first; the surface is provider-agnostic so a later Memgraph/Neptune/ArangoDB adapter is additive). The `configuration` is a flat superset whose relevant keys depend on `provider` — the same modeling BucketProviderConfig uses. Secret keys (password) are masked in API responses and emitted to GRAPH_<NAME>_<KEY> env vars at codegen time.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from graphProjection/graphEdge/graphLayer.queries/GraphQueryAction/graphIO and as the env-var prefix. Must be a valid codeName. |
| `provider` | `GraphDatabaseType` | no | `"neo4j"` | `neo4j` |  | The graph-database backend type. Only `neo4j` ships first; the data-plane runtime branches on this so additional providers (Memgraph, Neptune, ArangoDB) are additive behind the same enum. |
| `configuration` | [`GraphProviderConfig`](./GraphProviderConfig.md) | no |  |  |  | Connection details for the graph database. The required keys depend on `provider` — for neo4j: uri (bolt://… or neo4j+s:// for Aura), username, password (secret), database (optional), maxPoolSize (optional). |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
