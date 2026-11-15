# ComputeResourceProfile

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ComputeResourceProfile in Part 1](../ontology/ComputeResourceProfile.md)

The resource envelope of a ComputeJob (docs/ADR-calculation-layer.md §9). Drives the bounded worker pool, the deploy manifest's resource requests, and rejection of impossible jobs. Also used as `projectSettings.computeSettings.defaultResourceProfile` for jobs that don't declare their own.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cpuCores` | `Integer` | no |  |  |  | Number of CPU cores the job may use. Bounds the rayon pool / thread budget. |
| `memoryLimit` | `String` | no |  |  |  | Memory ceiling for the job, as a quantity string (e.g. `8Gi`, `512Mi`). Surfaced as the deploy manifest's memory request/limit. |
| `timeout` | `String` | no |  |  |  | Wall-clock timeout for the job, as a duration string (e.g. `30m`, `2h`). The worker cancels the job when exceeded. |
| `concurrency` | `Integer` | no |  |  |  | How many instances of this job may run concurrently on a host, within the project-level maxConcurrentJobs bound. |
| `preferredLanguage` | `ServiceLanguage` | no |  | `nodejs`, `python`, `java`, `dotnet`, `golang`, `rust` |  | Preferred host language for this job (ServiceLanguage) — must be `rust` or `python`. Informs scheduling/marshaling; the actual host service's language is authoritative. |
| `gpuRequired` | `Boolean` | no | `false` |  |  | When true, the job must be scheduled on a GPU-capable host (requires projectSettings.computeSettings.gpuEnabled). In v1 a scheduling flag only. |

## Constraints

Property rules:

- `preferredLanguage` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
