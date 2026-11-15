# RiskCalculationSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [RiskCalculationSpec in Part 1](../ontology/RiskCalculationSpec.md)

Type-specific spec for `risk-calculation` ComputeJobs — portfolio risk, pricing models, credit scoring, forecasting, actuarial. hybrid/generatedNative: the intended OpenAPPL compiler contract includes the risk schema, formula, scenario matrix, MC engine, parallel exec, AUDIT TRAIL (required), and explanation. Presets: PricingEngine (serving mode). This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `riskSchema` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Name of the DataObject describing the risk inputs (DataObjectName). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `formula` | `String` | no |  |  |  | The auditable risk formula (generatedNative MScript/native — String in v1). |
| `scenarioMatrix` | `String` | no |  |  |  | The scenario matrix over which risk is evaluated (String in v1). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `monteCarlo` | `String` | no |  |  |  | Optional Monte Carlo configuration — delegates to a `simulation` spec (String in v1; delegated-spec reference is a later-wave refinement). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `auditTrail` | `Boolean` | no |  |  |  | Whether a full audit trail of inputs/intermediate values/outputs is recorded. REQUIRED for risk-calculation — should be true. |
| `explanation` | `Boolean` | no |  |  |  | When true, a human-readable explanation of the risk result is produced. |

## Constraints

Property rules:

- `riskSchema` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
