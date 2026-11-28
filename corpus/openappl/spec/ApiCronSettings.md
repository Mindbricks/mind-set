# ApiCronSettings

**Level:** `section` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [ApiCronSettings in Part 1](../ontology/ApiCronSettings.md)

**Activation:** the pattern is switched on by `hasCronController`.

Schedules the Business API for periodic execution using a cron expression. Ideal for background jobs or recurring tasks. Fields are flat — set `cronExpression` directly (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasCronController` | `Boolean` | no | `false` |  |  | Enables or disables the cron controller. If true, the API will run at the interval defined by `cronExpression`, on ONE replica per tick (`singleReplica`, default true, nodejs) or on every replica when `singleReplica` is false. |
| `cronExpression` | `String` | no | `"0 * * * *"` |  |  | Cron expression defining the schedule (e.g., '0 * * * *' for hourly execution). NodeJS schedules reject Quartz last-day (L) tokens in day-of-month or day-of-week fields because node-cron cannot register them. Java and dotnet keep their native Quartz support. |
| `singleReplica` | `Boolean` | no | `true` |  |  | Default true: each scheduled tick runs on ONE replica of the service instead of on every replica. Every replica's scheduler still fires the tick, but before running the API it inserts a claim row into the service's `sys_cronJobRun` table (job name `api:<apiName>`, tick key `tick:<fire time>`: the minute for a 5-field expression, and for a seconds schedule the latest second the expression fires at, the current one or the one before, so a replica whose scheduler read the clock just after the second turned names the same tick); the unique (jobName, tickKey) index lets exactly one insert win, and only that replica runs the API. The row then records the run (status, timings, replica, masked error), and a failed run is recorded as failed. A database that cannot be reached skips the tick on that replica (logged as CronJobStoreUnavailable) instead of running it unclaimed. An out-of-band run (the test transport's run-now) is not claimed. Set it to false only for work that must run on every replica (a per-replica cache refresh): every replica then runs every tick, the behaviour before patterns 1.87.0. NodeJS, rust and python only (rust and python on a relational service); other languages, and rust / python on mongodb, run every tick on every replica whatever the setting, and an explicit `singleReplica: true` there is warned about (API_CRON_SINGLE_REPLICA_NOT_PORTED, API_CRON_SINGLE_REPLICA_MONGODB). |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CRON_EXPRESSION_ALIAS_UNSUPPORTED` | error | cronExpression "@reboot" is not supported: it names a boot-time trigger, and cron only expresses RECURRING schedules — no runtime lane has a boot event to hang it on, so the job would validate here and then never fire. |
| `CRON_EXPRESSION_INVALID` | error | cronExpression "…" is not a valid 5-, 6- or 7-field cron expression (or @-alias). |
| `CRON_EXPRESSION_YEAR_DROPPED` | warning | cronExpression "…" pins a year ("…"), but the year field is dropped when the schedule is emitted (node-cron has no year slot), so the job will ALSO run outside …. |
