# CronJobBasics

**Level:** `section` · **Family:** [CronJob](../ontology/families.md#cronjob) (domain `Service`)

**Ontology:** [CronJobBasics in Part 1](../ontology/CronJobBasics.md)

The identity section of a CronJob (`jobBasics`): name, description, enabled flag, the `library.functions` module it calls and the timeout of one run. The name keys the run rows and the admin routes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique job name within the service (camelCase code name). It keys the run rows in `sys_cronJobRun`, the log lines and the admin routes (`/cron-jobs/<name>`). Renaming a job starts a fresh run history, so a renamed `onceEver` job runs again. |
| `description` | `String` | no |  |  |  | What the job does and why it exists (for an urgent one-off job: which version may remove it). |
| `enabled` | `Boolean` | no | `true` |  |  | When false the job is not scheduled and does not run on startup; its run history stays readable and an admin can still trigger it manually with `POST /cron-jobs/<name>/run`. Default true. |
| `libFunction` | `String` | yes |  |  |  | The `moduleName` of a function in this service's `library.functions` (not `edgeFunctions`). It is called with one argument, the run context. It may be async; the run succeeds when it returns (or its promise resolves) and fails when it throws (or rejects). A name that is not in the library is an error (CRON_JOB_LIB_FUNCTION_NOT_FOUND). |
| `timeoutSeconds` | `Integer` | no | `3600` |  |  | Wall-clock limit of one run, in seconds (1 to 86400). Default 3600. At the limit the run is recorded `timed_out` and the context's `signal` is aborted; JavaScript cannot stop a function that ignores the signal, so a long job should check `ctx.signal.aborted` between batches. A once-mode job does not start a new run while an earlier run is still inside its timeout window. |

## Constraints

Property rules:

- `name`, `libFunction` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
