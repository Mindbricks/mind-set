# ComputeSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ComputeSettings in Part 2](../spec/ComputeSettings.md)

Project-level compute-layer configuration (docs/ADR-calculation-layer.md §10). Sizes the single bounded compute pool and queue that the compute-worker controller uses to drain submitted ComputeJobs on any rust/python host service. These are global guard-rails: the framework never spawns unbounded threads/processes, so `maxConcurrentJobs` and `queueDepth` bound inter-job concurrency and backpressure, while `defaultResourceProfile` supplies the per-job ComputeResourceProfile for jobs that don't declare their own. `pythonFreeThreaded` opts a Python host into the free-threaded 3.13+/3.14 interpreter (off by default; §8). `gpuEnabled` is a project-wide flag that allows jobs with `resourceProfile.gpuRequired` to be scheduled.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `computeSettings`

Blueprint paths:

- `projectSettings.computeSettings`

## Contains

- `defaultResourceProfile`: [ComputeResourceProfile](./ComputeResourceProfile.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
