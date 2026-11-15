# GraphServiceLayer

**Level:** `chapter` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [GraphServiceLayer in Part 1](../ontology/GraphServiceLayer.md)

The service's graph-database surface, namespaced under `service.graphLayer` so the graph collections don't pollute the Service top level (docs/ADR-graph-database-layer.md §4c/§8/§9). Groups the service's standalone `GraphEdge`s (graph-only relationships, §4c), declarative `GraphQuery`s (curated traversal archetypes, §8b), and composite `HierarchicalResourceGraph` resources (the flagship authorization graph, §9). DataObject node projections live on `objectSettings.graphProjection`; graph providers live on `projectSettings.graphProvidersSettings`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `edges` | [`GraphEdge`](./GraphEdge.md)[] | no |  |  |  | Standalone graph-only relationships hosted by this service (§4c). A `GraphEdge` exists ONLY in the graph — no FK, no join object backs it (contrast the FK property `graphEdge` §4a and the edge-object `projectsAsEdge` §4b). |
| `queries` | [`GraphQuery`](./GraphQuery.md)[] | no |  |  |  | Declarative graph-traversal query archetypes (§8b). Each `GraphQuery` selects a curated archetype via `type` (GraphQueryType) — reachableNodes / effectivePermission / permissionExplain / ancestors / descendants / shortestPath / neighborhood / recommendation / custom — and carries its typed sub-spec under the `spec` wrapper (the ComputeJob idiom). Referenced by name from `GraphQueryAction.query` and `ComputeJob.graphIO.reads.query`. |
| `resources` | [`HierarchicalResourceGraph`](./HierarchicalResourceGraph.md)[] | no |  |  |  | Flagship composite graph patterns (§9). A `HierarchicalResourceGraph` expands into node projections, hierarchy/permission edges, an inheritance policy, and a ready set of queries for the document-management authorization use case. |

## Constraints

Property rules:

- The items of `edges` must have distinct names (`relationshipType`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `queries` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `resources` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
