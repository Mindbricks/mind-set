# ComputeJobSpec

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJobSpec in Part 1](../ontology/ComputeJobSpec.md)

The discriminated type-specific payload of a ComputeJob, keyed by `ComputeJob.type` (§3). The pattern system has no native one-of/discriminated-union type, so this wrapper holds all nine specs (the eight curated archetypes plus the `custom` bring-your-own-code spec, §12) as nullable sub-objects; exactly the one matching the job's `type` is populated and read by codegen. This mirrors the flat-superset modeling used elsewhere (e.g. BucketProviderConfig reads only the fields relevant to the selected provider). v1 ships codegen for `ai-inference` / `batch-transform` / `media-processing`; the other six carry schema only.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `aiInference` | [`AiInferenceSpec`](./AiInferenceSpec.md) | no |  |  |  | Active when `type` is `ai-inference` (AiInferenceSpec). |
| `batchTransform` | [`BatchTransformSpec`](./BatchTransformSpec.md) | no |  |  |  | Active when `type` is `batch-transform` (BatchTransformSpec). |
| `indexing` | [`IndexingSpec`](./IndexingSpec.md) | no |  |  |  | Active when `type` is `indexing` (IndexingSpec). |
| `mediaProcessing` | [`MediaProcessingSpec`](./MediaProcessingSpec.md) | no |  |  |  | Active when `type` is `media-processing` (MediaProcessingSpec). |
| `optimization` | [`OptimizationSpec`](./OptimizationSpec.md) | no |  |  |  | Active when `type` is `optimization` (OptimizationSpec). |
| `simulation` | [`SimulationSpec`](./SimulationSpec.md) | no |  |  |  | Active when `type` is `simulation` (SimulationSpec). |
| `riskCalculation` | [`RiskCalculationSpec`](./RiskCalculationSpec.md) | no |  |  |  | Active when `type` is `risk-calculation` (RiskCalculationSpec). |
| `cryptoBatch` | [`CryptoBatchSpec`](./CryptoBatchSpec.md) | no |  |  |  | Active when `type` is `crypto-batch` (CryptoBatchSpec). |
| `custom` | [`CustomSpec`](./CustomSpec.md) | no |  |  |  | Active when `type` is `custom` — the bring-your-own-code escape hatch (CustomSpec, §12). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
