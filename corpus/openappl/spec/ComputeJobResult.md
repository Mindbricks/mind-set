# ComputeJobResult

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeJobResult in Part 1](../ontology/ComputeJobResult.md)

Declares a ComputeJob's result shape (§2). The `summarySchema` is a small status/metrics summary returned in the job record and completion event; large outputs are written as bucket-referenced artifacts in the `artifact` format.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `summarySchema` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject describing the small result summary (status, metrics, counts) carried in the job record / completion event (DataObjectName). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `artifact` | `String` | no |  |  |  | Artifact format for large outputs stored as bucket references (e.g. `parquet`, `csv`, `json`, `png`, `pdf`, `onnx`). Kept as String in v1 — the open artifact-format set is workload-dependent. |

## Constraints

Property rules:

- `summarySchema` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
