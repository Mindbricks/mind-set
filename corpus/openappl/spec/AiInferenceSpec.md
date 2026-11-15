# AiInferenceSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [AiInferenceSpec in Part 1](../ontology/AiInferenceSpec.md)

Type-specific spec for `ai-inference` ComputeJobs (docs/ADR-calculation-layer.md, Type-specific specs). libraryWrapped: a mature model library does the math; the compiler generates model load, input normalization, batching, timeout, resource profile, result mapping, and fallback — not the model logic. Configurations of this archetype include EmbeddingJob (`task:embed`), BatchPredictionJob, and ModelServingService (serving mode).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `model` | [`AiInferenceModel`](./AiInferenceModel.md) | no |  |  |  | The model to load (AiInferenceModel) — its source, format, and reference. |
| `task` | `String` | no |  |  |  | Inference task: `classify\|embed\|score\|detect\|transcribe`. Kept as String in v1. |
| `batchSize` | `Integer` | no |  |  |  | Number of inputs batched per forward pass. |
| `preprocessing` | `String` | no |  |  |  | Optional preprocessing recipe/spec applied to inputs before inference (free-form String in v1). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `device` | `ComputeDevice` | no |  | `cpu`, `gpu` |  | Target device for inference (ComputeDevice): `cpu` or `gpu`. |
| `fallback` | `String` | no |  |  |  | Optional fallback behaviour/model when primary inference fails or times out (String in v1). |
| `outputMapping` | `String` | no |  |  |  | Optional mapping of raw model outputs onto the result summary schema (String/MScript in v1). |

## Constraints

Property rules:

- `device` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
