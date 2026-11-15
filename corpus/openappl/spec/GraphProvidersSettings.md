# GraphProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [GraphProvidersSettings in Part 1](../ontology/GraphProvidersSettings.md)

Container for graph-database provider configurations (docs/ADR-graph-database-layer.md §1). Each entry is a named graph connection (e.g. 'mainGraph') that can be referenced by DataObject `objectSettings.graphProjection.provider`, property `graphEdge`, `service.graphLayer` (edges/queries/resources), `GraphQueryAction.provider`, and `ComputeJob.graphIO.provider`. The generator emits GRAPH_<NAME>_* environment variables per provider so service code can construct a Bolt driver pool at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `graphProviders` | [`GraphProvider`](./GraphProvider.md)[] | no |  |  |  | List of configured graph-database providers. Add one entry per graph connection you want available project-wide. Multiple entries can share the same provider type (e.g. two Neo4j instances). |

## Constraints

Property rules:

- The items of `graphProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
