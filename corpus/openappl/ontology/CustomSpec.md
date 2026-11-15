# CustomSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [CustomSpec in Part 2](../spec/CustomSpec.md)

Type-specific spec for `custom` ComputeJobs — the bring-your-own-code escape hatch (docs/ADR-calculation-layer.md §12). The designer (or an AI agent acting as one) supplies their OWN Rust/Python calculation — inline in `body`, or uploaded as a source module fetched at codegen/build time — and the compiler generates the full lifecycle scaffolding around the opaque user function (submit → queue → worker → invoke `entrypoint(inputs)` on the bounded pool → result/artifact → event → cancel/retry). `implementationMode` is `generatedNative`, but here "generated" means the WRAPPER, not the math — the developer owns the calculation. The generated wrapper panic/crash-guards the user code (Rust `catch_unwind`; Python process-pool execution) so a fault fails the job, not the service — but this is NOT a sandbox: custom code runs with service privileges and untrusted/third-party code must be gated by the project (§12). This subsumes the `Calculation` primitive's free-form `body` for the cross-request (job) case.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `custom`

## Contains

- `source`: [KernelSource](./KernelSource.md)
- `params`: [KernelParam](./KernelParam.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
