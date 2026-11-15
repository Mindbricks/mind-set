# GraphProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [GraphProviderConfig in Part 1](../ontology/GraphProviderConfig.md)

Graph-database connection credentials and defaults. Fields are a flat superset across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env. `password` is secret (masked in API responses, emitted to GRAPH_<NAME>_PASSWORD).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `uri` | `String` | yes |  |  |  | The Bolt connection URI, e.g. `bolt://localhost:7687`, or `neo4j+s://<id>.databases.neo4j.io` for Neo4j Aura. |
| `username` | `String` | yes |  |  |  | The graph-database username (e.g. `neo4j`). |
| `password` | `String` | yes |  |  | **secret** | The graph-database password. Secret — masked in API responses and emitted to the GRAPH_<NAME>_PASSWORD env var at codegen time. |
| `database` | `String` | no |  |  |  | Optional named database within the instance (Neo4j 4+ multi-database). Defaults to the server default (`neo4j`) when absent. |
| `maxPoolSize` | `Integer` | no |  |  |  | Optional maximum size of the Bolt connection pool. Defaults to the driver default when absent. |

## Constraints

Property rules:

- `uri`, `username`, `password` must be present. (`REQUIRED_FIELD_MISSING`)
