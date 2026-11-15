# GraphEdge

**Level:** `section` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [GraphEdge in Part 1](../ontology/GraphEdge.md)

**Name:** an instance is named by `relationshipType`.

A standalone, graph-only relationship hosted on a service (docs/ADR-graph-database-layer.md §4c). Unlike the FK property `graphEdge` (§4a) or the edge-object `projectsAsEdge` (§4b), a GraphEdge has NO relational home — it exists only in the graph (e.g. a computed `SIMILAR_TO` between documents). Its `properties[]` reuse the standard DataProperty shape. Sibling of computeJobs / dbBuckets on the service.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationshipType` | `String` | yes |  |  |  | The Neo4j relationship type, e.g. `SIMILAR_TO`. Unique within the service; used as the edge's name. |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider this edge lives in (must match a projectSettings.graphProvidersSettings.graphProviders[].name). |
| `from` | `String` | yes |  |  |  | The source node label (a projected node label, e.g. `Document`). |
| `to` | `String` | yes |  |  |  | The target node label (a projected node label, e.g. `Document`). |
| `direction` | `GraphDirection` | yes |  | `outbound`, `inbound`, `undirected` |  | Orientation of the relationship (GraphDirection): `outbound` / `inbound` / `undirected`. |
| `cardinality` | `GraphCardinality` | yes |  | `OneToOne`, `OneToMany`, `ManyToMany` |  | The relationship cardinality (GraphCardinality): `OneToOne` / `OneToMany` / `ManyToMany`. |
| `properties` | [`DataProperty`](./DataProperty.md)[] | no |  |  |  | Optional properties carried on the relationship, declared with the standard DataProperty shape. |

## Constraints

Property rules:

- `relationshipType`, `provider`, `from`, `to`, `direction`, `cardinality` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction`, `cardinality` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `properties` must have distinct names (`basicSettings.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
