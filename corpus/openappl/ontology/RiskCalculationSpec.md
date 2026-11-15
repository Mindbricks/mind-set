# RiskCalculationSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [RiskCalculationSpec in Part 2](../spec/RiskCalculationSpec.md)

Type-specific spec for `risk-calculation` ComputeJobs — portfolio risk, pricing models, credit scoring, forecasting, actuarial. hybrid/generatedNative: the intended OpenAPPL compiler contract includes the risk schema, formula, scenario matrix, MC engine, parallel exec, AUDIT TRAIL (required), and explanation. Presets: PricingEngine (serving mode). This declaration describes the intended compute contract, not a guarantee that every field is executed. ComputeJob hosting is restricted to Rust/Python; Node.js does not host these jobs. Implementation of individual unresolved fields on supported hosts must be assessed separately.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `riskCalculation`

## Contains

No other pattern: every property is a value or a reference.

## References

- `riskSchema` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
