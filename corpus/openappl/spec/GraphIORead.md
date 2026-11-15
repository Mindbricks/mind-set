# GraphIORead

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [GraphIORead in Part 1](../ontology/GraphIORead.md)

The graph INPUT of a ComputeJob.graphIO (docs/ADR-graph-database-layer.md §12) — names a declared GraphQuery whose result feeds the recipe.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `query` | `String` | yes |  |  |  | Name of a service.graphLayer.queries[] entry whose result (the subgraph / rows) is fed to the compute recipe as input. |

## Constraints

Property rules:

- `query` must be present. (`REQUIRED_FIELD_MISSING`)
