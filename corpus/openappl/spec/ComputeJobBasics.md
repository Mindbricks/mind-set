# ComputeJobBasics

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJobBasics in Part 1](../ontology/ComputeJobBasics.md)

Defines a compute job's identity, workload type, execution mode and implementation mode. The compute job's scalar identity + lifecycle axes (section): `name`, `type` (the curated workload archetype), `executionMode` (`job` | `serving`), `implementationMode` (the library-vs-generate axis) and `parallel`. Grouped into a section because a chapter is a container of sections, not loose scalar columns.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The job name. Unique within the service; used to name the generated submit/get/list/cancel Business APIs and the worker handler. Use camelCase (e.g. `rebuildTenantAnalytics`). |
| `type` | `ComputeJobType` | yes |  | 9 values, see [ComputeJobType](#computejobtype) |  | Selects the curated workload archetype (ComputeJobType) — which type-specific spec under `spec` is active and which defaults (category set, libraries, implementation mode, resource profile, result/artifact shape) apply. `custom` lets the designer supply a job whose body is author-provided while still inheriting the lifecycle. |
| `executionMode` | `ExecutionMode` | no | `"job"` | `job`, `serving` |  | `job` (default) — the async, queued, observable, cancellable, retryable, artifact-producing lifecycle of §2. `serving` — a warm controller that loads the spec's model/solver/state once and exposes a synchronous, M2M-allowed, bounded-concurrency API with no queue/artifact/retry (§11). In v1 only `job` mode is generated; `serving` is schema-only. |
| `implementationMode` | `ImplementationMode` | no |  | `libraryWrapped`, `toolOrchestrated`, `generatedNative`, `hybrid` |  | The explicit library-vs-generate axis (§4): `libraryWrapped` (mature library does the math; generate only loading/batching/marshaling/lifecycle), `toolOrchestrated` (work done by an external binary like FFmpeg/Tesseract; generate intake/command/artifact capture), `generatedNative` (the structure IS the business logic — a Monte Carlo loop, a constraint problem, a risk formula — generated from the pattern using libraries only for primitives), or `hybrid` (generated orchestration around library-backed heavy lifting). |
| `parallel` | `ComputeParallel` | no |  | `single`, `data-parallel` |  | Intra-job parallelism (§8): `single` or `data-parallel`. `data-parallel` wires rayon (Rust) or a thread/process strategy (Python per §8) sized by the resource profile; deps are wired from the type→categories mapping (§5). |

## Allowed values

### ComputeJobType

`ai-inference`, `batch-transform`, `indexing`, `media-processing`, `optimization`, `simulation`, `risk-calculation`, `crypto-batch`, `custom`

## Constraints

Property rules:

- `name`, `type` must be present. (`REQUIRED_FIELD_MISSING`)
- `type`, `executionMode`, `implementationMode`, `parallel` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
