# ComputeResourceProfile

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ComputeResourceProfile in Part 2](../spec/ComputeResourceProfile.md)

The resource envelope of a ComputeJob (docs/ADR-calculation-layer.md §9). Drives the bounded worker pool, the deploy manifest's resource requests, and rejection of impossible jobs. Also used as `projectSettings.computeSettings.defaultResourceProfile` for jobs that don't declare their own.

## Contained in

- [ComputeJob](./ComputeJob.md) as `resourceProfile`
- [ComputeSettings](./ComputeSettings.md) as `defaultResourceProfile`

Blueprint paths:

- `services.computeJobs.resourceProfile`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
