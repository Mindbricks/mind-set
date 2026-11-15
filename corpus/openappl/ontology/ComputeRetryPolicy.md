# ComputeRetryPolicy

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeRetryPolicy in Part 2](../spec/ComputeRetryPolicy.md)

Retry policy for a ComputeJob in `job` mode (docs/ADR-calculation-layer.md §9). Governs how many times the worker re-attempts a failed job, the backoff between attempts, and whether exhausted jobs are routed to a dead-letter sink. Not applicable in `serving` mode (the caller owns retries).

## Contained in

- [ComputeJob](./ComputeJob.md) as `retryPolicy`

Blueprint paths:

- `services.computeJobs.retryPolicy`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
