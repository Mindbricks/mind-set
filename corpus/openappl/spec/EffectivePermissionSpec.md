# EffectivePermissionSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [EffectivePermissionSpec in Part 1](../ontology/EffectivePermissionSpec.md)

Spec for `effectivePermission` — boolean path-existence from a subject to a resource over membership + grant + containment edges (docs/ADR-graph-database-layer.md §8b / Cypher map). Returns whether the subject effectively holds the access.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `subjectLabel` | `String` | yes |  |  |  | The label of the subject node (e.g. `User`). |
| `resourceLabels` | `String`[] | no |  |  |  | Candidate labels of the resource node (e.g. ['Folder','Document']). |
| `pathEdges` | `String`[] | no |  |  |  | The relationship types forming the access path, in order (e.g. ['MEMBER_OF','CAN_READ','CONTAINS']). |
| `maxDepth` | `Integer` | no | `20` |  |  | The maximum variable-length depth of the containment/membership portion (the `*0..N` bound). |

## Constraints

Property rules:

- `subjectLabel` must be present. (`REQUIRED_FIELD_MISSING`)
