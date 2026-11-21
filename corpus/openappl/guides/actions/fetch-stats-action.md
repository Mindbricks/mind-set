---
title: FetchStatsAction
---

# FetchStatsAction

Computes inline aggregate statistics (count, sum, min, max, ...) over a data object, optionally bucketed by a grouping field. Use it for quota checks, dashboard counters, and threshold-based conditions inside a workflow.

For raw Elastic aggregations beyond simple aggregates use [`FetchFromElasticAction`](./fetch-from-elastic-action.md). For complex multi-source stats a dedicated stats API or BFF projection is usually the right home.

## When to use it

- Quota guards: "user has < 10 active projects" then stop with a 403.
- Dashboard counters returned alongside the main payload.
- Bucketed counts ("orders per status") for a small chart.
- Aggregated derived totals (sum / average) used in a downstream condition.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `targetObject` | `DataObjectName` | yes | Data object to aggregate over (local or remote). |
| `matchValue` | `MScript` | no | Expression yielding the key value to match against `localKey`. |
| `localKey` | `PropRefer` | no | Property to match on. There is no default: the match term is emitted only when BOTH `matchValue` and `localKey` are set, and authoring `matchValue` without `localKey` is rejected by validation (`FETCH_MATCH_VALUE_WITHOUT_LOCAL_KEY`). "Authored" means a language source carries something: an absent slot, `null` and the untouched multilanguage envelope an editor scaffolds (`{ "js": null, "java": null, ... }`) all count as EMPTY, so an untouched section is never rejected. |
| `whereClause` | `MScript` | no | Advanced query. Combined with the `matchValue` + `localKey` form (both contribute keys to the same query). |
| `stats` | `String[]` | no | SQL-style aggregate expressions: `count`, `sum(price)`, `min(quantity)`, `max(score)`, `avg(rating)`. Optional at the schema level; an omitted or empty list falls back to a single `count`, so the result is `{ count: N }` (with `bucketBy`, each bucket carries its key and `count`), never an empty aggregate. |
| `bucketBy` | `PropRefer` | no | When set, the result is an array of buckets keyed by this property; otherwise a single aggregate object is returned. |

## Behaviour

The action:

1. Builds the query from `whereClause` and the `matchValue` + `localKey` form.
2. Asks the service's data layer for the aggregate of `stats` over that query, bucketed by `bucketBy` when set.
3. Includes already-archived rows ONLY when the target object carries `isActive` AND the API declares [`apiOptions.includeSoftDeleted: true`](../../spec/ApiOptions.md). The cross-service branch takes the same opt-out: a soft delete keeps the archived document in the projected index, the remote stats read is active-only by default, and the same two answers make it include archived documents.

The underlying data path depends on the data layer's stats support for the target object. For raw aggregations against the Elastic index use [`FetchFromElasticAction`](./fetch-from-elastic-action.md) directly.

The result is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true. With `bucketBy`, the result is an array; without, it is a flat object such as `{ count: 7, "sum-price": 1234.5, "max-score": 95 }`: always an object, even for a single stat (`["count"]` yields `{ count: 7 }`, never a bare `7`).

Each non-`count` stat is keyed by its `op-field` alias: `sum(price)` becomes `"sum-price"`, `max(score)` becomes `"max-score"`, so read it as `this.myStats['sum-price']`. `count` keeps its plain name. An `avg(field)` is the fractional mean even over an Integer property (`avg(rating)` of 4 and 5 is `4.5`); `sum`, `min` and `max` keep the property's type.

The always-an-object rule is a COMPATIBILITY commitment, not a detail:
deployed blueprints call single-stat reads (`['count']`)
and read `.count` off the result. A "simplification" that collapsed the
single-stat case back to a bare number would break them silently, so the
object form is fixed.

**A moderated target.** When `targetObject` carries [`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`, the aggregate runs over the rows the caller may see: the read gate is conjoined onto the query, local and cross-service alike, so a non-privileged caller's counts leave out other users' unapproved rows. This is the caller-gated count to use where a DataView `stat` over such an object is refused (`OBJECT_MODERATION_UNGATEABLE_VIEW_STAT`). See [the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

## The stat-key contract

The contract for every service language is the one above: `stats` entries are written `count` / `op(field)`, and the
non-bucketed result keys them `count` / `op-field`. Blueprints and
client code should be written against that shape only. A bucketed result is an array of objects carrying the bucket
column value and an always-present `count`.

## Example

**Quota guard before create:**

```json
"fetchStatsActions": [
  {
    "name": "projectCount",
    "writeToResponse": false,
    "contextPropertyName": "projectStats",
    "targetObject": "Project",
    "matchValue": { "js": "this.session.userId" },
    "localKey": "ownerId",
    "stats": ["count"]
  }
],
"validationActions": [
  {
    "name": "underQuota",
    "description": "A user may own at most ten projects.",
    "writeToResponse": false,
    "validationScript": { "js": "this.projectStats.count < 10" },
    "shouldBeTrue": true,
    "checkType": "liveCheck",
    "errorStatus": "403",
    "errorMessage": "Project quota reached."
  }
]
```

**A count feeding a create dataClause** (e.g. "the first work of a workspace is the primary one"):

```json
"fetchStatsActions": [
  {
    "name": "countWorks",
    "contextPropertyName": "existingWorkCount",
    "targetObject": "Work",
    "matchValue": { "js": "this.workspaceId" },
    "localKey": "workspaceId",
    "stats": ["count"]
  }
],
"workflow": { "create": { "afterCheckParameters": ["countWorks"] } },
"dataClauseItems": [
  { "name": "isPrimary", "value": "this.existingWorkCount.count === 0" }
]
```

Two things decide whether that `=== 0` is ever true:

- Read the member, not the slot. The slot holds `{ count: 0 }` (a number inside the always-an-object result), so `this.existingWorkCount === 0` compares an object with a number and is `false` on every request; `this.existingWorkCount.count === 0` is the comparison that holds for an empty set. Validation flags the whole-slot form, whether the slot is written as an MScript object (`{ "js": "..." }`) or as a plain string like the example above, with the warning `FETCH_STATS_RESULT_USED_AS_NUMBER`, which names the stat labels the action publishes.
- Stage the action before the data clause is built. The api's `dataClauseItems` are evaluated by the pipeline's data-clause build step, which runs BEFORE the `afterBuildDataClause` stage, so on a create the action belongs in `afterCheckParameters` or `afterCheckBasicAuth` (or earlier). A dataClause that reads a context value produced at `afterBuildDataClause` or later would see `undefined`, and validation rejects that shape (`ACTION_CONTEXT_READ_BEFORE_PRODUCED`).

**Bucketed stats for a small chart:**

```json
{
  "name": "ordersByStatus",
  "writeToResponse": true,
  "contextPropertyName": "ordersChart",
  "targetObject": "Order",
  "whereClause": { "js": "({ ownerId: this.session.userId, createdAt: { $gte: this.weekStart } })" },
  "stats": ["count", "sum(total)"],
  "bucketBy": "status"
}
```

Returns `[{ status: 'paid', count: 12, 'sum-total': 4200 }, { status: 'draft', count: 5, 'sum-total': 800 }, ...]`.

An aggregation that WAS answered but matched nothing returns `[]` (bucketed) or
`{ count: 0 }` (flat), and that is a normal success: the context slot holds it
and the api answers 200.

On the cross-service path (a `targetObject` owned by another service, read over
its Elasticsearch projection) a read that could not be answered at all (elastic
not configured, projection index missing, transport or aggregation error) is
NOT written to the context. The action logs `RemoteFetchNotAnswered` (naming the
action, the object, the sibling service and the requestId) and throws a **503
`REMOTE_STATS_NOT_ANSWERED`**. You never see a `null` in the slot, so nothing
downstream has to branch on one: an outage is an error response, not a chart of
zeros. The underlying remote stats read answers `null` on failure if you call it
yourself from a library function.

Note that the throw only aborts the api under `onActionError: throwError` (the
default). With `onActionError: completeApi` the pipeline continues and the
context slot is never assigned; a consumer that reads it then sees `undefined`.
`CollateListsAction` and `ListMapAction` both refuse an absent source list for
exactly that reason (a genuinely EMPTY list is still processed normally).

## Errors

- A malformed stat expression (`sum()` without a column, unknown function) throws at the data layer.
- An unknown `targetObject` or missing Elastic index throws at runtime. Confirm the data object is indexed.
- Missing key on a related field (e.g. invalid `localKey`) is rejected at project-validation time.
- A cross-service aggregation that could not be answered throws 503 `REMOTE_STATS_NOT_ANSWERED` (see above). The local data-layer path throws too, from the stats read itself.

## See also

- [`FetchObjectAction`](./fetch-object-action.md), [`SearchObjectAction`](./search-object-action.md)
- [`FetchFromElasticAction`](./fetch-from-elastic-action.md): raw Elastic aggregations
- [BFF service](../system-services/bff.md)
- [`ValidationAction`](./validation-action.md): common follow-up
