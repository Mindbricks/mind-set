# EtlPipelineBinding

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [EtlPipelineBinding in Part 2](../spec/EtlPipelineBinding.md)

[P5b, defined-but-deferred] The Spark-offloaded data-cleaning/ETL stage of an EventStream. HARD RULE: the transform runs on an EXTERNAL Spark cluster (or equivalent), NEVER inside the generated service — running heavy ETL on the high-throughput ingest path would defeat the big-load strategy. The service is the CONTROL PLANE (submit/trigger/schedule/monitor/cancel the Spark job); the Spark cluster is the DATA PLANE. The designer declares cleanup in a built-in form (declarativeRules, the default) OR supplies a custom Spark script (customScript escape hatch); codegen LOWERS it into the Spark job. Schema-only in Phase 3 — the thin orchestration client lands in Phase 5b.

## Contained in

- [EventStream](./EventStream.md) as `cleaningPipeline`

Blueprint paths:

- `services.eventStreams.cleaningPipeline`

## Contains

- `rules`: [CleaningRule](./CleaningRule.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
