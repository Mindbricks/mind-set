# ComputeJobResult

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJobResult in Part 2](../spec/ComputeJobResult.md)

Declares a ComputeJob's result shape (§2). The `summarySchema` is a small status/metrics summary returned in the job record and completion event; large outputs are written as bucket-referenced artifacts in the `artifact` format.

## Contained in

- [ComputeJob](./ComputeJob.md) as `result`

Blueprint paths:

- `services.computeJobs.result`

## Contains

No other pattern: every property is a value or a reference.

## References

- `summarySchema` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
