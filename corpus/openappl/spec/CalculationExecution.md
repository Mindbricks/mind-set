# CalculationExecution

**Level:** `subsection` · **Family:** [ServiceLibrary](../ontology/families.md#servicelibrary) (domain `Service`)

**Ontology:** [CalculationExecution in Part 1](../ontology/CalculationExecution.md)

Execution policy for a `Calculation` primitive (docs/ADR-calculation-layer.md §1/§8). Governs whether the call runs inline on the request thread or is offloaded, whether its internal work is single-threaded or data-parallel, an optional thread budget, and the target compute device.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `offload` | `ComputeOffload` | no | `"inline"` | `inline`, `offthread`, `background-job` |  | Where the call runs: `inline` (on the calling thread — only for cheap, bounded math), `offthread` (dispatched off the request thread via the worker pool — rayon spawn_blocking / thread strategy), or `background-job` (escalate to the async job lifecycle). See ComputeOffload. Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `parallel` | `ComputeParallel` | no | `"single"` | `single`, `data-parallel` |  | Intra-call parallelism: `single` (one thread) or `data-parallel` (work-stealing map/reduce across cores). See ComputeParallel. |
| `maxThreads` | `Integer` | no |  |  |  | Optional upper bound on threads this calculation may use when data-parallel. Bounded by the service's compute pool; unset = pool default. Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `device` | `ComputeDevice` | no | `"cpu"` | `cpu`, `gpu` |  | Target compute device: `cpu` (default) or `gpu`. See ComputeDevice. In v1 `gpu` is a scheduling hint only. |

## Constraints

Property rules:

- `offload`, `parallel`, `device` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
