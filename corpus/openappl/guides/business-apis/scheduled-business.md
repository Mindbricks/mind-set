---
title: Scheduled Business, Cron Jobs and Cron Controllers
---

# Scheduled Business, Cron Jobs and Cron Controllers

Some work runs because the clock says so, not because a client called: a
nightly archive sweep, a reminder digest, a retry of failed provider calls, a
one-off move of rows from an old table into a new one. OpenAPPL has three
ways to schedule work inside a service. This page explains each one, when to
use it, how it behaves when the service runs on several replicas, and how you
observe it.

Which targets implement each scheduling feature depends on the compiler; the
columns below state the contract of a conforming service and the notes name the
points where a target may fall short. See
[the compiler specification](../../compiler/index.md).

| | Cron controller on a Business API | Edge controller cron | Cron job (`Service.cronJobs[]`) |
|---|---|---|---|
| Declared on | `BusinessApi.controllers.cronSettings` | `EdgeController.edgeCronSettings` | `Service.cronJobs[]` |
| Runs | the API's full pipeline (parameters, actions, workflow, events) | an edge function | a service library function |
| Replicas | **one replica per tick** (database claim; `singleReplica`, default true) where the target implements the claim; with `singleReplica: false`, and on a target without the claim, every replica runs every tick | never scheduled (warning `EDGE_CRON_NOT_SCHEDULED`, see below) | **one replica per tick** (database claim) |
| Run record | log lines; with `singleReplica` (the default), also a row per run in `sys_cronJobRun` | - | a row per run in `sys_cronJobRun` |
| Run once | no | - | `runMode: onceEver` / `oncePerStart` |
| Timeout | no (with `singleReplica`, the run row is marked `timed_out` after 3600 s; the API is not stopped) | - | `timeoutSeconds` (default 3600) |
| Manual run | the superAdmin test transport (non-production) | - | `POST /cron-jobs/:name/run` (operators) |
| Time zone | the service's `CRON_TIMEZONE` setting (default UTC) | - | per job, `timezone` (default UTC) |
| Targets | every target language | - | targets that implement cron jobs |

## 1. Cron controller on a Business API

A Business API with `controllers.cronSettings.hasCronController: true` and a
`cronExpression` runs its whole pipeline on the schedule, through a synthetic
request with no session (a trusted system transport). Use it when the
scheduled work is naturally expressed as an API: a set-based
`UpdateCrudAction` sweep, a workflow with events, something you also want to
call over REST or from another service.

```json
"controllers": {
  "restSettings": { "hasRestController": false },
  "cronSettings": { "hasCronController": true, "cronExpression": "0 3 * * *" }
}
```

Things to know:

- **Cron controllers run on one replica per tick by default.**
  `singleReplica` defaults to `true`, so every cron controller that does not
  say `"singleReplica": false` claims its ticks: a service scaled to three
  replicas runs the API once per tick instead of three times, and the service
  gains the `sys_cronJobRun` table. Set `"singleReplica": false` on a cron that
  must run on every replica (a per-replica cache refresh, for example).
- **`singleReplica` (default `true`) runs each tick on one replica.**
  Every replica's scheduler still fires, but before the API runs it inserts a
  claim row into `sys_cronJobRun` with the job name `api:<apiName>` and the tick
  key `tick:<fire time>` (the minute for a 5-field expression; for a seconds
  schedule, the latest second the expression fires at, the current one or the
  one before, so a replica whose scheduler read the clock just after the second
  turned names the same tick). The unique (jobName, tickKey) index lets one insert win; only that
  replica runs the API, and the row records the run (`running` ->
  `succeeded` / `failed`, timings, replica, masked error). It is the same claim
  a cron job uses, so the service gets the `sys_cronJobRun` table even when it
  declares no cron job. A database that cannot be reached skips the tick on
  that replica (`CronJobStoreUnavailable`) rather than running it unclaimed. A
  run-now through the test transport is not claimed. The api crons are not
  cron jobs: `GET /cron-jobs` does not list them.
- **`singleReplica: false` runs every tick on every replica**: a service
  scaled to three replicas runs the API three times
  per tick. Make such work idempotent (WHERE-filtered set updates are) or take
  a lock in the workflow.

  ```json
  "cronSettings": { "hasCronController": true, "cronExpression": "*/10 * * * *", "singleReplica": false }
  ```
- **Targets without the claim** run every tick on every replica whatever the
  setting. An explicit `"singleReplica": true` there is warned about
  (`API_CRON_SINGLE_REPLICA_NOT_PORTED`); the implicit default is not.
- The schedule is evaluated in the service's `CRON_TIMEZONE` setting
  (UTC when unset). There is no per-API time zone.
- A failure is a log line (`ErrorInCronJob`); the next tick fires as usual.

Details: [Cron controllers](cron-jobs.md),
[`ApiCronSettings`](../../spec/ApiCronSettings.md).

## 2. Edge controller cron

An edge controller can declare
`edgeCronSettings` (`cronEnabled`, `cronExpression`). The setting is part of
the model, but **the reference compiler does not schedule it today** (it emits only the
REST and Kafka edge adapters): an edge controller is reached over REST or Kafka
only, and `cronEnabled: true` draws the validation warning
`EDGE_CRON_NOT_SCHEDULED`. Do not rely on it for scheduled work; use a cron
job, which calls a library function the same way an edge controller calls an
edge function, but on a schedule.

## 3. Cron jobs

A cron job calls one function of the service library on a cron schedule. No
Business API, no controller, no parameters: a schedule and a function.

```json
"library": {
  "functions": [
    { "moduleName": "moveLegacyOrders", "moduleBody": { "js": "module.exports = async (ctx) => { /* ... */ };" } }
  ]
},
"cronJobs": [
  {
    "jobBasics": {
      "name": "moveLegacyOrders",
      "description": "One-off: copy legacyOrder rows into order. Remove in v1.4.",
      "libFunction": "moveLegacyOrders",
      "timeoutSeconds": 1800
    },
    "scheduleSettings": {
      "cronExpression": "*/5 * * * *",
      "runMode": "onceEver",
      "runOnStartup": true
    }
  },
  {
    "jobBasics": { "name": "weekdayDigest", "libFunction": "sendWeekdayDigest" },
    "scheduleSettings": { "cronExpression": "0 3 * * 1-5", "timezone": "Europe/Istanbul" }
  }
]
```

A cron job has two sections: `jobBasics` (`name`, `description`, `enabled`,
`libFunction`, `timeoutSeconds`) and `scheduleSettings` (`cronExpression`,
`timezone`, `runMode`, `runOnStartup`). A field written straight on the job is
refused as an unknown property.

| Field | Default | Meaning |
|---|---|---|
| `jobBasics.name` | required | Unique job name in the service. It keys the run history and the admin routes. Renaming a job starts a fresh history, so a renamed `onceEver` job runs again. |
| `jobBasics.description` | - | What it does and, for a one-off job, which version removes it. |
| `jobBasics.enabled` | `true` | `false`: not scheduled, no startup run; an operator can still run it by hand. |
| `scheduleSettings.cronExpression` | required | The same dialect rules as a cron controller: 5 fields, 6 fields (seconds first), 7-field Quartz (the year is dropped), `@hourly`-style aliases. `@reboot` is refused (use `runOnStartup`), and Quartz `L` is refused by targets whose scheduler cannot register it. |
| `scheduleSettings.timezone` | `UTC` | IANA zone the expression is evaluated in. |
| `jobBasics.libFunction` | required | A `library.functions` module name (not an edge function). |
| `scheduleSettings.runMode` | `always` | `always`, `onceEver` or `oncePerStart` (below). |
| `jobBasics.timeoutSeconds` | `3600` | 1 to 86400. |
| `scheduleSettings.runOnStartup` | `false` | Also run once when the service starts: once per start era, about 36 seconds after boot, when the era is decided. |

### The function

The function is called as `await LIB.<libFunction>(ctx)` inside the service
process, with everything library code normally has: `LIB`, `API`, the
data layer, the common helpers. `ctx` is:

| Member | Meaning |
|---|---|
| `jobName`, `runId` | The job and this run (the `sys_cronJobRun` row id). |
| `scheduledAt` | The tick the run belongs to (or the trigger time of a manual run). |
| `lastSuccessAt` | End of the job's last successful run, or `null`. Useful for "everything since the last run". |
| `trigger` | `schedule`, `startup` or `manual`. |
| `runMode`, `eraId`, `forced` | The job's mode, the current start era, and whether an operator forced the run. |
| `signal` | An `AbortSignal` that fires at the timeout. |

The run **succeeds** when the function returns (or its promise resolves) and
**fails** when it throws (or rejects). A failing function is recorded and
logged; it never crashes the service, and the next tick runs as usual.

**No session, no tenant.** The function runs outside any request: there is no
session and, in a multi-tenant project, **no current tenant**. Nothing scopes
its data-layer calls to a tenant for you, so a job that works per tenant must
read the tenant column and filter by it itself, and must set it on every row
it creates.

### Run modes

- **`always`** (default): runs on every tick.
- **`onceEver`**: runs on every tick **until one run succeeds**, then never
  again: not on another replica, not after a restart, not after a redeploy.
  The success is a row in the service database, so it survives everything but
  a database reset or a rename of the job. A failed or timed-out run does not
  count, so the next tick retries.
- **`oncePerStart`**: runs until one run succeeds **in the current start era**,
  then waits for the next era.

**What a start era is.** A start era is one "start" of the service, as
`oncePerStart` and `runOnStartup` count it. A new era opens when:

- the service is deployed with a **new build**;
- the service is **rolled out again with the same build**: a new deployment
  revision, such as a rolling restart or a redeploy of the same image
  (see *Deployment revision* below);
- **every replica stops** and starts again, whether they come back in a
  minute or in a second, under the same hostnames or new ones (a crash of all
  of them, a node loss, a single-replica instance that is rescheduled).

A new era does **not** open when one replica crashes or restarts while another
replica of the same revision is still running: it joins the running era.

How it works: each replica keeps a heartbeat row in a framework table
(every 30 seconds) with its era key (the build plus the deployment revision)
and its era. A booting replica first writes a *pending* row and waits about
**36 seconds** (1.2 heartbeats). Then it decides, looking only at rows of its
own era key whose heartbeat was written **after** it booted, because only a
replica that is alive can write one (the rows a crashed replica leaves behind
look fresh for up to 90 seconds, but prove nothing):

- such a row holds an era: the replica **joins** it;
- none does (a new build or revision, or every replica of it went down): the
  replica **opens** a new era. Replicas that boot together all compute the
  **same** new era (it is named after the one of them that started first), so
  ten replicas that start at once open one era, not ten.

The decision compares heartbeat times written by different replicas, so their
clocks must agree to within a few seconds (NTP does this). A peer clock more
than about 6 seconds behind can make a restarting replica open a new era
although a peer is alive; a dead replica's clock that was ahead by more than
the restart gap can make the restarted replicas keep the old era.

**While it waits, a replica holds no era**: its startup runs and its
`oncePerStart` runs wait (a `oncePerStart` tick in that window is skipped with
`eraPending`; another replica that already holds the era runs it, and a
service that has just started runs it on the next tick). An `always` or
`onceEver` job does not wait.

**During a rolling update** the instances of the old revision keep their era until
they stop, and the instances of the new revision share one new era: a
`oncePerStart` job runs once more, on a new instance; the old instances, whose era
already has its success, do not run it again. `runOnStartup` is once per era
in the same way: when three replicas start together, one of them makes the
startup run, and a later replica of the same era does not.

**Deployment revision.** The service reads the deployment revision from a
revision setting the deployer provides (a rollout identifier such as an
orchestrator's pod-template hash). The identifier changes with every rollout of
the deployment template, including a forced rolling restart, and stays the same
when an instance is only rescheduled or restarted. When no revision is
provided, the build identity alone keys the era: a rolling restart of the same
build then keeps the era, and only a new build or a stop of every replica opens
one. A replica's identity is a configurable replica id, else its hostname. A
replica row that has not beaten for an hour (an instance that never came back)
is deleted. The names of these settings are in
[the compiler specification](../../compiler/index.md).

A **once job never runs twice at the same time.** All runs of a once job,
whatever triggered them (a tick, a startup, an operator, on any replica),
claim the same once key in `sys_cronJobRun` (`once:ever`, or
`once:era:<era>`), which only one row can hold. The success row keeps the key
for good; a failed or timed-out run hands it back. So two operators clicking
"run" on two replicas, or a manual run at the moment of a tick, give one run;
the other answers `inProgress`. A run left `running` by a replica that
crashed holds the key for its timeout window (`timeoutSeconds` plus 60
seconds); the next trigger after that marks it `timed_out` and runs.
A forced run does not take the key, but a once run still waits for it.

If a run succeeds but its result cannot be written (the database is down at
that moment), the replica retries the write, remembers the success, and does
not run the job again; it writes the result as soon as it can. Another
replica only sees the `running` row, so after the timeout window it may run
the job again: one more reason the function must be idempotent.

### Multi-replica behaviour

Every replica schedules every enabled job. At each tick, each replica tries to
insert the run row `(jobName, tickKey)` into `sys_cronJobRun`, where `tickKey`
is the fire time floored to the minute (for a 6-field expression, the
latest second the expression fires at, the current one or the one before, so a
replica whose scheduler read the clock just after the second turned still
names the same tick). That pair is unique in the database, so **exactly one replica's
insert wins and only that replica runs the tick**; the others skip it
silently. No Redis is involved, and no replica is a leader. Replica clocks
must agree to within the tick granularity (NTP does this). A once job claims
its once key instead of the tick (above), which also gives one run per tick.

What the replicas guarantee together:

| Job | Guarantee |
|---|---|
| `always` | at most one run per tick, across all replicas |
| `onceEver` | at most one run at a time; after the first success, none, ever |
| `oncePerStart` | at most one run at a time; after a success, none until the next era |
| `runOnStartup` | one startup run per era, made by the first replica that decides it |

### Timeout

A run that has not settled after `timeoutSeconds` is recorded `timed_out`, and
`ctx.signal` fires. A function that ignores the signal cannot be stopped:
it keeps running in the background. A long job should check
`ctx.signal.aborted` between batches and stop.

The timed-out row no longer counts as in progress, so the next tick (or a
manual run) can start a second copy of the function while the first one is
still running in the background, and a first copy that finishes after its
timeout is not recorded as a success: a once job runs again. Keep the function
idempotent and give it a `timeoutSeconds` that comfortably covers the work.

### Observability

- **Run rows.** `sys_cronJobRun` holds one row per run: status (`running`,
  `succeeded`, `failed`, `timed_out`), trigger, tick, era, replica, scheduled,
  start and end times, duration, who triggered a manual run, whether it was
  forced, and the error, with credentials masked and capped at 2000
  characters. The newest 500 rows per job are kept; a once job's success row is
  always kept. The table is owned by the generated service: no API, never indexed into
  the search index.
- **Admin routes** (platform operator roles only: `superAdmin` / `admin`
  single-tenant, `superAdmin` / `saasAdmin` multi-tenant; a service (M2M)
  caller and a tenant administrator are refused):
  - `GET /cron-jobs`: every job with its schedule, `runMode`, next fire time,
    last run, last success, `succeededEver`, `succeededThisEra`, and the
    current era (`eraId`, `pending` while the replica has not decided it,
    when it opened, the build, the revision, live replicas).
  - `GET /cron-jobs/:name/runs?limit=&offset=`: the job's runs, newest first.
  - `POST /cron-jobs/:name/run`: run it now, on the replica that answers. A
    once job that already succeeded, or is running elsewhere, answers 409
    (503 while the replica has no era yet or the database is down);
    `{ "force": true }` runs it anyway, and is accepted only from a session
    that holds an absolute role (`superAdmin`).
- **Log lines**: `CronJobsScheduled`, `CronJobRunStarted`,
  `CronJobRunSucceeded`, `CronJobRunFailed`, `CronJobRunTimedOut`,
  `CronJobSkipped` (with the reason: `alreadySucceeded`, `inProgress`,
  `eraPending`, `storeUnavailable`), `CronJobOnceLockReleased`,
  `CronJobRecordFailed` / `CronJobRecordRecovered`, `CronEraPending`,
  `CronEraOpened` / `CronEraJoined` / `CronEraConverged`,
  `CronEraHeartbeatFailed`, `CronEraReplicaPruned`. Error texts in log lines
  are credential-masked like the run rows.

### Validation

`CRON_JOB_LIB_FUNCTION_NOT_FOUND`, `CRON_EXPRESSION_INVALID`,
`CRON_EXPRESSION_ALIAS_UNSUPPORTED`, `CRON_JOB_TIMEZONE_INVALID`,
`CRON_JOB_TIMEOUT_INVALID` and `DUPLICATE_ASSET_NAME` are errors.
`CRON_JOB_ONCE_SUBMINUTE` (a once mode on a seconds schedule) and
`CRON_JOB_SUBMINUTE` are warnings. Cron jobs are implemented for some target
languages only: a service whose language is known to be one that does not
implement them is refused with `CRON_JOBS_LANGUAGE_NOT_PORTED`, because its
jobs would otherwise validate and never run.

## When to use which

- The work is **plain code** (a loop, a call to a provider, a data move):
  a **cron job**.
- The work must run **once per tick across replicas**, or **once ever**, or
  needs a **run history** and a **manual trigger**: a **cron job**.
- The work is an **API-shaped business operation** (parameters, actions,
  workflow, events) or must also be reachable over REST, and running on every
  replica is fine: a **cron controller** on that Business API.
- The service's target does **not implement cron jobs**: a cron controller.

## Recipe: an urgent data migration with a run-once cron job

Say version 1.3 replaces table `legacyOrder` with `order`, and the existing
rows must move.

1. **Back up the database.** Nothing below can be undone by the compiler.
2. **Write the library function** that moves the rows. Make it
   **idempotent**: skip a row that was already moved (for example by storing
   the legacy id on the new row and checking it first), so a retry after a
   failure or a timeout never duplicates data. Work in batches and stop when
   `ctx.signal.aborted` is true.

   ```js
   const { getLegacyOrderListByQuery, getOrderByQuery, createOrder } = require('dbLayer');
   module.exports = async function moveLegacyOrders(ctx) {
     const rows = await getLegacyOrderListByQuery({});
     let moved = 0;
     for (const row of rows) {
       if (ctx.signal.aborted) throw new Error(`stopped after ${moved} rows`);
       if (await getOrderByQuery({ legacyId: row.id })) continue;
       await createOrder({ legacyId: row.id, amount: row.amount });
       moved += 1;
     }
     return { moved };
   };
   ```

   The function body is written in the flavour of the target language; the
   example is for a JavaScript target.

3. **Add a cron job** with `runMode: "onceEver"` (and `runOnStartup: true` to
   start right after the deploy), a retry cadence such as `*/5 * * * *`, and a
   `timeoutSeconds` that fits the data.
4. **Deploy and verify.** `GET /cron-jobs` shows `succeededEver: true` once it
   is done; `GET /cron-jobs/moveLegacyOrders/runs` shows every attempt and its
   error. Check the data itself (counts, totals) before going on. If the data
   needs another pass, fix the function and run it again with
   `POST /cron-jobs/moveLegacyOrders/run` and `{ "force": true }`.
5. **In the next version**, remove the cron job and the library function, then
   drop the old table.

The caveats, plainly:

- **This is not a substitute for real migrations.** It does not version the
  schema, it has no down step and no rollback, and it runs while the service
  is serving traffic. For schema changes, large or high-risk data changes, use
  a proper migration process.
- **It is not transactional across tables.** A run that fails or times out
  halfway leaves part of the data moved. That is why the function must be
  idempotent: the next run picks up where the last one stopped.
- **Back up first.**
- `onceEver` is tied to the job name and the run table: a renamed job, or a
  reset database, runs it again.

## See also

- [Cron controllers](cron-jobs.md), [`EdgeController`](../../spec/EdgeController.md),
  [`ServiceLibrary`](../../spec/ServiceLibrary.md)
- Schema: [`CronJob`](../../spec/CronJob.md),
  [`ApiCronSettings`](../../spec/ApiCronSettings.md),
  [`EdgeCronSettings`](../../spec/EdgeCronSettings.md)
