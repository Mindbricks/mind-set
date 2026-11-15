# GraphIOWrite

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [GraphIOWrite in Part 1](../ontology/GraphIOWrite.md)

The computed-edge OUTPUT of a ComputeJob.graphIO (docs/ADR-graph-database-layer.md §12) — the projected relationship the job writes back into the graph after computing scores/clusters/embeddings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationshipType` | `String` | yes |  |  |  | The Neo4j relationship type the job writes back, e.g. `RECOMMENDED`. |
| `from` | `String` | no |  |  |  | Source node label of the written edge (e.g. `user`). |
| `to` | `String` | no |  |  |  | Target node label of the written edge (e.g. `document`). |
| `edgeProperties` | `String`[] | no |  |  |  | Names of the computed properties written onto each edge, e.g. ['score','reason']. |

## Constraints

Property rules:

- `relationshipType` must be present. (`REQUIRED_FIELD_MISSING`)
