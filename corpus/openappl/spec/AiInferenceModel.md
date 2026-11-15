# AiInferenceModel

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [AiInferenceModel in Part 1](../ontology/AiInferenceModel.md)

Locates the model an AiInferenceSpec loads. `source` says where it comes from, `format` its serialization, and `ref` the locator (bucket key / hub id / URL).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `source` | `String` | no |  |  |  | Where the model is loaded from: `bucket\|hub\|hf\|url`. Kept as String in v1. |
| `format` | `String` | no |  |  |  | Model serialization format: `onnx\|torch\|safetensors`. Kept as String in v1. |
| `ref` | `String` | no |  |  |  | The locator, interpreted per `source`: a bucket object key, a model-hub id, a Hugging Face repo id, or an HTTPS URL. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
