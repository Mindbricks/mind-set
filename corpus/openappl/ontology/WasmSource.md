# WasmSource

**Level:** `subsection` · **Family:** [ServiceLibrary](./families.md#servicelibrary) (domain `Service`)

**Specification:** [WasmSource in Part 2](../spec/WasmSource.md)

A fetchable reference to the `.wasm` binary (or `.wat` text) a `WasmModule` runs. Same fetch contract as `KernelSource`: designers work through the web and the AI agent, never a local filesystem, so the binary is uploaded to the platform bucket (preferred) or hosted at a URL/git remote, or carried inline (base64 `.wasm` / literal `.wat`). Codegen downloads it into the service's `wasm/` folder at generation time, verifying `sha256` for url/git origins.

## Contained in

- [WasmModule](./WasmModule.md) as `source`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
