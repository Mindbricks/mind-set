# ComputeJobBasics

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJobBasics in Part 2](../spec/ComputeJobBasics.md)

Defines a compute job's identity, workload type, execution mode and implementation mode. The compute job's scalar identity + lifecycle axes (section): `name`, `type` (the curated workload archetype), `executionMode` (`job` | `serving`), `implementationMode` (the library-vs-generate axis) and `parallel`. Grouped into a section because a chapter is a container of sections, not loose scalar columns.

## Contained in

- [ComputeJob](./ComputeJob.md) as `jobBasics`

Blueprint paths:

- `services.computeJobs.jobBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
