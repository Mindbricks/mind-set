# GraphProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [GraphProvider in Part 2](../spec/GraphProvider.md)

A named graph-database provider configuration. The `name` is the lookup key used everywhere a graph provider is referenced (objectSettings.graphProjection.provider, property graphEdge, service.graphLayer (edges/queries/resources), GraphQueryAction.provider, ComputeJob.graphIO.provider) and the env-var prefix (e.g. `mainGraph` → `GRAPH_MAINGRAPH_*`). The `provider` enum selects the backend driver (only `neo4j` ships first; the surface is provider-agnostic so a later Memgraph/Neptune/ArangoDB adapter is additive). The `configuration` is a flat superset whose relevant keys depend on `provider` — the same modeling BucketProviderConfig uses. Secret keys (password) are masked in API responses and emitted to GRAPH_<NAME>_<KEY> env vars at codegen time.

## Contained in

- [GraphProvidersSettings](./GraphProvidersSettings.md) as `graphProviders` (a list)

## Contains

- `configuration`: [GraphProviderConfig](./GraphProviderConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
