# Calculation

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [Calculation in Part 2](../spec/Calculation.md)

A compute *primitive* — the Tier-1 substrate of the compute layer (docs/ADR-calculation-layer.md §1/§5). A `Calculation` is a single curated math operation over a famous crate/package (FFT a buffer, k-means an array, group-by a dataframe), exposed on the service's library and called from MScript like a function: `LIB.<name>(this.signal)`. It answers within the call — synchronously inline or off-thread — and is meant for small/bounded math that belongs inside a request. Heavy or long-running work is a `ComputeJob` instead. Only valid on rust/python host services (the calculation languages). The `category` selects the algorithm taxonomy bucket whose crate/package set is wired into the build manifest; the `recipe` names a framework-shipped curated consumer (§6), or a `body` supplies author MScript when no recipe fits.

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `calculations` (a list)

Blueprint paths:

- `services.library.calculations`

## Contains

- `params`: [KernelParam](./KernelParam.md), a list
- `execution`: [CalculationExecution](./CalculationExecution.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
