# RecommendationSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [RecommendationSpec in Part 1](../ontology/RecommendationSpec.md)

Spec for `recommendation` — a collaborative-filtering traversal: peers who share an edge with the subject, then THEIR other targets (docs/ADR-graph-database-layer.md §8b / §12). 'Users like me also viewed…'. For learned/scored recommendation use a ComputeJob with graphIO instead.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `subjectLabel` | `String` | yes |  |  |  | The label of the subject the recommendation is for (e.g. `User`). |
| `viaEdge` | `String` | yes |  |  |  | The relationship type shared between the subject and its peers (e.g. `VIEWED`). |
| `targetLabel` | `String` | yes |  |  |  | The label of the recommended target nodes (e.g. `Document`). |
| `limit` | `Integer` | no | `10` |  |  | Maximum number of recommended targets to return. |

## Constraints

Property rules:

- `subjectLabel`, `viaEdge`, `targetLabel` must be present. (`REQUIRED_FIELD_MISSING`)
