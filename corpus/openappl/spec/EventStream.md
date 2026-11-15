# EventStream

**Level:** `chapter` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [EventStream in Part 1](../ontology/EventStream.md)

**Name:** an instance is named by `streamBasics.name`.

Declares a high-throughput event pipeline with ingestion, storage and read surfaces. The headline asset of the big-load pattern family — a chapter on `services.eventStreams[]` declaring one high-throughput ingest→hot/cold/analytics pipeline over a logical event topic, with its read surfaces. Folds the cross-cutting big-load concerns (ingestion write contract / partitioning + back-pressure / hot store / cold sink / analytics / retention / cleaning) into SECTIONS rather than a flat bag of peers — exactly the way `ComputeJob` folds spec/input/result/resourceProfile/retryPolicy. Composes the existing kafka/compute/realtime layers (ingestion publishes to a Kafka topic; dispatch reuses ComputeJob; fan-out reuses realtimeHubs); it adds only the missing hot/cold/analytics store BINDINGS, the ingestion/retention DECLARATIONS, and the read SURFACES. In Phase 3 the nodejs big-load-layer wires `streamBasics` + `ingestion` + `hotStore` (Cassandra) + `readSurfaces`; `coldSink` / `analytics` / `retention` / `cleaningPipeline` are defined-but-deferred to P4+ (the schema holds them).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `streamBasics` | [`EventStreamBasics`](./EventStreamBasics.md) | yes |  |  |  | The stream's scalar identity + axes (EventStreamBasics): name/codeName, the Kafka topic, the event/telemetry schema (the field shape the ingest API accepts), the partition key, delivery semantics, and the back-pressure / load-shedding knobs. Grouped into a section because a chapter is a container of sections, not loose scalar columns (the ComputeJob.jobBasics idiom). |
| `ingestion` | [`IngestionSettings`](./IngestionSettings.md) | no |  |  |  | The write path (IngestionSettings): batch size + flush interval for the async batched insert, optional idempotency/dedup key, optional ingest rate limit, and the load-shedding priority. The generated ingestion handler does auth → schema-validate → (dedup) → enqueue/batch → fast return; it MUST NOT run heavy per-row work (the big-load discipline). Null = sensible defaults. |
| `hotStore` | [`HotStoreBinding`](./HotStoreBinding.md) | yes |  |  |  | Binds the hot store (HotStoreBinding): the bigLoadProvidersSettings provider name (engine cassandra), the table/keyspace, the partition + clustering columns, and the row TTL. The generated hot consumer/writer upserts current-state + last-N into this store. REQUIRED for a Phase-3 stream (it is the round-trip target). |
| `coldSink` | [`ColdSinkBinding`](./ColdSinkBinding.md) | no |  |  |  | [P4 DONE; s3Parquet=P5] Binds the durable/archival sink for the full append-only history (ColdSinkBinding): a bigLoadProvidersSettings provider name (cassandra append in P4 / s3Parquet in P5). The cold consumer appends every record off the same batched flush that feeds the hot store (no extra request-time work). |
| `analytics` | [`AnalyticsBinding`](./AnalyticsBinding.md) | no |  |  |  | [P4 DONE] Binds the analytics store + declares rollups/windowed aggregations (AnalyticsBinding): a bigLoadProvidersSettings clickhouse provider name + the rollup definitions. Codegen emits a raw MergeTree landing table + one materialized-view→AggregatingMergeTree per rollup, fed off the batched flush (the request path never aggregates). |
| `retention` | [`RetentionPolicy`](./RetentionPolicy.md) | no |  |  |  | [P4 DONE] Hot TTL / cold retention / rollup cadence / archival trigger (RetentionPolicy), driving a generated retention cron that prunes cold rows older than coldRetentionDays (the hot tier ages via its TTL). |
| `readSurfaces` | [`EventStreamReadSurface`](./EventStreamReadSurface.md)[] | no |  |  |  | The generated read APIs over the stores (EventStreamReadSurface[]). Each surface is a query archetype — latestN (last-N pings for a partition from the hot store), currentState, historySince, analyticsRollup, replaySince — exposed as an api-layer route. Phase 3 wires the hot-store surfaces (latestN / currentState). |
| `cleaningPipeline` | [`EtlPipelineBinding`](./EtlPipelineBinding.md) | no |  |  |  | [P5b, defined-but-deferred] The Spark-offloaded ETL cleaning stage (EtlPipelineBinding, §4.1) — the transform runs on an EXTERNAL Spark cluster, NEVER in the generated service (running heavy ETL on the ingest path would break the big-load strategy). Declares the spark provider name, source/sink tiers, the declarative cleanup rules (or a custom script), and the schedule. The schema holds it now; the thin Spark orchestration client lands in Phase 5b. |

## Constraints

Property rules:

- `streamBasics`, `hotStore` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `readSurfaces` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EVENTSTREAM_CLEANING_SOURCE_NOT_S3PARQUET` | error | EventStream "…" declares a cleaningPipeline but no coldSink: the Spark job reads the stream's s3Parquet cold sink, so bind coldSink to an s3Parquet store or remove the cleaningPipeline. |
| `EVENTSTREAM_CLEANING_SOURCE_TIER_UNSUPPORTED` | error | EventStream "…" cleaningPipeline sourceTier "…" is not supported: v1 reads only the stream's s3Parquet cold sink (coldSink). |
| `EVENTSTREAM_CLUSTERING_KEY_UNKNOWN` | error | EventStream "…" clusteringKey "…" is not a declared eventSchema field. |
| `EVENTSTREAM_IDEMPOTENCY_KEY_UNKNOWN` | error | EventStream "…" ingestion.idempotencyKey "…" is not a declared eventSchema field. |
| `EVENTSTREAM_INGEST_OPEN_MULTI_TENANT` | warning | EventStream "…" accepts anonymous ingest (ingestion.loginRequired is not true) in a multi-tenant project: any client can write any event into any partition. |
| `EVENTSTREAM_NOT_TENANT_SCOPED` | warning | EventStream "…" is not tenant-scoped in a multi-tenant project: its read surfaces answer any partition a caller names, whichever tenant wrote it. |
| `EVENTSTREAM_PARTITION_KEY_UNKNOWN` | error | EventStream "…" partitionKey "…" is not a declared eventSchema field. |
| `EVENTSTREAM_PARTITION_REQUIRED` | error | EventStream "…" must declare a partitionKey — the big-load family is partition-first. |
| `EVENTSTREAM_PROVIDER_MISSING` | error | EventStream "…" … must reference a bigLoadProvidersSettings store by name (provider). |
| `EVENTSTREAM_PROVIDER_UNKNOWN` | error | EventStream "…" … provider "…" does not match any projectSettings.bigLoadProvidersSettings.bigLoadStores[].name. |
| `EVENTSTREAM_READSURFACE_PARTITION_UNKNOWN` | error | EventStream "…" readSurface partitionParam "…" is not a declared eventSchema field. |
| `EVENTSTREAM_STAMP_FIELD_SHARED` | error | EventStream "…" ingestion.… and ingestion.… both name "…"; each stamp needs its own field (… is stamped from …). |
| `EVENTSTREAM_STAMP_FIELD_UNKNOWN` | error | EventStream "…" ingestion.… "…" is not a declared eventSchema field. |
| `EVENTSTREAM_TENANT_FIELD_SINGLE_TENANT` | error | EventStream "…" sets ingestion.tenantField "…" but the project is not multi-tenant: no session carries a tenant, so every ingest would leave it empty and every read would be refused. |
| `EVENTSTREAM_TENANT_ROLLUP_NOT_PARTITION` | error | EventStream "…" readSurface "…" is an analyticsRollup, which aggregates a whole partition and cannot be narrowed to one tenant's rows; a tenant-scoped stream (ingestion.tenantField "…") serves a rollup only when the … |
