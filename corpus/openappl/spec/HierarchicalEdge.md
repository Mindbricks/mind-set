# HierarchicalEdge

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [HierarchicalEdge in Part 1](../ontology/HierarchicalEdge.md)

**Name:** an instance is named by `relationshipType`.

One edge of a HierarchicalResourceGraph (docs/ADR-graph-database-layer.md §9). `from` / `to` may each be a single node label or a list of candidate labels (e.g. a CAN_READ edge from ['user','group'] to ['folder','document']).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationshipType` | `String` | yes |  |  |  | The Neo4j relationship type, e.g. `CONTAINS`, `MEMBER_OF`, `CAN_READ`, `CAN_EDIT`. |
| `from` | `String`[] | no |  |  |  | Source node label(s) of the edge — a single label or candidate labels (e.g. `folder`, or ['user','group']). |
| `to` | `String`[] | no |  |  |  | Target node label(s) of the edge — a single label or candidate labels (e.g. `document`, or ['folder','document']). |

## Constraints

Property rules:

- `relationshipType` must be present. (`REQUIRED_FIELD_MISSING`)
