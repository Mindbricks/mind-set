# KernelParam

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [KernelParam in Part 2](../spec/KernelParam.md)

A single parameter of a `NativeKernel`. The value type is flat — a scalar, a numeric buffer, raw bytes, or a UTF-8 string — so it can cross the C ABI without host-object marshaling. For a buffer parameter the generated C signature passes a pointer plus an element count `n`.

## Contained in

- [Calculation](./Calculation.md) as `params` (a list)
- [CustomSpec](./CustomSpec.md) as `params` (a list)
- [NativeKernel](./NativeKernel.md) as `params` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
