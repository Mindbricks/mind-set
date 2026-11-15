# PermissionExplainSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [PermissionExplainSpec in Part 1](../ontology/PermissionExplainSpec.md)

Spec for `permissionExplain` — returns the matched PATH(S) from subject to resource, not just a boolean (docs/ADR-graph-database-layer.md §8b / Cypher map). The enterprise-grade 'why can they access this — which group/role/folder/grant granted it?' query that pure CRUD cannot offer.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `subjectLabel` | `String` | yes |  |  |  | The label of the subject node whose access is being explained (e.g. `User`). |
| `resourceLabels` | `String`[] | no |  |  |  | Candidate labels of the resource node (e.g. ['Folder','Document']). |
| `pathEdges` | `String`[] | no |  |  |  | The relationship types forming the access path, in order (e.g. ['MEMBER_OF','CAN_READ','CONTAINS']). |
| `maxDepth` | `Integer` | no | `20` |  |  | The maximum variable-length depth of the containment/membership portion (the `*0..N` bound). |

## Constraints

Property rules:

- `subjectLabel` must be present. (`REQUIRED_FIELD_MISSING`)
