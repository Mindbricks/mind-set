# BatchTransformSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [BatchTransformSpec in Part 1](../ontology/BatchTransformSpec.md)

Type-specific spec for `batch-transform` ComputeJobs (ETL, imports/exports, data cleaning, report precompute, analytics rebuilds, aggregation over millions of rows). hybrid: the compiler generates the schema map, validation, chunking, parallel exec, progress, error-row capture, and artifact. Presets: DataImportPipeline (`direction:import`), DataExportPipeline (`direction:export`), AnalyticsRebuildJob (aggregate→write).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `direction` | `String` | no |  |  |  | Data-flow direction: `import\|export\|internal`. Kept as String in v1. |
| `sourceSchema` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject describing the input/source records (DataObjectName). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `targetSchema` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject describing the output/target records (DataObjectName). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `mapping` | `String` | no |  |  |  | Field/transform mapping from source to target (String/MScript in v1). |
| `validation` | `String` | no |  |  |  | Row-level validation rules applied during the transform (String/MScript in v1). |
| `errorRowHandling` | `String` | no |  |  |  | What to do with rows that fail validation: `collect\|fail\|deadletter`. Kept as String in v1. |
| `chunkSize` | `Integer` | no |  |  |  | Number of rows processed per chunk for streaming/parallel execution. |
| `aggregation` | [`BatchAggregation`](./BatchAggregation.md) | no |  |  |  | Optional aggregation spec (groupBy + aggregate functions) applied before write (BatchAggregation). |
| `writeTarget` | `String` | no |  |  |  | Where the transformed output is written (a DataObject, bucket artifact, or external sink — String in v1). |

## Constraints

Property rules:

- `sourceSchema`, `targetSchema` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
