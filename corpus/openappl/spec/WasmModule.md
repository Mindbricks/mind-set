# WasmModule

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [WasmModule in Part 1](../ontology/WasmModule.md)

**Name:** an instance is named by `name`.

Defines a portable WebAssembly module exposed to the service as library functions. Unlike a `NativeKernel` (native C/C++ compiled + linked via FFI, compute hosts only), a `WasmModule` carries a precompiled, sandboxed, toolchain-free `.wasm` binary whose exported functions become callable from MScript as `LIB.<export>(...)`. Because Wasm is portable and sandboxed, this targets ALL languages with a strong embedded WebAssembly runtime (nodejs via the built-in `WebAssembly` global, go via wazero, rust via wasmtime, python via wasmtime-py, java via chicory, dotnet via wasmtime-dotnet, php via the wasm extension). An OpenAPPL compiler never compiles the module — it owns only the `.wasm` bytes (fetched via `source`) and the declared `exports` contract. Keep exports coarse-grained (one unit of work per call) because every host↔guest crossing marshals the arguments. Host objects never cross the boundary; only Wasm value types (`i32`/`i64`/`f32`/`f64`) plus host-marshalled `string`/`buffer` (UTF-8 / numeric bytes copied through the module's linear memory). See `docs/ADR-wasm-module.md` for the linear-memory marshalling contract every language implements identically.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The module id. Unique within the service library. Use camelCase (e.g. `imageOps`, `mathKit`). Namespaces the module's exports; the exports themselves are referenced from MScript as `LIB.<export>(...)`. |
| `source` | [`WasmSource`](./WasmSource.md) | yes |  |  |  | Fetchable reference to the portable `.wasm` binary (or a `.wat` text the toolchain compiles to `.wasm` at codegen time when `wat2wasm` is available). Reuses the `KernelSource` origin/ref/dest/sha256 shape: `bucket` (preferred — the user/AI agent uploads the file, stays inside the trust boundary), `url` (HTTPS, sha256-pinned), `git`, or `inline` (base64 `.wasm` bytes or a tiny `.wat` text carried directly in `ref`). Codegen downloads it into the service's `wasm/` folder at generation time; `dest` names the file under `wasm/` (e.g. `imageOps.wasm`). |
| `exports` | [`WasmExport`](./WasmExport.md)[] | no |  |  |  | The exported Wasm functions to expose as library functions. Each `WasmExport` declares the export `name` (called from MScript as `LIB.<name>(...)`), its ordered `params` (each a name + Wasm value type), and its `returns` type. Only declared exports are bound; others stay inaccessible. |
| `wasi` | `Boolean` | no | `false` |  |  | Whether the module needs WASI (WebAssembly System Interface) imports satisfied at instantiation. Default false for pure-compute modules (no syscalls). When true, the host wires a minimal/sandboxed WASI (clock + random + stdio only; no filesystem/network) so a module compiled against `wasi_snapshot_preview1` instantiates. Pure-compute modules should stay `wasi:false` — it keeps the sandbox tighter and instantiation cheaper. |
| `memoryLimitPages` | `Integer` | no |  |  |  | Optional hard cap on the module's linear-memory growth, in 64KiB Wasm pages. The host enforces it at instantiation (a module that tries to grow beyond is denied). When null, the runtime default applies. Use this to bound a module's memory footprint per call. |
| `fuelLimit` | `Integer` | no |  |  |  | Optional execution-budget cap (instructions / 'fuel') for a single call, for runtimes that support metered execution (wasmtime). When the budget is exhausted the call traps and the host surfaces an error — a guard against a runaway/infinite-loop guest. When null, execution is unmetered. Runtimes without fuel metering map this to their nearest equivalent or ignore it (and the host warns). |
| `timeoutMs` | `Integer` | no |  |  |  | Optional wall-clock timeout (milliseconds) for a single export call. The host aborts the call if it exceeds the budget (epoch-interruption / cancellation on runtimes that support it). When null, no timeout is enforced. Complements `fuelLimit` for runtimes without instruction metering. |

## Constraints

Property rules:

- `name`, `source` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `exports` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
