# NeighborhoodSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [NeighborhoodSpec in Part 1](../ontology/NeighborhoodSpec.md)

Spec for `neighborhood` — N-hop expansion around a node (docs/ADR-graph-database-layer.md §8b). 'Everything within 2 hops' (fraud, knowledge graph).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `centerLabel` | `String` | yes |  |  |  | The label of the center node the neighborhood expands around. |
| `edgeTypes` | `String`[] | no |  |  |  | Optional restriction of the relationship types expanded over (empty = any). |
| `hops` | `Integer` | no | `2` |  |  | The number of hops to expand (the `*1..N` bound). |

## Constraints

Property rules:

- `centerLabel` must be present. (`REQUIRED_FIELD_MISSING`)
