# ComputeJobInput

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJobInput in Part 2](../spec/ComputeJobInput.md)

Declares a ComputeJob's input source. Large inputs cross the submit boundary as bucket references (`type: bucketRef`), never inline blobs (§10). `schema` names the DataObject the input conforms to.

## Contained in

- [ComputeJob](./ComputeJob.md) as `input`

Blueprint paths:

- `services.computeJobs.input`

## Contains

No other pattern: every property is a value or a reference.

## References

- `schema` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
