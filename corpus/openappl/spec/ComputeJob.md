# ComputeJob

**Level:** `chapter` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJob in Part 1](../ontology/ComputeJob.md)

**Name:** an instance is named by `jobBasics.name`.

A compute *workload* — the primary, headline tier of the compute layer (docs/ADR-calculation-layer.md §2/§3). A declared `ComputeJob` generates the full async lifecycle (NOT a synchronous endpoint): a submit Business API that enqueues and returns a jobId, a ComputeQueue, a compute-worker controller that drains it on the bounded compute pool, a result + bucket-backed artifacts, progress/completion events on the outbox, and cooperative cancellation + retry. `type` selects one of the eight curated archetype *specs* (carrying the per-type fields), or `custom` for the bring-your-own-code spec (§12); `executionMode` chooses the async `job` lifecycle (default) or a warm synchronous `serving` endpoint (§11); `implementationMode` makes the library-vs-generate decision explicit (§4). Only valid on rust/python host services; other services *submit* to a compute service over M2M (§7).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `jobBasics` | [`ComputeJobBasics`](./ComputeJobBasics.md) | yes |  |  |  | The job's scalar identity + lifecycle axes (ComputeJobBasics): name, type (the curated workload archetype), executionMode (`job`\|`serving`), implementationMode (the library-vs-generate axis, §4), and parallel (§8). Grouped into a section because a chapter is a container of sections, not loose scalar columns. |
| `spec` | [`ComputeJobSpec`](./ComputeJobSpec.md) | no |  |  |  | The type-specific payload, keyed by `type` (§3). Because the pattern system has no native discriminated-union type, `spec` is a single ComputeJobSpec wrapper holding all nine typed specs as nullable sub-objects (`aiInference`, `batchTransform`, `indexing`, `mediaProcessing`, `optimization`, `simulation`, `riskCalculation`, `cryptoBatch`, `custom`); the active one is the sub-object matching `type`. Codegen reads only the spec keyed by `type`. Each spec keeps its own schema so per-type codegen has a real shape; presets (ThumbnailJob, DataImportPipeline, …) are field-bundles over a spec, not new patterns. |
| `input` | [`ComputeJobInput`](./ComputeJobInput.md) | no |  |  |  | Declares the job's input source (ComputeJobInput) — typically a bucket reference to a large dataset/file plus the schema it conforms to. Large inputs cross as bucket references, never inline blobs (§10). |
| `result` | [`ComputeJobResult`](./ComputeJobResult.md) | no |  |  |  | Declares the job's result shape (ComputeJobResult) — a summary schema (status/metrics, returned in the completion event / job record) plus the artifact format for large outputs stored as bucket references (§2). |
| `graphIO` | [`ComputeJobGraphIO`](./ComputeJobGraphIO.md) | no |  |  |  | Optional graph I/O capability for this ComputeJob (docs/ADR-graph-database-layer.md §12 — the Graph Intelligence hybrid). Beside the job's existing `input` / `result`, `graphIO` declares a graph INPUT (a GraphQuery by name whose result feeds the recipe) and/or a computed-edge OUTPUT (a projected relationship type written back via the §6 write path). The job keeps its normal `type` / `spec`; `graphIO` only swaps the I/O ends — so 'GraphRecommendationJob'-style ideas are presets of `spec` + `graphIO`, not a new job taxonomy. Leave null/absent when the job does not read from or write to a graph. |
| `resourceProfile` | [`ComputeResourceProfile`](./ComputeResourceProfile.md) | no |  |  |  | The job's ComputeResourceProfile (§9) — cores/memory/timeout/concurrency/preferred language/GPU. Drives the worker pool, the deploy manifest's resource requests, and rejection of impossible jobs. Unset = projectSettings.computeSettings.defaultResourceProfile. |
| `retryPolicy` | [`ComputeRetryPolicy`](./ComputeRetryPolicy.md) | no |  |  |  | The job's ComputeRetryPolicy (§9) — attempts, backoff, dead-letter. Applies to `job` mode only; `serving` callers own their own retries (§11). |

## Constraints

Property rules:

- `jobBasics` must be present. (`REQUIRED_FIELD_MISSING`)
