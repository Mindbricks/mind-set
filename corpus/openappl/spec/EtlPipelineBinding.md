# EtlPipelineBinding

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [EtlPipelineBinding in Part 1](../ontology/EtlPipelineBinding.md)

[P5b, defined-but-deferred] The Spark-offloaded data-cleaning/ETL stage of an EventStream. HARD RULE: the transform runs on an EXTERNAL Spark cluster (or equivalent), NEVER inside the generated service — running heavy ETL on the high-throughput ingest path would defeat the big-load strategy. The service is the CONTROL PLANE (submit/trigger/schedule/monitor/cancel the Spark job); the Spark cluster is the DATA PLANE. The designer declares cleanup in a built-in form (declarativeRules, the default) OR supplies a custom Spark script (customScript escape hatch); codegen LOWERS it into the Spark job. Schema-only in Phase 3 — the thin orchestration client lands in Phase 5b.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the bigLoadProvidersSettings store whose engine is `spark` (a compute/ETL provider, added in Phase 5b). The orchestration client submits to its master/Livy/Spark-Connect endpoint. |
| `sourceTier` | `String` | no |  |  |  | The source tier the transform reads. v1 supports only `coldSink`, and only when the stream's `coldSink` is bound to an `s3Parquet` store: the Spark job reads the archived Parquet objects under the cold sink's `objectPrefix`. Empty means `coldSink`. `rawTopic` and `hotStore` are not implemented and are refused at validation (`EVENTSTREAM_CLEANING_SOURCE_TIER_UNSUPPORTED`); a stream with a cleaningPipeline and no `s3Parquet` cold sink is refused too (`EVENTSTREAM_CLEANING_SOURCE_NOT_S3PARQUET`, or the coldSink binding's own `EVENTSTREAM_PROVIDER_*` / `EVENTSTREAM_COLDSINK_ENGINE_INVALID` error when its provider is missing, undeclared or on an engine that cannot be a cold sink). Kept as String in v1. |
| `sinkTier` | `String` | no |  |  |  | The sink tier the cleaned output is written to: `curatedStore` (empty = this default), `coldSink`, or `parquetLake`. v1 records the value but does not branch on it: the cleaned output is always curated Parquet on S3, written to the `curatedStore` store when one is named and declared (under `sinkObjectPrefix`, else `<streamName>Curated/`), otherwise to the stream's `s3Parquet` cold store (under `sinkObjectPrefix`, else the cold sink's `objectPrefix` with its trailing slash dropped plus `Curated/`: `ping/` gives `pingCurated/`). A pipeline with classify rules may not name `hotStore` here (`DECISION_ON_INGEST_PATH`). Kept as String in v1. |
| `mode` | `String` | no | `"declarativeRules"` |  |  | How the cleanup is authored (mirrors ComputeJob.implementationMode): `declarativeRules` (default) = an ordered list of built-in cleanup rules codegen COMPILES into the Spark transform (the designer never sees Spark); `customScript` = an advanced designer supplies a Spark script codegen embeds. Kept as String in v1. |
| `rules` | [`CleaningRule`](./CleaningRule.md)[] | no |  |  |  | [mode=declarativeRules] The ordered cleanup rules (CleaningRule[]) — validate / dedup / normalize / filter / cast / rename — codegen lowers into the Spark transform. Schema-only in Phase 3 (the exact rule schema is finalized in Phase 5b). |
| `customScript` | `Text` | no |  |  |  | [mode=customScript] The advanced Spark script / embedded transform codegen embeds into the Spark job. Schema-only in Phase 3. |
| `schedule` | `String` | no |  |  |  | The trigger: a cron expression (batch cadence) OR `streamContinuous` (a long-running structured-streaming job). Kept as String in v1. |
| `curatedStore` | `String` | no |  |  |  | [Phase 5b] Optional name of a bigLoadProvidersSettings s3Parquet store the CURATED (cleaned) output is written to when sinkTier=curatedStore. Defaults to writing a `Curated/` path on the cold s3Parquet store, next to the cold sink's `objectPrefix` (its trailing slash dropped: `ping/` gives `pingCurated/`). |
| `sinkObjectPrefix` | `String` | no |  |  |  | [Phase 5b] Optional S3 object prefix the curated cleaned Parquet output is written under (e.g. `vehiclePingCurated/`). Defaults to `<streamName>Curated/` on a declared `curatedStore`, else to the cold sink's `objectPrefix` with its trailing slash dropped plus `Curated/` (`ping/` gives `pingCurated/`). |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `rules` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
