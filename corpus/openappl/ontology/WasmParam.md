# WasmParam

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [WasmParam in Part 2](../spec/WasmParam.md)

A single parameter of a `WasmExport`. The value type is flat so it can cross the host↔guest boundary without host-object marshaling: a Wasm numeric value type (`i32`/`i64`/`f32`/`f64`), a host-marshalled UTF-8 `string`, or a numeric/byte `buffer`. For a `string`/`buffer` the host copies the bytes into the module's linear memory and passes a pointer + length pair to the export.

## Contained in

- [WasmExport](./WasmExport.md) as `params` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
