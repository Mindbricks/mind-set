---
title: ElasticLog
---

# ElasticLog

`ElasticLog` is an **Elasticsearch-only, append-only log**: a first-class
sibling of [`DataObject`](../data-modeling/data-objects.md), **not** a flag on
one. Where a DataObject is relational (a SQL/Mongo model with `id`,
`createdAt`, `recordVersion`, soft-delete, relations, joins, and entity
caching), an ElasticLog is a typed log stream that lives **only** in ES: it has
its own mapping, a self-owned timestamp, and a retention window, and nothing
relational at all.

You declare a log once under
`projectSettings.elasticLogsSettings.elasticLogs[]`; any service then **writes
and reads it directly against Elasticsearch** through generated helpers: there
is no relational hop and no double-write.

## The problem it solves

High-volume, append-only, TTL-bounded data (audit trails, send records,
telemetry, event logs) is the wrong shape for a DataObject. Modelling it
relationally drags in an unbounded SQL/Mongo table, soft-delete bookkeeping,
`recordVersion`, and entity caching that a log neither needs nor wants. Logs are
terminal: nothing foreign-keys *to* them, so relational integrity buys nothing.

The motivating case is a notification log that **double-writes**: a
relational `create` *and* an ES index op on every send, with retention enforced
only on the ES copy, so the relational table grows without bound. ElasticLog
fixes that class of problem by moving log volume to ES-only with native
lifecycle retention.

> **Not yet applied to the built-in notification log.** Re-platforming the
> notification layer's own log onto `ElasticLog` is planned, not done: the
> notification layer still writes its relational log today.

## Why a separate pattern, not an `esOnly` flag

A DataObject's entire contract is relational. An `esOnly` boolean would force
every downstream generator (data layer, models, relations, migrations,
caching) to grow `if (esOnly)` branches, the exact class of silent breakage a
narrow sibling pattern avoids. ElasticLog keeps the blast radius contained, the
same way buckets are a data pattern rather than a DataObject mode. See
[DB buckets](db-buckets.md) for the sibling-pattern precedent.

## The model

A log is declared in the project registry, mirroring the
`bucketProvidersSettings` shape:

```json
{
  "projectSettings": {
    "elasticLogsSettings": {
      "elasticLogs": [
        {
          "name": "meetingAudit",
          "description": "Append-only audit trail of meeting-record writes (ES-only, ILM-retained).",
          "timestampField": "@timestamp",
          "retentionDays": 30,
          "fields": [
            { "name": "action",          "type": "keyword", "filterable": true },
            { "name": "meetingRecordId", "type": "keyword", "filterable": true },
            { "name": "userId",          "type": "keyword", "filterable": true },
            { "name": "message",         "type": "text" }
          ]
        }
      ]
    }
  }
}
```

### `ElasticLog` fields

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | String | ✓ | Unique within the project. Becomes the index/alias base `<codename>_<name>`, the `logName` lookup key, and the helper suffix (`writeToESLog_<name>`). |
| `description` | Text | | Human-readable note on what the log records. |
| `ownerService` | String | | Scopes *where the admin read route is generated*. The index lifecycle is always owned by the control-plane service (see below); `ownerService` does not change that. |
| `timestampField` | String | | The self-owned timestamp stamped on every line: the ILM and time-range query anchor. Default `@timestamp`. |
| `retentionDays` | Integer | | ILM deletes indices older than this. `0` or negative disables retention. Default `30`. |
| `fields` | [`ElasticLogField`](../../spec/ElasticLogField.md)[] | | The ES mapping. |

### `ElasticLogField`

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | String | ✓ | Field name in the mapping and in the logged object. |
| `type` | enum | | One of `keyword`, `text`, `long`, `double`, `boolean`, `date`, `object`, `ip`, `geo_point`. Unknown values coerce to `keyword`. |
| `filterable` | Boolean | | Hint that the field is meant for admin search filters. Analyzed `text` fields are searchable regardless. |

See the pattern pages for the full schema:
[`ElasticLogsSettings`](../../spec/ElasticLogsSettings.md),
[`ElasticLog`](../../spec/ElasticLog.md),
[`ElasticLogField`](../../spec/ElasticLogField.md).

## Write side: `WriteToElasticLogAction`

A BusinessApiAction appends one object to a log by name. It compiles to a direct
call to the generated `writeToESLog_<logName>` helper: a **local ES write**,
never an interservice call.

```json
{
  "writeToElasticLogActions": [
    {
      "name": "auditMeetingWrite",
      "logName": "meetingAudit",
      "logObject": { "js": "{ action: 'created', meetingRecordId: this.meetingRecord?.id, userId: this.session?.userId, message: 'meeting record created' }" },
      "onActionError": "completeApi"
    }
  ]
}
```

| Field | Type | Req | Notes |
|---|---|---|---|
| `logName` | String | ✓ | Must match a declared `elasticLogs[].name`. |
| `logObject` | [`MScript`](../../spec/MScript.md) | ✓ | Evaluates to the object to append. Keys should match the mapping fields; the timestamp field is stamped automatically when absent. |

The append is **best-effort**: when ES is down or the index op fails, the helper
returns `false` rather than throwing, so a logging call can never break the
request it instruments. An unknown `logName` is a silent no-op (so a stale
blueprint reference never crashes a request).

See [`WriteToElasticLogAction`](../../spec/WriteToElasticLogAction.md).

## Read side: `FetchFromElasticLogAction`

Queries a declared log with a **raw Elasticsearch search body** (ES's own
`query` / `sort` / `from` / `size` format, not the abstract MScript query DSL).
Compiles to a direct `queryESLog_<logName>` call.

```json
{
  "fetchFromElasticLogActions": [
    {
      "name": "recentMeetingAudit",
      "logName": "meetingAudit",
      "writeToResponse": true,
      "contextPropertyName": "auditLines",
      "body": { "js": "({ size: 25, query: { term: { userId: this.session.userId } }, sort: [{ '@timestamp': { order: 'desc' } }] })" }
    }
  ]
}
```

| Field | Type | Req | Notes |
|---|---|---|---|
| `logName` | String | ✓ | Must match a declared `elasticLogs[].name`. |
| `body` | [`MScript`](../../spec/MScript.md) | | Raw ES search body. When absent, returns the most-recent lines (a `match_all` sorted descending by the timestamp field). |

The context property receives the envelope `{ items, aggregations, total }`: `items` is
the matching lines (each hit's `_source`), `aggregations` is the response's aggregation
result verbatim (Elasticsearch format; `null` when the body asks for none), and `total` is
the total hit count. A `terms` / `date_histogram` rollup over a log is therefore read as
`this.<contextPropertyName>.aggregations.<name>.buckets`. When ES is unavailable (or the
search fails) the envelope is `{ items: [], aggregations: null, total: 0 }`.

See [`FetchFromElasticLogAction`](../../spec/FetchFromElasticLogAction.md).

### Owner-hosted admin read route

When a project declares any log, each service also gets a token-gated admin
router:

```
GET /admin/elastic-logs            → list declared log names
GET /admin/elastic-logs/:name      → recent lines, with size / from / since /
                                      until / q / order query params
```

It is gated exactly like the service's `/admin/logs` surface, through the
shared admin gate: only an admin-grant JWT carrying the `logs:read` scope
(`Authorization: Bearer <grant>`) opens it. The static
`ELASTIC_LOGS_ADMIN_TOKEN` (via the `x-admin-token` header or `?adminToken=`)
is retired: it is not read, and a service that still has it set logs one boot
warning and ignores it. The gate is **fail-closed**: with no valid grant the
surface answers `403`; it does not fall back to network isolation. `since`/`until` build a range query over the
timestamp field, and `q` becomes a `query_string`.

## Architecture: control plane vs data plane

The pattern deliberately splits responsibilities so there is exactly one
authority for each index mapping but no per-line interservice round-trip:

- **Control plane = a single system service of the project** (the BFF-side
  control service) owns each log's ES index lifecycle. At startup it
  reconciles, per log:
  1. an **ILM policy** that rolls the hot index (`max_age: 1d`,
     `max_primary_shard_size: 50gb`) and deletes indices past `retentionDays`
     (skipped when `retentionDays <= 0`);
  2. an **index template** (`<base>_template`, `priority: 500`) binding the
     mapping + ILM policy + rollover alias to the rolling-index pattern
     `<base>-*`, and a second **bare index template**
     (`<base>@bare`, same priority) binding the mapping **alone** to
     the exact name `<base>`. The two patterns are disjoint, and the bare one
     carries no `index.lifecycle.*`: an index may not hold a rollover alias equal
     to its own name, which would park ILM in ERROR and detach retention;
  3. a **bootstrap index** `<base>-000001` with `is_write_index` on the write
     alias, if absent. When the alias already exists because a service's first
     write created it (see the data plane below), the control plane attaches the
     ILM policy to that write index if it has none yet. It changes no mapping and
     moves no data.

  The control plane reads the log list from its **own build**. When the cluster
  holds a log that this build does not declare (the log registry changed and the
  control-plane service was not rebuilt), it logs a warning
  `an ElasticLog exists in Elasticsearch that this build does not declare`
  naming the log. Rebuild and redeploy the control-plane service after adding
  or renaming a log.

  Reconciliation is idempotent and best-effort: ES being down, or an
  Elasticsearch deployment with no ILM endpoint (serverless / managed tiers),
  must never crash startup; the logs simply aren't retention-managed until ES
  is reachable.

  The backing store must be **Elasticsearch**. OpenSearch and other forks are
  not supported: the client rejects a non-Elasticsearch server on every request,
  and the declared mappings use Elasticsearch-only field types. A generated
  service pointed at one names the error once at boot, keeps serving its
  database-backed routes, reports `DEPENDENCY_UNSUPPORTED` on `/health`, and
  answers every Elasticsearch-backed operation with the typed 503
  `ELASTIC_UNAVAILABLE`; the control-plane service still refuses to boot.

- **Data plane = every service, direct-to-ES.** Each generated service has a
  `writeToESLog_<name>` / `queryESLog_<name>` pair per log, plus a
  name-keyed dispatcher (`writeToElasticLog` / `queryElasticLog`) that the
  generated actions and the admin route call. When no ES client is registered,
  writes are no-ops and reads return empty.

  **A write never creates a dynamically mapped index.** Every write carries
  `require_alias: true`. On the first write in a process, the client checks the
  write alias. If the alias does not exist (the control plane has not reconciled
  the log yet), the client creates `<base>-000001` with the declared mapping and
  the write alias on it, then writes. The mapping rule is the same as in the
  control plane's templates: `dynamic: false`, declared types, `object` as
  `flattened`. The create is create-if-absent: when several replicas race, one
  creates the index and the others receive `resource_already_exists_exception`,
  which counts as success. The service logs `ElasticLogIndexCreatedByWriter`
  once. This means the control plane is not deployed yet, or was built before
  the log was declared, and the index has no retention until the control plane
  reconciles it.

  If the write alias disappears while a service runs (an operator removed it,
  or its indexes were deleted), the write that hits the missing alias is
  dropped, not retried, and `ElasticLogWriteAliasMissing` is logged once per
  process. The client then forgets that the alias existed, so the next write
  checks again. When `<base>-000001` no longer exists, that write creates it
  with the alias and the declared mapping, and writing resumes. When
  `<base>-000001` still exists without the alias, the create reports
  `resource_already_exists_exception` and every write is dropped until an
  operator adds the alias back. Only the first dropped write is logged.
  An ILM rollover moves the alias in one atomic step, so it never opens this gap.

Index/alias names resolve from the **lowercased** codename:

| Role | Pattern | Example (codename `Demo`, log `auditTrail`) |
|---|---|---|
| Write alias | `<codename>_<name>` | `demo_audittrail` |
| Read target | `<codename>_<name>,<codename>_<name>-*` | `demo_audittrail,demo_audittrail-*` |
| Bootstrap index | `<codename>_<name>-000001` | `demo_audittrail-000001` |
| ILM policy | `<codename>_<name>` | `demo_audittrail` |

The read target is a **comma-separated list of two exact index expressions**,
not a `demo_audittrail*` glob: the bare index (which a write landing before the
control plane had reconciled created on older runtimes) and the rolling family.
The client splits it on `,` and searches both with `ignore_unavailable` /
`allow_no_indices`, so whichever one does not exist yet simply contributes no
hits. A glob would additionally match every index in the flat `demo_` namespace
whose name merely starts with the log's base (a sibling log such as `audit` vs
`auditTrail`, a DataObject search index, the idempotency store) and read those
rows as log lines. A target language may use a narrower read pattern such as
`demo_audittrail-*`; see [the compiler specification](../../compiler/index.md).

That closes the glob class, not every prefix shape: `<name>-*` still nests one
log's base inside another's rolling family if a name contains `-` (`audit` vs
`audit-trail`). Log names cannot contain `-`: the `codeName` rule canonicalizes
`audit-trail` to `auditTrail` before it is stored, and a backstop validator
rejects a hyphen that reaches validation from an imported blueprint.

### Naming rules the namespace enforces

Every index a project owns lives in the one flat `<codename>_` namespace, and
six independent producers mint names into it: declared ElasticLogs, ES-indexed
DataObjects, BFF DataViews, and three framework-owned singletons
(`idempotency`, `notificationlog`, `mcpchat`). Two names that
resolve to the same base are not two indices with the same label: they are one
index with two writers, each returning the other's documents on an ordinary
read. Validation reports that, with these codes:

| Code | Tier | What it means |
|---|---|---|
| `ELASTIC_INDEX_BASE_SHARED` | error | Two producers resolve to the SAME base. Rename all but one. |
| `ELASTIC_INDEX_BASE_SHARED` | info | The base is a name the framework RESERVES, but this project does not create that index yet. Renaming now is free; renaming once the index exists is a data migration. |
| `ELASTIC_INDEX_BASE_COLLISION` | error | One base sits inside another's `<base>-*` rolling family. The two index templates then claim overlapping patterns at equal priority and one index ends up with no mapping and no retention policy. |
| `ELASTIC_INDEX_BASE_PREFIX` | info | One base merely starts with a prefix-reading producer's base. Harmless where the target language emits the exact read target, a live cross-read where it still globs. The warning names the affected languages when it applies. |
| `ELASTIC_INDEX_CODENAME_CHARSET` | error / info | See the codename rule below. |

The three non-error rows land on the report's WARNING list carrying
`details.severity: 'info'`: the convention for an advisory that is not a
defect for most projects. Only the `error` rows block
generation (`report.hasErrors`).

**Reserved names.** `idempotency`, `notificationlog` and `mcpchat` belong to the
framework. The tier follows the PRODUCER, not the name: a reserved name only
collides where the project actually creates that index.

| Reserved base | Created when | Tier for a name that matches |
|---|---|---|
| `<codename>_idempotency` | any api opts into idempotent replay. Three spellings all count: `useIdempotencyKey` directly on the api, `apiOptions.useIdempotencyKey`, or `basics.apiOptions.useIdempotencyKey`, on a service api OR on an `authentication` api | error when any of them is set, info otherwise |
| `<codename>_notificationlog` | the project gets a notification service, which is INJECTED rather than declared: any `eventNotifications` entry, any active verification / reset / 2FA flow, or any `sendMail` / `sendSms` / `sendPushNotification` / `sendWhatsApp` action anywhere | error when any of those hold, info otherwise |
| `<codename>_mcpchat` | always. The BFF control service sets the chat index with no condition at all | always error |

Most real projects satisfy the notification condition without ever declaring a
notification service, so `notificationLog` is in practice a reserved name for
everybody.

A DataObject, DataView or ElasticLog named `idempotency` in a project that
already uses idempotency keys is an **error**, and a blocking one: that object's
ES projection and the replay store become the same index, so an authenticated
user listing the object reads other callers' stored response bodies, idempotency
keys, user ids and tenant ids. Where the feature is genuinely off, the same name
is an advisory instead: nothing collides today, but enabling the feature later
would make it collide silently. The framework index cannot be renamed, so yours
must. Case does not save you: the base is lower-cased, so `notificationLog` and
`NotificationLog` are the same name as `notificationlog`.

**Codename charset.** The `<codename>_<name>` scheme only works while a codename
cannot contain `_`. Codenames are platform-minted as `[a-z][a-z0-9]{7}`, so this
only bites a blueprint whose codename arrived through an import or a rename:

- a codename containing `_` is an **error**. `acme_shop` + object `order` and
  `acme` + object `shop_order` both resolve to `acme_shop_order`, so two
  PROJECTS read each other's index. No per-project check can detect that, which
  is why it is refused rather than warned about.
- any other character outside `[a-z0-9]` (a dash, a dot, uppercase) is a
  **warning**: the index producers disagree about them, some stripping and some
  interpolating verbatim, so the emitted index name stops being predictable.

There is no automated repair for either: correct the codename at the source that
minted it.

> **Resilience note.** Even if the control plane never runs (ES first reachable
> after the data plane's first write), that first `append` creates the rolling
> bootstrap index with the declared mapping, so log lines are not lost and `term`
> queries on declared `keyword` fields work. The control plane adds the
> retention policy when it reconciles.

### An index created before the control plane reconciled

On runtimes from before this rule, a service that wrote a line **before** the
control plane had put the templates made Elasticsearch auto-create a plain index
named `<base>` (the write-alias name). A cluster can still hold one, and such an
index:

- uses Elasticsearch **dynamic mapping**. A declared `keyword` field becomes
  `text` with a `.keyword` sub-field. A `term` query on the declared name
  (`term: { targetId: ... }`) then matches **nothing**; only `targetId.keyword`
  matches. A `term` on a `keyword` field is exact only when the declared mapping
  was applied;
- blocks the bootstrap: the write alias `<base>` cannot be created over a
  concrete index of the same name, so there is no rolling index and no
  retention.

The control plane never deletes, reindexes or changes that index, because it can
hold the service's first log lines. Instead it logs an ERROR on every start
naming the index, its mapping state and the mis-mapped fields. A current service
that finds such an index logs `ElasticLogSquattingIndex` once and keeps writing
to it, so no lines are lost. Repairing it (create the bootstrap index, reindex,
swap the alias atomically, then retry the lifecycle step) is an operator task
with the writers stopped; see [the compiler specification](../../compiler/index.md).

## What is not covered

- **Event-driven logging**: the "on event X, append the payload (or a
  sub-object of it) to log Y" declarative wiring. You append by calling a
  write action explicitly; there is no event-subscription sugar.
- **Built-in notification log**: it still uses its relational log; moving it
  onto `ElasticLog` is planned, not done.
- **Cross-language parity**: the ES write/search/ILM runtime is not implemented
  by every target language; see [the compiler specification](../../compiler/index.md).

## How it differs from a DataObject

| | DataObject | ElasticLog |
|---|---|---|
| Store | SQL / Mongo (+ optional ES index) | Elasticsearch only |
| Auto metadata | `id`, `createdAt`, `recordVersion`, soft-delete | self-owned `timestampField` only |
| Relations / joins / FKs | yes | none (terminal) |
| CRUD | full data-layer CRUD | append + query |
| Retention | unbounded unless coded | native ILM (`retentionDays`) |
| Write reliability | transactional | best-effort, never throws |

## ElasticLog vs `FetchFromElasticAction`

Both touch Elasticsearch but address different layers:

- [`FetchFromElasticAction`](../../spec/FetchFromElasticAction.md) runs a raw
  ES query against a **DataObject's** index: the ES *projection* of a
  relational object, used for aggregations and DSL features beyond
  `SearchObjectAction`. The source of truth is still the relational record.
- `FetchFromElasticLogAction` queries a **declared ElasticLog**: a store that
  exists only in ES, with no relational counterpart. There is no DataObject
  behind it.

Reach for ElasticLog when the data is log-shaped and should never have hit the
relational DB in the first place; reach for `FetchFromElasticAction` when you
need richer ES querying over an indexed DataObject.

## See also

- [`FetchFromElasticAction`](../../spec/FetchFromElasticAction.md): raw ES query over a DataObject's index (different layer).
- [DB buckets](db-buckets.md): the sibling-pattern precedent (a data pattern, not a DataObject mode).
- [Data objects](../data-modeling/data-objects.md): the relational pattern ElasticLog is a sibling of.
- Patterns: [`ElasticLogsSettings`](../../spec/ElasticLogsSettings.md), [`ElasticLog`](../../spec/ElasticLog.md), [`ElasticLogField`](../../spec/ElasticLogField.md), [`WriteToElasticLogAction`](../../spec/WriteToElasticLogAction.md), [`FetchFromElasticLogAction`](../../spec/FetchFromElasticLogAction.md).
