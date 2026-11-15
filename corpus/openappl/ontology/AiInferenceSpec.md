# AiInferenceSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [AiInferenceSpec in Part 2](../spec/AiInferenceSpec.md)

Type-specific spec for `ai-inference` ComputeJobs (docs/ADR-calculation-layer.md, Type-specific specs). libraryWrapped: a mature model library does the math; the compiler generates model load, input normalization, batching, timeout, resource profile, result mapping, and fallback — not the model logic. Configurations of this archetype include EmbeddingJob (`task:embed`), BatchPredictionJob, and ModelServingService (serving mode).

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `aiInference`

## Contains

- `model`: [AiInferenceModel](./AiInferenceModel.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
