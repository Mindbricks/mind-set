# GraphProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [GraphProvidersSettings in Part 2](../spec/GraphProvidersSettings.md)

Container for graph-database provider configurations (docs/ADR-graph-database-layer.md §1). Each entry is a named graph connection (e.g. 'mainGraph') that can be referenced by DataObject `objectSettings.graphProjection.provider`, property `graphEdge`, `service.graphLayer` (edges/queries/resources), `GraphQueryAction.provider`, and `ComputeJob.graphIO.provider`. The generator emits GRAPH_<NAME>_* environment variables per provider so service code can construct a Bolt driver pool at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `graphProvidersSettings`

Blueprint paths:

- `projectSettings.graphProvidersSettings`

## Contains

- `graphProviders`: [GraphProvider](./GraphProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
