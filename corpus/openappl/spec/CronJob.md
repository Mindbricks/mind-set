# CronJob

**Level:** `chapter` · **Family:** [CronJob](../ontology/families.md#cronjob) (domain `Service`)

**Ontology:** [CronJob in Part 1](../ontology/CronJob.md)

**Name:** an instance is named by `jobBasics.name`.

A scheduled job of the service: a cron expression that calls one service library function directly (no Business API, no cron controller). The function is `library.functions[].moduleName` and is called as `await LIB.<libFunction>(ctx)` in the service process, with the usual library access (`LIB`, `API`, the db-layer, `common`). `ctx` is `{ jobName, runId, scheduledAt, lastSuccessAt, trigger, runMode, eraId, forced, signal }`: `trigger` is `schedule`, `startup` or `manual`, `signal` is an AbortSignal that fires at the timeout. MULTI-REPLICA: every tick is claimed by inserting a row into `sys_cronJobRun` with a unique (jobName, tickKey); only the replica whose insert wins runs the tick, the others skip it silently. Every run row records status (`running`, `succeeded`, `failed`, `timed_out`), start, end, duration, trigger, replica and the error (credential-masked, at most 2000 characters). A function that throws records `failed` and never crashes the service. RUN MODES: `always` runs every tick; `onceEver` stops for good after the first successful run (stored in the database, so it holds across replicas, restarts and redeploys; a failed run does not count); `oncePerStart` succeeds once per start era (a new build, or a restart of every replica, opens a new era; one replica restarting while others stay alive does not). The data-migration recipe is: write the library function (idempotent), add an `onceEver` job, verify the data, then remove the job and drop the old table in the next version. This is a pragmatic tool for urgent work, NOT a schema-migration system: it is not transactional across tables and it does not version or roll back anything, so back up first. Admins read the jobs and runs and trigger a run at `GET /cron-jobs`, `GET /cron-jobs/:name/runs` and `POST /cron-jobs/:name/run`. Shape: `{ jobBasics: { name, description, enabled, libFunction, timeoutSeconds }, scheduleSettings: { cronExpression, timezone, runMode, runOnStartup } }`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `jobBasics` | [`CronJobBasics`](./CronJobBasics.md) | yes |  |  |  | What the job is and what it calls (CronJobBasics): its name, description, enabled flag, library function and timeout. |
| `scheduleSettings` | [`CronJobScheduleSettings`](./CronJobScheduleSettings.md) | yes |  |  |  | When and how often the job runs (CronJobScheduleSettings): the cron expression, its time zone, the run mode and the startup run. |

## Constraints

Property rules:

- `jobBasics`, `scheduleSettings` must be present. (`REQUIRED_FIELD_MISSING`)
