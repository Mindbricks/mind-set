# CalculationExecution

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [CalculationExecution in Part 2](../spec/CalculationExecution.md)

Execution policy for a `Calculation` primitive (docs/ADR-calculation-layer.md §1/§8). Governs whether the call runs inline on the request thread or is offloaded, whether its internal work is single-threaded or data-parallel, an optional thread budget, and the target compute device.

## Contained in

- [Calculation](./Calculation.md) as `execution`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
