# CronJobScheduleSettings

**Level:** `section` · **Family:** [CronJob](./families.md#cronjob) (domain `Service`)

**Specification:** [CronJobScheduleSettings in Part 2](../spec/CronJobScheduleSettings.md)

The schedule section of a CronJob (`scheduleSettings`): cron expression, time zone, run mode and the startup run. `runMode` is `always`, `onceEver` or `oncePerStart`.

## Contained in

- [CronJob](./CronJob.md) as `scheduleSettings`

Blueprint paths:

- `services.cronJobs.scheduleSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
