# ComputeJobSpec

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJobSpec in Part 2](../spec/ComputeJobSpec.md)

The discriminated type-specific payload of a ComputeJob, keyed by `ComputeJob.type` (§3). The pattern system has no native one-of/discriminated-union type, so this wrapper holds all nine specs (the eight curated archetypes plus the `custom` bring-your-own-code spec, §12) as nullable sub-objects; exactly the one matching the job's `type` is populated and read by codegen. This mirrors the flat-superset modeling used elsewhere (e.g. BucketProviderConfig reads only the fields relevant to the selected provider). v1 ships codegen for `ai-inference` / `batch-transform` / `media-processing`; the other six carry schema only.

## Contained in

- [ComputeJob](./ComputeJob.md) as `spec`

Blueprint paths:

- `services.computeJobs.spec`

## Contains

- `aiInference`: [AiInferenceSpec](./AiInferenceSpec.md)
- `batchTransform`: [BatchTransformSpec](./BatchTransformSpec.md)
- `indexing`: [IndexingSpec](./IndexingSpec.md)
- `mediaProcessing`: [MediaProcessingSpec](./MediaProcessingSpec.md)
- `optimization`: [OptimizationSpec](./OptimizationSpec.md)
- `simulation`: [SimulationSpec](./SimulationSpec.md)
- `riskCalculation`: [RiskCalculationSpec](./RiskCalculationSpec.md)
- `cryptoBatch`: [CryptoBatchSpec](./CryptoBatchSpec.md)
- `custom`: [CustomSpec](./CustomSpec.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
