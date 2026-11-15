# ComputeSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ComputeSettings in Part 1](../ontology/ComputeSettings.md)

Project-level compute-layer configuration (docs/ADR-calculation-layer.md §10). Sizes the single bounded compute pool and queue that the compute-worker controller uses to drain submitted ComputeJobs on any rust/python host service. These are global guard-rails: the framework never spawns unbounded threads/processes, so `maxConcurrentJobs` and `queueDepth` bound inter-job concurrency and backpressure, while `defaultResourceProfile` supplies the per-job ComputeResourceProfile for jobs that don't declare their own. `pythonFreeThreaded` opts a Python host into the free-threaded 3.13+/3.14 interpreter (off by default; §8). `gpuEnabled` is a project-wide flag that allows jobs with `resourceProfile.gpuRequired` to be scheduled.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `maxConcurrentJobs` | `Integer` | no |  |  |  | Upper bound on the number of ComputeJobs a host service runs concurrently across its worker pool. Bounds inter-job concurrency (§8); the framework never exceeds it. |
| `queueDepth` | `Integer` | no |  |  |  | Maximum number of submitted-but-not-yet-running jobs the ComputeQueue holds before applying backpressure (rejecting new submits). Sizes the DB-polled / Kafka-backed queue depth (§2, §10). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |
| `defaultResourceProfile` | [`ComputeResourceProfile`](./ComputeResourceProfile.md) | no |  |  |  | The default ComputeResourceProfile applied to a ComputeJob that does not declare its own `resourceProfile`. Drives the worker pool sizing and the deploy manifest's resource requests (§9). |
| `pythonFreeThreaded` | `Boolean` | no | `false` |  |  | When true, Python compute hosts are generated against the free-threaded (no-GIL) 3.13+/3.14 interpreter as an opt-in (§8). Off by default — the GIL trade-off is documented in generated code regardless. |
| `gpuEnabled` | `Boolean` | no | `false` |  |  | Project-wide switch that permits scheduling of ComputeJobs whose `resourceProfile.gpuRequired` is true. In v1 this is a scheduling flag only (GPU pooling/lifecycle is deferred). Node.js does not execute this setting: local Calculation and ComputeJob declarations are refused by the Rust/Python-only compute-host gate (ADR-calculation-layer section 7). Node.js services can submit work to a supported host over InterService M2M. The declaration alone does not establish implementation on another host. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
