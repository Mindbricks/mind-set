# WasmModule

**Level:** `section` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [WasmModule in Part 2](../spec/WasmModule.md)

Defines a portable WebAssembly module exposed to the service as library functions. Unlike a `NativeKernel` (native C/C++ compiled + linked via FFI, compute hosts only), a `WasmModule` carries a precompiled, sandboxed, toolchain-free `.wasm` binary whose exported functions become callable from MScript as `LIB.<export>(...)`. Because Wasm is portable and sandboxed, this targets ALL languages with a strong embedded WebAssembly runtime (nodejs via the built-in `WebAssembly` global, go via wazero, rust via wasmtime, python via wasmtime-py, java via chicory, dotnet via wasmtime-dotnet, php via the wasm extension). An OpenAPPL compiler never compiles the module — it owns only the `.wasm` bytes (fetched via `source`) and the declared `exports` contract. Keep exports coarse-grained (one unit of work per call) because every host↔guest crossing marshals the arguments. Host objects never cross the boundary; only Wasm value types (`i32`/`i64`/`f32`/`f64`) plus host-marshalled `string`/`buffer` (UTF-8 / numeric bytes copied through the module's linear memory). See `docs/ADR-wasm-module.md` for the linear-memory marshalling contract every language implements identically.

## Contained in

- [ServiceLibrary](./ServiceLibrary.md) as `wasmModules` (a list)

Blueprint paths:

- `services.library.wasmModules`

## Contains

- `source`: [WasmSource](./WasmSource.md)
- `exports`: [WasmExport](./WasmExport.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
