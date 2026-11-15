# ComputeJob

**Level:** `chapter` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJob in Part 2](../spec/ComputeJob.md)

A compute *workload* — the primary, headline tier of the compute layer (docs/ADR-calculation-layer.md §2/§3). A declared `ComputeJob` generates the full async lifecycle (NOT a synchronous endpoint): a submit Business API that enqueues and returns a jobId, a ComputeQueue, a compute-worker controller that drains it on the bounded compute pool, a result + bucket-backed artifacts, progress/completion events on the outbox, and cooperative cancellation + retry. `type` selects one of the eight curated archetype *specs* (carrying the per-type fields), or `custom` for the bring-your-own-code spec (§12); `executionMode` chooses the async `job` lifecycle (default) or a warm synchronous `serving` endpoint (§11); `implementationMode` makes the library-vs-generate decision explicit (§4). Only valid on rust/python host services; other services *submit* to a compute service over M2M (§7).

## Contained in

- [Service](./Service.md) as `computeJobs` (a list)

Blueprint paths:

- `services.computeJobs`

## Contains

- `jobBasics`: [ComputeJobBasics](./ComputeJobBasics.md)
- `spec`: [ComputeJobSpec](./ComputeJobSpec.md)
- `input`: [ComputeJobInput](./ComputeJobInput.md)
- `result`: [ComputeJobResult](./ComputeJobResult.md)
- `graphIO`: [ComputeJobGraphIO](./ComputeJobGraphIO.md)
- `resourceProfile`: [ComputeResourceProfile](./ComputeResourceProfile.md)
- `retryPolicy`: [ComputeRetryPolicy](./ComputeRetryPolicy.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
