# Calculation

**Level:** `section` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [Calculation in Part 1](../ontology/Calculation.md)

**Name:** an instance is named by `name`.

A compute *primitive* — the Tier-1 substrate of the compute layer (docs/ADR-calculation-layer.md §1/§5). A `Calculation` is a single curated math operation over a famous crate/package (FFT a buffer, k-means an array, group-by a dataframe), exposed on the service's library and called from MScript like a function: `LIB.<name>(this.signal)`. It answers within the call — synchronously inline or off-thread — and is meant for small/bounded math that belongs inside a request. Heavy or long-running work is a `ComputeJob` instead. Only valid on rust/python host services (the calculation languages). The `category` selects the algorithm taxonomy bucket whose crate/package set is wired into the build manifest; the `recipe` names a framework-shipped curated consumer (§6), or a `body` supplies author MScript when no recipe fits.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The calculation name. Unique within the service library; referenced from MScript as `LIB.<name>(...)`. Use camelCase (e.g. `fftMagnitude`, `kMeansFit`). |
| `category` | `CalculationCategory` | yes |  | 10 values, see [CalculationCategory](#calculationcategory) |  | The algorithm-taxonomy bucket this calculation belongs to (CalculationCategory). Drives the default crate/package dependency set wired into Cargo.toml / pyproject.toml (§5). |
| `recipe` | `String` | no |  |  |  | Optional name of a framework-shipped curated consumer (a tested adapter wrapping a famous crate/package behind a stable contract — §6), e.g. `polars.groupByAggregate` or `ndarray.fft`. When omitted, supply `body` instead. |
| `params` | [`KernelParam`](./KernelParam.md)[] | no |  |  |  | Ordered list of typed input parameters. Each is a `KernelParam` (flat value types — scalars, numeric buffers, bytes, UTF-8 string) so the call boundary stays coarse-grained and host-object-free (§10), reusing the NativeKernel param shape. |
| `returns` | `KernelValueType` | yes |  | 11 values, see [KernelValueType](#kernelvaluetype) |  | The value type the calculation produces (a `KernelValueType` flat value type, e.g. `f64[]`). |
| `execution` | [`CalculationExecution`](./CalculationExecution.md) | no |  |  |  | How the calculation is executed: inline vs off-thread offload, single vs data-parallel, thread budget, and target device (CalculationExecution). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `body` | `Text` | no |  |  |  | Optional author-supplied MScript implementing the calculation when no shipped `recipe` fits. Compiled to native rust/python by the language target. |

## Allowed values

### CalculationCategory

`linear-algebra`, `statistics`, `signal-processing`, `image-vision`, `ml-classical`, `ml-deep`, `dataframe-analytics`, `optimization-solvers`, `geometry-graph`, `simulation-montecarlo`

### KernelValueType

`f64`, `f32`, `i64`, `i32`, `bool`, `string`, `bytes`, `f64[]`, `f32[]`, `i64[]`, `i32[]`

## Constraints

Property rules:

- `name`, `category`, `returns` must be present. (`REQUIRED_FIELD_MISSING`)
- `category`, `returns` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `params` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
