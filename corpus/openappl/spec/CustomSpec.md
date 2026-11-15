# CustomSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [CustomSpec in Part 1](../ontology/CustomSpec.md)

Type-specific spec for `custom` ComputeJobs — the bring-your-own-code escape hatch (docs/ADR-calculation-layer.md §12). The designer (or an AI agent acting as one) supplies their OWN Rust/Python calculation — inline in `body`, or uploaded as a source module fetched at codegen/build time — and the compiler generates the full lifecycle scaffolding around the opaque user function (submit → queue → worker → invoke `entrypoint(inputs)` on the bounded pool → result/artifact → event → cancel/retry). `implementationMode` is `generatedNative`, but here "generated" means the WRAPPER, not the math — the developer owns the calculation. The generated wrapper panic/crash-guards the user code (Rust `catch_unwind`; Python process-pool execution) so a fault fails the job, not the service — but this is NOT a sandbox: custom code runs with service privileges and untrusted/third-party code must be gated by the project (§12). This subsumes the `Calculation` primitive's free-form `body` for the cross-request (job) case.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `language` | `ServiceLanguage` | no |  | `nodejs`, `python`, `java`, `dotnet`, `golang`, `rust` |  | Host language of the supplied code: must be `rust` or `python` (ServiceLanguage), and must match the host service — the §7 host guard applies (a `custom` job on a non-rust/python host is a codegen error). |
| `computeSourceType` | `String` | no |  |  |  | Where the code comes from: `inline` (code in `body`) \| `bucket` \| `url` \| `git`. For `bucket\|url\|git` the module is fetched at codegen/build time via `source` (a KernelSource, reusing the upload-origin concept — but NOT the kernel FFI machinery: this is native rust/python source, no shim/isolation). Kept as String in v1. |
| `source` | [`KernelSource`](./KernelSource.md) | no |  |  |  | Fetchable reference to the uploaded source module when `computeSourceType` is `bucket\|url\|git` (a `KernelSource` — origin/ref/dest/sha256/extract). Reuses the existing KernelSource origin shape (the upload-via-bucket-preferred / url / git pattern), so the upload tooling and supply-chain pinning (sha256 for url/git) are shared. Null when `computeSourceType` is `inline` (code lives in `body` instead). Only the bucket/url/git origins apply here; inline source uses `body`, not `source.origin:inline`. |
| `body` | `Text` | no |  |  |  | Inline author-supplied native source (Rust/Python) when `computeSourceType` is `inline`. The function named by `entrypoint` is invoked by the generated worker on the bounded pool. Null when the code is fetched via `source`. |
| `entrypoint` | `String` | no |  |  |  | Name of the function the generated worker calls with the marshaled inputs (e.g. `run`, `compute`). Must exist in `body` or the fetched module. |
| `dependencies` | `String`[] | no |  |  |  | Extra crates / pip packages the user's code needs, wired into the generated `Cargo.toml` / `pyproject.toml`. Each entry is a package spec string (e.g. `ndarray`, `numpy>=1.26`). Kept as String entries in v1. |
| `params` | [`KernelParam`](./KernelParam.md)[] | no |  |  |  | Ordered list of typed input parameters crossing the job boundary. Each is a `KernelParam` (flat value types — scalars, numeric buffers, bytes, UTF-8 string), keeping the marshaled boundary coarse-grained and host-object-free (§10), exactly as `Calculation.params` does. |
| `returns` | `String` | no |  |  |  | The value type `entrypoint` produces (a KernelValueType flat value type, e.g. `f64[]`). Kept as String in v1 to allow workload-dependent return shapes beyond the flat enum. |

## Constraints

Property rules:

- `language` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `params` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
