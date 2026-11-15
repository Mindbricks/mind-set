---
title: Cron controllers
---

# Cron controllers

A cron business API runs its workflow on a schedule instead of in
response to an HTTP request.

> To run a plain library function on a schedule, once per tick across
> replicas or only once ever, use a service **cron job**
> (`Service.cronJobs[]`) instead. [Scheduled business](scheduled-business.md)
> compares the options.

Set `controllers.cronSettings.hasCronController: true` plus a
`cronExpression` and the compiler emits a scheduled job that runs the
API's full pipeline at every tick.

## Declaring a cron API

```json
{
  "basics": {
    "apiOptions":  { "name": "runOrderArchive", "crudType": "create", "dataObjectName": "archiveRun" },
    "authOptions": { "loginRequired": true }
  },
  "controllers": {
    "restSettings": { "hasRestController": false },
    "cronSettings": { "hasCronController": true, "cronExpression": "0 3 * * *" }
  },
  "query": {
    "dataClauseItems": [
      { "name": "startedAt", "value": { "js": "new Date()" } }
    ]
  },
  "actions": {
    "updateCrudActions": [
      {
        "name":                "archiveExpired",
        "childObject":         "order",
        "whereClause":         { "js": "({ status: 'expired', archivedAt: null })" },
        "dataClause": [
          { "dataProperty": "status",     "dataValue": { "js": "'archived'" } },
          { "dataProperty": "archivedAt", "dataValue": { "js": "new Date()" } }
        ],
        "contextPropertyName": "archivedOrders"
      },
      {
        "name":        "recordCount",
        "childObject": "archiveRun",
        "whereClause": { "js": "({ id: this.archiveRun.id })" },
        "dataClause": [
          { "dataProperty": "archivedCount", "dataValue": { "js": "this.archivedOrders.length" } }
        ]
      }
    ],
    "publishEventActions": [
      {
        "name":    "fireDone",
        "topic":   "orders.archive.completed",
        "message": { "js": "({ runId: this.archiveRun.id, archived: this.archivedOrders.length })" }
      }
    ]
  },
  "workflow": {
    "create": { "afterMainCreateOperation": ["archiveExpired", "recordCount", "fireDone"] }
  }
}
```

Each tick inserts one `archiveRun` row (a small object with `startedAt`
and an `archivedCount` that defaults to 0), archives every matching
order with one set-based `UpdateCrudAction`, writes the count onto the
run row and announces it. The REST controller is turned off, so the
schedule is the only way in.

[`ApiCronSettings`](../../spec/ApiCronSettings.md) has these
fields:

| Field | Default | Meaning |
|---|---|---|
| `hasCronController` | `false` | Register a scheduled job for this API. |
| `cronExpression` | `0 * * * *` | Cron expression (see below). |
| `singleReplica` | `true` | Each tick runs on ONE replica of the service instead of every replica, where the target implements the claim. See [Scheduled business](scheduled-business.md) and "Idempotency and concurrency" below. |

## The cron expression

Standard five-field cron grammar: `minute hour day-of-month month
day-of-week`. The dialect checked by validation also accepts six fields
(seconds first), a seven-field Quartz expression (its year field is dropped,
`CRON_EXPRESSION_YEAR_DROPPED` warns) and `@hourly`-style aliases; `@reboot` is
refused (`CRON_EXPRESSION_ALIAS_UNSUPPORTED`), and an invalid expression is
`CRON_EXPRESSION_INVALID`.

| Expression | Schedule |
|---|---|
| `* * * * *` | Every minute. |
| `*/5 * * * *` | Every 5 minutes. |
| `0 * * * *` | Top of every hour. |
| `0 3 * * *` | 03:00 daily. |
| `0 9 * * 1-5` | 09:00 weekdays. |
| `0 0 1 * *` | First day of every month at 00:00. |

The expression is handed to a scheduler provided by the host process; the
scheduling library is the generated service's choice. The scheduler evaluates
every expression in the service's `CRON_TIMEZONE` setting (UTC when unset); set
it on the service to control wall-clock semantics. Targets whose scheduler
cannot register Quartz last-day (`L`) tokens refuse them. There is no per-API
time zone field.

## The workflow

A cron API has no client, no HTTP request, and no caller-supplied
parameters. The generated controller creates a synthetic
request with an empty body, no session, and no `requestId`, then runs the same
API pipeline as a REST call.

What that means in the workflow:

- The API runs as the system, not a user: there is no caller session.
  A cron tick is a trusted system transport, so the login, role,
  ownership and permission gates do not apply to it and
  `authOptions.loginRequired` can stay `true` (it still guards any
  REST route the API keeps).
- No request parameter carries a value on a scheduled tick. Seed what
  the workflow needs with `addToContextActions` or
  `readFromRedisActions` (they land on `this.<name>`).
- The crudType still chooses the pipeline shape - a `list` cron API
  walks the same WHERE / fetch / paging flow as the REST version; an
  `update` cron API resolves ONE record through its where clause and
  writes only that row, even with a
  `fullWhereClause` that matches many. A sweep over a set of rows
  belongs in an `UpdateCrudAction` / `DeleteCrudAction`, as in the
  example above.
- The standard milestones are populated. Use
  `afterStartBusinessApi` as the earliest hook to seed parameters
  before anything else runs.
- A cron run is a trusted system transport: a `create` / `update` cron
  API on an object with
  [`objectModeration`](../capabilities/object-moderation.md) writes straight
  through without a verdict, and on an `onPlace` object its reads see
  every row, unapproved ones included. Keep cron writes off moderated
  content, or route user content through the object's own apis.

For deeper context, see [Workflow
context](../workflow/workflow-context.md).

## Idempotency and concurrency

The generated service schedules the API once, in EVERY replica of the
service. Where the target implements the claim, each tick is then
claimed in the service's `sys_cronJobRun` table (`cronSettings.singleReplica`,
default `true`), the same claim a service cron job
uses, so one replica runs it and the row records the run; see
[Scheduled business](scheduled-business.md). With
`"singleReplica": false`, and on a target without the claim, a service scaled to
three replicas runs the API three times per tick. The actual run policy on
overlap depends on the scheduler implementation of the host process;
the compiler does not serialise ticks. Treat the default as "the scheduler may fire a new
tick before the previous one has finished" and design accordingly:

- For idempotent work (set-based updates with WHERE filters, archive
  sweeps), overlap is fine - both runs target the same WHERE; the
  second sees a smaller working set.
- For non-idempotent work (sending notifications, creating one-shot
  records), keep `singleReplica` at its default (`true`) so only one
  replica runs each tick. If a run can outlast its interval (two ticks overlapping on
  the replicas that won them), or on a target without the claim, also
  use a Redis-based lock. Acquire it in an early action
  (e.g. `writeToRedisActions` at `afterStartBusinessApi` with a TTL)
  and gate the rest of the workflow on the acquisition. Release in
  the `afterSendResponse` milestone.

## Error handling

If any action in a cron run throws, the cron controller logs an
`ErrorInCronJob` entry via the structured logger and continues -
neither the process nor the scheduled job is killed. The next tick
fires on schedule.

`onActionError: "throwError"` (the default) aborts the workflow on
failure. To keep going and write the error to the context, set
`completeApi` on the action and inspect `this.<actionName>Error` in
later steps. See
[Error handling](../workflow/error-handling.md).

## Cron vs Kafka subscription

Cron is time-driven - fires at a wall-clock schedule, regardless of
state. A Kafka-bound business API
(`controllers.kafkaSettings.hasKafkaController: true`) is
event-driven - fires when a topic emits a message. Choose by trigger
source: a daily archive sweep is cron; reacting to an external
"user.signed-up" event is Kafka.

## Worked example: nightly archive sweep

The example at the top of this page is already representative: at
03:00 the `create` pipeline inserts the run record, the
`archiveExpired` action updates every expired, non-archived order in
one set-based write, `recordCount` stores how many it touched, and
`fireDone` publishes a "done" event. An `update`-crudType cron API
would not do this: its main write is one row, the first one its where
clause resolves. For very large backfills, replace the single
`UpdateCrudAction` with a `LoopAction` that walks the input in batches
- see [Bulk actions](bulk-actions.md#bulk-work-as-the-apis-purpose-a-job-record)
for the job-record pattern.

## See also

- [Scheduled business, cron jobs and cron controllers](scheduled-business.md)
- [BusinessApi overview](overview.md), [Update API](update-api.md),
  [Bulk actions](bulk-actions.md)
- [Actions & workflow - workflow context](../workflow/workflow-context.md),
  [Error handling](../workflow/error-handling.md)
- Schema: [`ApiCronSettings`](../../spec/ApiCronSettings.md),
  [`EdgeCronSettings`](../../spec/EdgeCronSettings.md) (edge
  controllers - for fully-custom cron handlers outside the action
  pipeline).
