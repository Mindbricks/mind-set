# GraphProjection

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [GraphProjection in Part 1](../ontology/GraphProjection.md)

Projects a DataObject into a graph database (docs/ADR-graph-database-layer.md §3/§4b/§5). Node-shaped (set `labels` + `projectedProperties`) OR edge-shaped (set `projectsAsEdge`), never both. Node mode: on every write of the row, `projectToGraph` does an idempotent `MERGE (n:Label {identity}) SET n += $props` over the `projectedProperties` subset; `filterableProperties` (a subset) drive Neo4j indexes so traversals can filter in-graph. Edge mode: the object's rows are relationships (a join/grant table) — see GraphEdgeProjection. `projectedProperties` are the SELECTIVE filter set only (status/category/tenantId/createdAt) — never large text/blobs/full bodies; non-projected attributes are hydrated relationally (§5). Referenced property names are real properties of this object (PropRefer).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider this object projects into (must match a projectSettings.graphProvidersSettings.graphProviders[].name). May be omitted when the project declares at most one graph provider: the projection then uses that provider, or mainGraph when none is declared. Required when the project declares two or more (GRAPH_PROJECTION_PROVIDER_REQUIRED). |
| `labels` | `String`[] | no |  |  |  | Neo4j node labels for the projected node (node mode), e.g. ['Document']. Every declared label is written on the node; the MERGE is keyed on the FIRST (primary) label and SETs the rest, e.g. labels ['Employee', 'Manager'] write `MERGE (n:Employee {identity}) SET n:Employee:Manager, n += $props`. Each label must be a plain Cypher identifier (letters, digits, `_`, not starting with a digit): any other label is a GRAPH_LABEL_INVALID validation error (the runtime would refuse it and skip the whole node write). A label later removed from this list is not removed from nodes already written. Leave null/absent in edge mode (use `projectsAsEdge`). |
| `identity` | [`PropRefer`](./PropRefer.md) | no | `"id"` |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | The node-key property used in `MERGE (n:Label {identity})` (PropRefer, defaults to `id`). It is also the hard-delete key: a hard delete runs `MATCH (n:Label {identity: $key}) DETACH DELETE n` with `$key` bound to the deleted row's own identity value (a row without one removes nothing). Node mode only. |
| `projectedProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Properties COPIED into the node (PropRefer[]). The SELECTIVE filter/identity set only — id, tenantId, and simple flat filter attributes (status, category, createdAt). Never large text, descriptions, blobs, or full document bodies (§5). Node mode only. |
| `filterableProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | A subset of `projectedProperties` used in WHERE clauses — drives the Neo4j indexes the control plane creates so traversals filter in-graph (§5/§7). Node mode only. |
| `projectsAsEdge` | [`GraphEdgeProjection`](./GraphEdgeProjection.md) | no |  |  |  | When set, this object's rows project as RELATIONSHIPS rather than vertices (edge mode — e.g. a permissionGrant join/grant table). A GraphProjection is node-shaped OR edge-shaped, never both. See GraphEdgeProjection. |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- `identity`, `projectedProperties`, `filterableProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `GRAPH_LABEL_INVALID` | error | Graph label "…" is not a plain Cypher identifier (letters, digits and _, not starting with a digit). |
