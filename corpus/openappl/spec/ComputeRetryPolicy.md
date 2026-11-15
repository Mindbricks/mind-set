# ComputeRetryPolicy

**Level:** `section` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [ComputeRetryPolicy in Part 1](../ontology/ComputeRetryPolicy.md)

Retry policy for a ComputeJob in `job` mode (docs/ADR-calculation-layer.md §9). Governs how many times the worker re-attempts a failed job, the backoff between attempts, and whether exhausted jobs are routed to a dead-letter sink. Not applicable in `serving` mode (the caller owns retries).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `maxAttempts` | `Integer` | no |  |  |  | Maximum number of attempts before the job is considered failed (1 = no retry). |
| `backoff` | `String` | no |  |  |  | Backoff strategy between attempts (e.g. `fixed`, `linear`, `exponential`). Kept as String in v1. |
| `deadLetter` | `Boolean` | no | `false` |  |  | When true, a job that exhausts its attempts is routed to the dead-letter sink for later inspection instead of being dropped. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
