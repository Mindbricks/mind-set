# EventStream

**Level:** `chapter` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [EventStream in Part 2](../spec/EventStream.md)

Declares a high-throughput event pipeline with ingestion, storage and read surfaces. The headline asset of the big-load pattern family — a chapter on `services.eventStreams[]` declaring one high-throughput ingest→hot/cold/analytics pipeline over a logical event topic, with its read surfaces. Folds the cross-cutting big-load concerns (ingestion write contract / partitioning + back-pressure / hot store / cold sink / analytics / retention / cleaning) into SECTIONS rather than a flat bag of peers — exactly the way `ComputeJob` folds spec/input/result/resourceProfile/retryPolicy. Composes the existing kafka/compute/realtime layers (ingestion publishes to a Kafka topic; dispatch reuses ComputeJob; fan-out reuses realtimeHubs); it adds only the missing hot/cold/analytics store BINDINGS, the ingestion/retention DECLARATIONS, and the read SURFACES. In Phase 3 the nodejs big-load-layer wires `streamBasics` + `ingestion` + `hotStore` (Cassandra) + `readSurfaces`; `coldSink` / `analytics` / `retention` / `cleaningPipeline` are defined-but-deferred to P4+ (the schema holds them).

## Contained in

- [Service](./Service.md) as `eventStreams` (a list)

Blueprint paths:

- `services.eventStreams`

## Contains

- `streamBasics`: [EventStreamBasics](./EventStreamBasics.md)
- `ingestion`: [IngestionSettings](./IngestionSettings.md)
- `hotStore`: [HotStoreBinding](./HotStoreBinding.md)
- `coldSink`: [ColdSinkBinding](./ColdSinkBinding.md)
- `analytics`: [AnalyticsBinding](./AnalyticsBinding.md)
- `retention`: [RetentionPolicy](./RetentionPolicy.md)
- `readSurfaces`: [EventStreamReadSurface](./EventStreamReadSurface.md), a list
- `cleaningPipeline`: [EtlPipelineBinding](./EtlPipelineBinding.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
