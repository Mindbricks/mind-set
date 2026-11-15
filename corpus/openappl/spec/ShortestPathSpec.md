# ShortestPathSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ShortestPathSpec in Part 1](../ontology/ShortestPathSpec.md)

Spec for `shortestPath` — `shortestPath((a)-[*]-(b))` between two nodes (docs/ADR-graph-database-layer.md §8b). 'Degrees of separation', 'is account A linked to flagged account B?'.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fromLabel` | `String` | yes |  |  |  | The label of the start node `a`. |
| `toLabel` | `String` | yes |  |  |  | The label of the end node `b`. |
| `edgeTypes` | `String`[] | no |  |  |  | Optional restriction of the relationship types the path may traverse (empty = any). |
| `maxDepth` | `Integer` | no |  |  |  | Optional maximum path length (the `*..N` bound). Unset = unbounded. |

## Constraints

Property rules:

- `fromLabel`, `toLabel` must be present. (`REQUIRED_FIELD_MISSING`)
