# BatchTransformSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [BatchTransformSpec in Part 2](../spec/BatchTransformSpec.md)

Type-specific spec for `batch-transform` ComputeJobs (ETL, imports/exports, data cleaning, report precompute, analytics rebuilds, aggregation over millions of rows). hybrid: the compiler generates the schema map, validation, chunking, parallel exec, progress, error-row capture, and artifact. Presets: DataImportPipeline (`direction:import`), DataExportPipeline (`direction:export`), AnalyticsRebuildJob (aggregate→write).

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `batchTransform`

## Contains

- `aggregation`: [BatchAggregation](./BatchAggregation.md)

## References

- `sourceSchema` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `targetSchema` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
