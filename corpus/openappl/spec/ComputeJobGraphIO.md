# ComputeJobGraphIO

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJobGraphIO in Part 1](../ontology/ComputeJobGraphIO.md)

Graph I/O ends for a ComputeJob (docs/ADR-graph-database-layer.md §12). `reads` feeds a GraphQuery result into the recipe; `writes` persists computed edges back into the graph. Both are optional — a job may read only, write only, or both. So compute produces enriched relationships; the graph persists and serves them (GraphQuery serves top-N at request time, no compute on the hot path).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider this job reads from / writes to (must match a projectSettings.graphProvidersSettings.graphProviders[].name). |
| `reads` | [`GraphIORead`](./GraphIORead.md) | no |  |  |  | Optional graph input (GraphIORead) — a GraphQuery by name whose result subgraph feeds the recipe (e.g. the VIEWED subgraph for a recommendation job). |
| `writes` | [`GraphIOWrite`](./GraphIOWrite.md) | no |  |  |  | Optional computed-edge output (GraphIOWrite) — a projected relationship type written back via the §6 write path (e.g. `(:User)-[:RECOMMENDED {score}]->(:Document)`). |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
