# NativeKernel

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [NativeKernel in Part 1](../ontology/NativeKernel.md)

**Name:** an instance is named by `name`.

Defines a native compute kernel exposed to the service as a library function. A NativeKernel wraps an existing native library (CUDA/MKL/OpenCV/a proprietary HPC routine) behind a stable `extern "C"` shim — the only native code an OpenAPPL compiler compiles. The compiler never binds to the C++ library directly and never parses it; it owns only the C-shaped shim contract. The kernel is compiled and linked into the consuming service via FFI (Rust `build.rs`/bindgen, Node napi-rs or koffi, and per-language FFI for the other targets) and is referenced from MScript like any other library function: `LIB.computeShippingBatch(this.weights, this.zone)`. Keep kernels coarse-grained (one large unit of work per call) because every FFI crossing copies the argument buffers. See `docs/ADR-cpp-kernel-native-lib.md`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The kernel name. Unique within the service library; referenced from MScript as `LIB.<name>(...)`. Use camelCase (e.g. `computeShippingBatch`). |
| `lang` | `KernelLang` | no | `"cpp"` | `cpp`, `c` |  | Source language of the kernel shim. `cpp` for an `extern "C"`-wrapped C++ library (the common case), `c` for a plain C library that already exposes a C ABI. |
| `params` | [`KernelParam`](./KernelParam.md)[] | no |  |  |  | Ordered list of kernel parameters. Each is a `KernelParam` with a name and a flat value type (scalars, numeric buffers, bytes, or a UTF-8 string). Host objects never cross the boundary — pass minimal serializable inputs. |
| `returns` | `KernelValueType` | yes |  | 11 values, see [KernelValueType](#kernelvaluetype) |  | The value type the kernel produces. For buffer return types (e.g. `f64[]`) the default convention is a caller-allocated output buffer sized from the inputs; the generated host wrapper allocates it and decodes the result. C++ exceptions never cross the boundary — the shim returns a status code and the wrapper turns a non-zero status into a Rust `Result`/JS `throw`/Go `error`. |
| `includes` | `String`[] | no |  |  |  | Headers of the existing native library that the shim `#include`s (e.g. `existing_shipping.hpp`, `opencv2/core.hpp`). |
| `links` | `String`[] | no |  |  |  | Linker names of the existing native library/libraries to link against (e.g. `shipping`, `blas`, `fftw3`). When the library is publicly available, declare its acquisition once on the service via the shared `serviceBasics.packages[]` list using a native manager (`vcpkg`/`conan`/`apt`) — codegen provisions it into the build image — and list its linker name here so the kernel build links it. For a library that is not in any package manager, carry its source via `sources` instead. |
| `sources` | [`KernelSource`](./KernelSource.md)[] | no |  |  |  | Fetchable references to the existing library's own source files when it is NOT available via a package manager (a small or proprietary lib). Because designers interact with the platform through the web and the AI agent — never a local filesystem — source files are never inlined; each `KernelSource` points to a platform bucket key (preferred — user/agent uploads the file or tarball; stays inside the trust boundary), an external download URL, or a git remote. Codegen downloads each into the service's `native/` folder at generation time (verifying `sha256` for url/git origins) and compiles it alongside the shim. |
| `hostBindings` | `KernelHostBinding`[] | no |  | `rust`, `nodejs`, `golang`, `java`, `dotnet`, `python` |  | Which host-language bindings to emit for this kernel. Defaults to the consuming service's language. When both `rust` and `nodejs` are present, the recommended layout makes Rust the sole FFI host and exposes the Rust safe wrapper to Node via napi-rs (one unsafe seam, written once). |
| `async` | `Boolean` | no | `true` |  |  | When true (default), the kernel call is dispatched off the request thread — libuv threadpool via napi `AsyncWorker` on Node, `spawn_blocking` on Rust/Tokio — so long compute never blocks the event loop or async runtime. Set false only for short, bounded kernels; codegen emits a blocking call and a warning. |
| `shimBody` | `Text` | yes |  |  |  | The body of the generated `extern "C"` shim function — the bridge between the C ABI signature (derived from `params`/`returns`) and the existing library. Has access to the parameters by name, plus `n` (element count for buffer params), `out` (the caller-allocated output buffer), and `err`/`err_len` (the error message buffer). Must wrap calls into the existing library in `try/catch` and return 0 on success or a non-zero status on error. This is the only native code authored per kernel — keep it tiny; the existing library's own source is NOT pasted here, it is acquired via `packages` or `sources`. |

## Allowed values

### KernelValueType

`f64`, `f32`, `i64`, `i32`, `bool`, `string`, `bytes`, `f64[]`, `f32[]`, `i64[]`, `i32[]`

## Constraints

Property rules:

- `name`, `returns`, `shimBody` must be present. (`REQUIRED_FIELD_MISSING`)
- `lang`, `returns`, `hostBindings` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `params` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `sources` must have distinct names (`dest`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
