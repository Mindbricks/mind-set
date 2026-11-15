---
title: Index patterns
---

# Index patterns

Recipes for choosing the right index across the two indexing
surfaces of a blueprint — the primary database and the Elasticsearch CQRS
index that backs the BFF's read models. The basics live in
[Indexes](../data-modeling/indexes.md); this page is *when to choose
what* and *what the defaults already cover*.

## What you get for free

For every primary data object, the compiler already emits:

- A primary-key index on `id`.
- Unique indexes for every property marked
  `indexSettings.unique: true`.
- Foreign-key indexes for every property whose
  `basicSettings.hasRelation === true` references another data object.
- Elasticsearch term-query indexing for every property with
  `indexSettings.indexedInElastic: true` (default for properties on
  objects whose list/search APIs use the BFF).

If your list filters all touch indexed Elastic fields and your
uniqueness constraints are declared, you rarely need more.

## PropertyIndexSettings

Per-property index controls live on the property:

| Setting | Effect |
|---|---|
| `indexedInElastic` | Property is indexed in the Elasticsearch CQRS index; usable in DataView filters and list APIs. |
| `fulltextSearch` | Adds an additional text-analysed index alongside the term index (ignored when `indexedInElastic` is false; `Text` properties get this automatically). |
| `indexedInDb` | A native DB index is created on the property — accelerates direct fetches and updates that bypass Elasticsearch. |
| `unique` | Enforces a uniqueness constraint at the DB level. |
| `clusterInRedis` | Property contributes to Redis cluster keys for partial cache invalidation. Improves cache sensitivity at the cost of Redis storage. |
| `cacheSelect` | Property is usable as a lookup key in Redis entity cache for batch-select operations. |
| `isSecondaryKey` | Marks the property as a secondary identifier — useful for tokens, slugs, alternative keys. Pairs with `cacheSelect` for fast token lookup. |

Each toggle is independent. A property can be DB-indexed, ES-indexed,
both, or neither.

## When to add a DB-level index

DB indexes matter on paths that bypass Elasticsearch:

- `FetchObjectAction` / `UpdateCrudAction` that filter by non-id
  properties.
- `FetchStatsAction` aggregations that hit the primary DB.
- Inner-action lookups inside a `LoopAction` (where each iteration
  issues a single-row read).
- High-stakes read paths where Elastic's eventual consistency is not
  acceptable.

The rule for composite indexes: the leading column must be selective
on its own. Composite `(userId, status)` helps "orders for user U in
status S" if there are many users; composite `(status, userId)` does
not help that query when `status` has 4 distinct values.

A useful composite for "list orders for one user in one status":

```json
{ "indexName": "userId_status", "indexFields": ["userId", "status"] }
```

For multi-column composite indexes, declare them on the data object's
`objectSettings.compositeIndexSettings[]` chapter rather than on a
single property.

## Composite indexes

Each entry under `objectSettings.compositeIndexSettings[]` is a
`CompositeIndex`:

| Property | Type | Req | Notes |
|---|---|---|---|
| `indexName` | String | ✓ | Unique within the data object. Used in DDL. |
| `indexFields` | PropRefer[] | ✓ | Field names in leading-column-first order. Order matters for query planning. |
| `onDuplicate` | OnDuplicate |  | Conflict behaviour on insert: `doUpdate` (upsert), `throwError`, `stopOperation`, `doInsert`. |
| `partialWhere` | Object |  | Makes the index PARTIAL: an equality map `{ <declared property>: <literal> }` (Boolean, Enum or String properties; boolean / string literals). The index covers only the rows matching every entry. Leave unset for an index over every live row. |

```json
"objectSettings": {
  "compositeIndexSettings": [
    { "indexName": "userId_status",   "indexFields": ["userId", "status"] },
    { "indexName": "tenantId_email",  "indexFields": ["tenantId", "email"], "onDuplicate": "throwError" }
  ]
}
```

Use composite indexes to enforce multi-column uniqueness (set
`onDuplicate: "throwError"`) or to accelerate compound filters.
Single-column uniqueness is expressed via the property's
`indexSettings.unique: true` flag — don't reach for a one-field
composite index for that case.

### Partial indexes (`partialWhere`)

A composite index can be restricted to the rows matching an equality
predicate. The canonical case is "at most one default per user and
provider": uniqueness must hold among the DEFAULT rows only, so any
number of non-default rows stays legal.

```json
{
  "indexName": "uniqueDefaultMethodPerUserProvider",
  "indexFields": ["userId", "providerName"],
  "partialWhere": { "isDefault": true },
  "onDuplicate": "throwError"
}
```

Both storage engines lower it to the same row set: Postgres gets a
partial index (`WHERE "isActive" = true AND "isDefault" = true` on a
soft-delete object), MongoDB a `partialFilterExpression` with the same
terms. Rules:

- Keys are declared, scalar Boolean / Enum / String properties of the
  object (not `isActive`, not the tenant column); values are boolean or
  string literals of the matching type (an Enum value from its
  vocabulary). `null`, numbers and operators are refused at design time.
- A partial UNIQUE index is enforced by the database only. The
  generated create path's duplicate check cannot see the predicate, so
  `onDuplicate` must be `throwError` (the default here) or `doInsert`
  (a plain partial index): a violating write answers the ordinary 409
  duplicate error.
- On a database that already holds rows violating a NEW partial unique
  index, the index build fails and the service boots without it (the
  table is reported degraded and `/health` lists the pending
  migration) unless the rows are repaired first.

The language does not express functional / expression indexes
(`lower(email)`) or predicates beyond this equality map. If you
genuinely need one, declare it as a migration outside the blueprint
surface.

## Elasticsearch overrides

The BFF replicates each property marked `indexedInElastic: true`
into the data object's ES index. Mapping is derived from the
property's `DataType`. There is no blueprint-level override block
for per-field analyzers, sub-fields, or geo / completion mapping —
those are derived from the property's type. When the default does
not fit (e.g. you want a language-aware analyzer on a `Text`
property, or a `keyword` sub-field on a `String`), the mapping has to
be adjusted outside the blueprint, in the generated BFF service.

Cross-link: [BFF service](../system-services/bff.md) for how the index
is populated and queried.

## Redis cache

`indexSettings.clusterInRedis` and `indexSettings.cacheSelect` toggle
the property's role in the Redis entity cache:

- `clusterInRedis: true` — the property becomes part of the cache
  cluster key, so invalidation can target rows that share this value.
  Useful for tenant scoping and owner scoping.
- `cacheSelect: true` — the property is a usable lookup key for the
  batch-select cache. Useful for secondary keys (slugs, tokens) where
  the row is read by that value but not by id.

Both are off by default — turn on only when the cache hit-rate
analysis says it pays off.

### Object-level entity caching

Property-level toggles compose with the object-level
`objectSettings.redisEntityCacheSettings` chapter. Turn entity
caching on for a data object whose rows are read far more often than
they change:

```json
"objectSettings": {
  "redisEntityCacheSettings": {
    "useEntityCaching": true
  }
}
```

`useEntityCaching` is the whole switch: every row of the object is
cached on read-miss and write-through, and evicted on delete. There is
no admission rule and no per-row TTL policy, and the settings have no
`configuration` block (`useSmartCaching`, `cacheCriteria`,
`checkCriteriaOnlyInCreateAndUpdates` are refused with
`RETIRED_SETTING`). See [Redis entity caching](redis-entity-caching.md).

## Indexing advice for joins

A `SelectJoin` is not an SQL join: it runs one batched `$in` query per
join against the **target** object's join key, so that key needs an
index on the target side. Foreign-key indexes (emitted for relation
properties) cover this for normal many-to-one joins. For one-to-many
joins where the target's FK is arbitrary (`member.organisationId`),
confirm `organisationId` is indexed in the target's data object — it
usually already is via the relation, but verify.

`PropertyStaticJoin` writes a copy into the row, so the read side
does not need the join-target index at all. Index the static-join
column itself if you filter by it (`WHERE clientId = ?`).

## Verifying an index is used

- **Postgres:** `EXPLAIN ANALYZE <query>`. Look for `Index Scan` /
  `Index Only Scan` rather than `Seq Scan`.
- **MongoDB:** `db.coll.find(...).explain('executionStats')`. Look for
  `IXSCAN`.
- **Elasticsearch:** the service's request logs include the
  generated query body; cross-reference with the index mapping to
  confirm the field is indexed and the analyzer matches.

If a query you expect to be fast is not, the first three checks are
(a) is the property actually marked indexed in the blueprint, (b) did
the migration that creates the index run, (c) does the planner pick
it — leading column selectivity is the usual reason it doesn't.

## Anti-patterns

- **Indexing every column "just in case."** Slows writes, balloons
  storage. Add indexes when a slow query proves the need.
- **Composite indexes that don't match the query.** Composite on
  `(a, b, c)` does not help `WHERE b = ?`. Indexes are leading-column
  ordered.
- **Indexes on low-cardinality columns alone.** `status` with 4
  values is not useful as a leading index column. Pair it with a
  selective column at the start of a composite index instead.
- **Indexing both DB and Elastic when only one side reads the
  property.** The Elastic index has its own write cost.

## See also

- [Indexes](../data-modeling/indexes.md) — the basics page.
- [Select-join](select-join.md) — index advice for read-time joins.
- [Static joins](static-joins.md) — write-time alternative that
  removes the join cost entirely.
- [BFF service](../system-services/bff.md) — how the Elasticsearch
  index is populated.
- Specification:
  [`PropertyIndexSettings`](../../spec/PropertyIndexSettings.md),
  [`CompositeIndex`](../../spec/CompositeIndex.md).
