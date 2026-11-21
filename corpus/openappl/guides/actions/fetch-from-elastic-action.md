---
title: FetchFromElasticAction
---

# FetchFromElasticAction

Runs a **raw Elasticsearch query** against a data object's index and returns a normalised `{ items, aggregations, total }` shape. Use it when [`SearchObjectAction`](./search-object-action.md) is too high-level: most often for aggregations or DSL features the higher-level action doesn't surface.

For keyword + filter queries, prefer [`SearchObjectAction`](./search-object-action.md). Reach for `FetchFromElasticAction` when you need:

- aggregations (`terms`, `date_histogram`, `top_hits`, ...)
- nested / parent-child queries
- function-score or rescoring
- any other capability beyond what `SearchObjectAction` exposes

## When to use it

- Compute facets, counts, or distributions for a list view (terms agg).
- Stratify by time (date histogram) for a trend chart.
- Run a `top_hits` aggregation to get the latest row per group.
- Issue a query DSL feature the higher-level action does not surface.
- For everything else (keyword + filters, paging, sort) use [`SearchObjectAction`](./search-object-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `targetObject` | `DataObjectName` | yes | The data object whose Elastic index to query. Can be the main object, another data object in the same service, or any data object reachable through the project's search index. |
| `body` | `MScript` | no | Expression yielding the raw Elasticsearch search body object. Uses Elasticsearch operators and query format, **not** the abstract MScript query DSL. |

## Behaviour

The action:

1. Evaluates `body` to produce a raw Elasticsearch search body.
2. Runs that body as a raw search against the index of `targetObject`, with the session and request id.
3. Normalises the response:
   - `items`: `hits.hits` mapped to their `_source` (or the hit itself when `_source` is absent).
   - `aggregations`: the response's `aggregations` object as-is (Elasticsearch format).
   - `total`: the response's `hits.total`, read in either wire shape: `{ value: N }` (Elasticsearch 7+) or a bare number `N` (Elasticsearch 6.x, or Elasticsearch 7+ asked for `rest_total_hits_as_int`). Only an absent, null or non-numeric total falls back to the items length.
4. Returns `{ items, aggregations, total }`. The value is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true.

`top_hits` aggregations are returned verbatim under `aggregations`: they are not flattened into `items`.

> Note: the action has no `properties` projection field. To project per-hit fields, include `_source` controls inside `body` (e.g. `_source: ['id', 'name']`).

**A tenant-scoped target.** In a multi-tenant project, when `targetObject` lives at tenant level and the api is not saas-level, the evaluated `body` is scoped to the caller's tenant: an authored `query` is kept whole in `bool.must` with the tenant term in a non-scoring `bool.filter`, and the same term is appended to the `filter` of every `knn` clause (a single clause or an array of clauses; an authored knn `filter` is kept). A knn-only body gets no synthesized `query` (that would union every in-tenant document into the knn answer); a body with neither `query` nor `knn` gets a filter-only `query`. A session without a tenant searches with `match_none` and answers empty.

**A moderated target.** When `targetObject` carries [`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`, the evaluated `body` is wrapped in a non-scoring `bool.filter` (and `knn.filter`) built from the moderation read gate, so hits and ordinary aggregations cover the rows the caller may see. A `global` aggregation is the exception: Elasticsearch runs it over the whole index, ignoring the gated query, so its buckets count hidden rows; the validator warns (`OBJECT_MODERATION_UNGATED_READ_PATH`). See [the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

## Example

A terms aggregation over a fetched product index:

```json
{
  "name": "categoryFacets",
  "writeToResponse": true,
  "contextPropertyName": "facets",
  "targetObject": "Product",
  "body": { "js": "({ size: 0, query: { bool: { filter: [{ term: { storeId: this.session.storeId } }] } }, aggs: { byCategory: { terms: { field: 'category.keyword', size: 20 } } } })" }
}
```

A date-histogram for a chart:

```json
{
  "name": "ordersByDay",
  "writeToResponse": true,
  "contextPropertyName": "chartData",
  "targetObject": "Order",
  "body": { "js": "({ size: 0, query: { range: { createdAt: { gte: this.fromDate, lte: this.toDate } } }, aggs: { perDay: { date_histogram: { field: 'createdAt', calendar_interval: 'day' } } } })" }
}
```

## Errors

- A malformed Elasticsearch body throws from the raw search (parser or 4xx from the index). Use `onActionError: "completeApi"` to inspect via `this.<actionName>Error`.
- A missing or unreachable index throws: confirm the data object is indexed (see the [BFF service](../system-services/bff.md)).
- `targetObject` referencing a data object not visible to the service surfaces at project-validation time.

## See also

- [`SearchObjectAction`](./search-object-action.md): keyword + filter searches
- [`FetchObjectAction`](./fetch-object-action.md): database-backed point reads
- [BFF service](../system-services/bff.md): Elastic provisioning and indexing
