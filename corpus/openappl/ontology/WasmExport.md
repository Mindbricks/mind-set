# WasmExport

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [WasmExport in Part 2](../spec/WasmExport.md)

One exported function of a `WasmModule`, surfaced to the service library as `LIB.<name>(...)`. Declares the export's `name`, its ordered typed `params`, and its `returns` type. The host binds exactly these exports; the value boundary is flat (Wasm value types plus host-marshalled `string`/`buffer`), so host objects never cross into the guest.

## Contained in

- [WasmModule](./WasmModule.md) as `exports` (a list)

## Contains

- `params`: [WasmParam](./WasmParam.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
