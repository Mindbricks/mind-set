# CronJobScheduleSettings

**Level:** `section` · **Family:** [CronJob](../ontology/families.md#cronjob) (domain `Service`)

**Ontology:** [CronJobScheduleSettings in Part 1](../ontology/CronJobScheduleSettings.md)

The schedule section of a CronJob (`scheduleSettings`): cron expression, time zone, run mode and the startup run. `runMode` is `always`, `onceEver` or `oncePerStart`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cronExpression` | `String` | yes |  |  |  | When the job fires. The same dialect rules as a Business API cron controller apply: 5 fields (minute-first), 6 fields (seconds-first), a 7-field Quartz expression (its year field is dropped, CRON_EXPRESSION_YEAR_DROPPED) or an alias such as `@hourly` / `@daily` (`@reboot` is refused: use `runOnStartup`). On nodejs the Quartz `L` (last day) token is refused because node-cron cannot schedule it. Sub-minute (seconds) schedules write one run row per tick and are warned about (CRON_JOB_SUBMINUTE, CRON_JOB_ONCE_SUBMINUTE). |
| `timezone` | `String` | no | `"UTC"` |  |  | IANA time zone the cron expression is evaluated in, e.g. `Europe/Istanbul`. Default `UTC`. An unknown zone is an error (CRON_JOB_TIMEZONE_INVALID). |
| `runMode` | `CronJobRunMode` | no | `"always"` | `always`, `onceEver`, `oncePerStart` |  | `always` (default) runs on every tick. `onceEver` runs until one run succeeds, then never again on any replica, across restarts and redeploys (a failed or timed-out run does not count, so the next tick retries). `oncePerStart` runs until one run succeeds in the current start era of the service, then waits for the next era; a new era begins with a new build, a new deployment revision of the same build (a rollout such as `kubectl rollout restart`, read from CRON_ERA_REVISION or POD_TEMPLATE_HASH), or when every replica has stopped, while one replica restarting next to a live replica of its revision stays in the era. A once job never runs twice at the same time: every trigger claims one once key. An admin with an absolute role can bypass the once rule with `force`. |
| `runOnStartup` | `Boolean` | no | `false` |  |  | Also run the job once when the service starts, in addition to its schedule: once per start era across all replicas, about 36 seconds after boot when the replica has decided its era (one replica restarting while others of its revision stay alive does not run it again). Respects `runMode` and `enabled`. Default false. |

## Constraints

Property rules:

- `cronExpression` must be present. (`REQUIRED_FIELD_MISSING`)
- `runMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
