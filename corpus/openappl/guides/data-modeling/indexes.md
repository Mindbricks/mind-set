---
title: Indexes
---

# Indexes

Indexes speed lookups, enforce uniqueness, and unlock list-side search. In OpenAPPL they are declared in two places: on a property via [`PropertyIndexSettings`](../../spec/PropertyIndexSettings.md), and on the data object via [`CompositeIndex`](../../spec/CompositeIndex.md) entries inside `objectSettings.compositeIndexSettings`.

## What you get automatically

- A primary-key index on `id` (UUID).
- A foreign-key index on every relation property (a property with a populated `relationSettings`). In PostgreSQL this backs the FK constraint efficiently; in MongoDB it indexes the reference field.
- A spatial index on every `GeoPoint`, `GeoRoute`, and `GeoArea` property: a GiST index in PostgreSQL, a `2dsphere` index in MongoDB. See [Geography](geography.md).
- Elasticsearch indexing on every property with `indexSettings.indexedInElastic: true`.
- A unique constraint on every property with `indexSettings.unique: true`.

No declaration is required for any of those.

## Single-property index

```json
{
  "basicSettings": { "name": "email", "type": "String", "isRequired": true },
  "indexSettings": {
    "indexedInDb": true,
    "unique": true,
    "indexedInElastic": true
  }
}
```

`PropertyIndexSettings` flags:

| Flag | Effect |
|------|--------|
| `indexedInDb` | Adds a native DB index (B-tree) for fast filtering and sorting. |
| `unique` | Adds a unique constraint: duplicates are rejected by the DB. |
| `indexedInElastic` | Mirrors the property into the Elasticsearch index; required for participation in [`DataView`](../system-services/bff.md) filters. |
| `fulltextSearch` | Adds a text index on top of the term index in Elasticsearch. Only meaningful when `indexedInElastic: true`. `Text` properties already get full-text indexing. |
| `clusterInRedis` | Makes the property a cluster key of the object's query cache, the slice along which cached list answers are invalidated. Only meaningful when a list API on the object opts in with `listOptions.queryCache: true`; otherwise validation warns (`CLUSTER_IN_REDIS_UNUSED`). |
| `cacheSelect` | Uses the property as a Redis entity-cache lookup key for batch-select operations. |
| `isSecondaryKey` | Marks the property as a secondary identifier (slugs, access tokens). Improves query performance on the alternative key. |

## Unique constraint

For a single-property unique constraint, use `indexSettings.unique: true` (as above). For uniqueness across two or more properties, use a composite index.

Under soft delete, every generated unique index covers **live rows only** (`isActive: true`), so a soft-deleted row releases its key. On a tenant-scoped object a unique index also includes the tenant column, so a value is unique within a tenant rather than globally.

## Composite indexes

```json
{
  "objectSettings": {
    "basicSettings": { "name": "order" },
    "compositeIndexSettings": [
      {
        "indexName": "userIdStatusIdx",
        "indexFields": ["userId", "status"],
        "onDuplicate": "throwError"
      }
    ]
  }
}
```

[`CompositeIndex`](../../spec/CompositeIndex.md) fields:

| Field | Required | Notes |
|-------|----------|-------|
| `indexName` | yes | Unique within the data object. Used in DDL and logs. |
| `indexFields` | yes | Ordered list of property names. Order matters: filters must match the prefix. |
| `nullsNotDistinct` | no | Boolean, default `false`. Opt into NULL-equal unique keys on PostgreSQL 15+ or MongoDB. Requires a unique policy, not `doInsert`. |
| `onDuplicate` | yes | `doUpdate` (upsert), `throwError` (reject), `stopOperation` (silent skip), `doInsert` (allow duplicates; index used for lookup only). |
| `partialWhere` | no | A partial-index predicate: an equality map from declared Boolean, Enum or String property names to scalar literals (for example `{ "isDefault": true }`). The index then covers only the rows that match every entry, so a unique index enforces uniqueness inside that row set and nowhere else. "At most one default per `(userId, providerName)`" is `indexFields: ["userId", "providerName"]` with `partialWhere: { "isDefault": true }`. |

The order of `indexFields` defines the usable prefixes. `["userId", "status"]` supports filters on `userId` alone or `userId + status`; filtering by `status` alone does not use this index.

For a unique composite (no two rows may share the same `(tenantId, slug)`), use `onDuplicate: "throwError"`: the service translates this into a unique constraint at the DB level.

On a create API, `stopOperation` and `doUpdate` make the create idempotent: a replay answers 2xx with the existing row. The api manager reports which happened as `this.createOutcome`: `'created'` when a row was really inserted, `'duplicateStopped'` when this index matched and nothing was written, `'duplicateUpdated'` when it matched and the row was updated in place. Post-main actions still run on a replay, so gate any side effect that must not repeat (a child create, a counter allocation, a published event) with `condition: "this.createOutcome === 'created'"`.

### NULL members and `onDuplicate`

By default (`nullsNotDistinct: false`), a key that carries a NULL is never a duplicate of anything. The generated create and bulk-create duplicate check only runs for a record whose index fields are ALL non-null (a null in that lookup would match a legal existing null-key row), and the database unique index treats NULLs as distinct. So for a row that leaves any member of the index NULL, `doUpdate` never updates, `throwError` never rejects and `stopOperation` never skips: every write inserts a new row.

That is the right behaviour when a null key means "no identity" (a general-admission ticket with no seat number next to seated tickets on `(eventId, seatNo)`). It is the wrong one when the index is meant to hold exactly one row per logical grain: an upsert on `(periodId, companyId, departmentId, currency)` with `departmentId` left null accumulates one row per write for that grain. Unless `nullsNotDistinct` is enabled, validation reports every composite index whose `onDuplicate` is not `doInsert` and whose members include a non-required property as the warning `COMPOSITE_INDEX_NULLABLE_MEMBER`, naming the index and each nullable member. To make such an index identify one row per combination, make each member required (`isRequired: true`), with a `defaultValue` sentinel (for example an empty string or a fixed uuid) where the value may genuinely be absent, so the key is never NULL.

### Opt into NULL-equal logical keys

On PostgreSQL 15+ and MongoDB, set `nullsNotDistinct: true` when a missing member means a real logical grain, such as one total per `(companyId, departmentId)` including the company-wide total with a NULL department:

```json
{
  "serviceSettings": {
    "serviceBasics": { "name": "nullableKeys" },
    "serviceOptions": { "dbType": "postgresql", "postgresMajorVersion": 15 }
  },
  "dataObjects": [
    {
      "objectSettings": {
        "basicSettings": { "name": "departmentTotal" },
        "compositeIndexSettings": [
          {
            "indexName": "companyDepartment",
            "indexFields": ["companyId", "departmentId"],
            "onDuplicate": "doUpdate",
            "nullsNotDistinct": true
          }
        ]
      },
      "properties": [
        { "basicSettings": { "name": "companyId", "type": "String", "isRequired": true } },
        { "basicSettings": { "name": "departmentId", "type": "String", "isRequired": false } }
      ]
    }
  ]
}
```

(The example is a fragment of a service entry.) The rules:

- PostgreSQL needs a declared `serviceOptions.postgresMajorVersion` of at least 15 (`COMPOSITE_INDEX_NULLS_NOT_DISTINCT_VERSION`); this declares the deployment target and does not upgrade a server. MongoDB needs no version declaration.
- The flag needs a unique policy (`COMPOSITE_INDEX_NULLS_NOT_DISTINCT_NON_UNIQUE` when combined with `onDuplicate: "doInsert"`), a supported store (`COMPOSITE_INDEX_NULLS_NOT_DISTINCT_TARGET`) and a target language that implements it (`COMPOSITE_INDEX_NULLS_NOT_DISTINCT_LANGUAGE`).
- On PostgreSQL the unique index is created with `NULLS NOT DISTINCT`. On MongoDB a missing member and an explicit null share the same indexed value, as described by MongoDB's unique-index contract.
- Single and bulk create probes include null members for an opted-in index. `doUpdate`, `stopOperation` and `throwError` then apply to the existing null-key row as they do to a fully populated key. Missing input members are normalized to null for the lookup; the string `"null"` remains a different key. Index members with generated or default values should be supplied with their intended stored value when replaying a logical key.
- An existing database needs a reviewed index migration before enabling the option. Resolve preexisting duplicate null-key rows first; a tightening index build will otherwise fail. The migration diff replaces the index when the flag is added or changed in either direction, and the boot-time repair never tightens an ordinary unique index into a NULL-equal unique by itself. Merely restarting a MongoDB service does not replace a conflicting existing index. Soft-deleted rows remain outside soft-delete unique constraints.

The per-language and per-engine migration mechanics are compiler behaviour; see [the compiler specification](../../compiler/index.md).

### A Date member of a `doUpdate` index is matched by instant

"One row per day" (a composite unique index over `(subjectId, day)` with `onDuplicate: "doUpdate"`) is a supported grain. For every index member whose property type is `Date`, the generated bulk create works on the INSTANT, not on the text the caller wrote: the duplicate probe asks the database for the same parsed value the insert would store, and the conflict rows it reads back are matched to the candidates by their ISO instant on both sides. So any spelling a JavaScript `Date` parses as the same instant matches the stored row: a `Date`, an ISO string with or without milliseconds, an offset form such as `2026-09-22T03:00:00+03:00`, epoch milliseconds, and a date-only `2026-09-22`, which is read as UTC midnight (the value the insert stores for it). A value that does not parse as a date is compared as its plain text. Index members of every other type are compared as the plain string they always were, so a text column is never reinterpreted as a date.

### One emitted index name per object

Every emitted index name is built from the table name and the column names, snake_cased and **lower-cased**. Two declarations that land on the same name are not two indexes: the second is matched against the first one's live index and never created, and if the lost declaration was the unique one, the constraint simply does not exist and the object is reported as `unique-index-missing` drift forever. On MongoDB the same pair auto-names to `<field>_1` twice and the index build fails outright.

Two things follow, and the compiler enforces both:

- **A single-field composite over an already-indexed column does not double the index.** `["name"]` beside `indexedInDb: true` on `name` would emit two entries over the one column under one name. The plain index is dropped in favour of the composite, which is the same key spec plus (in every `onDuplicate` shape but `doInsert`) the uniqueness constraint, so nothing a query used is lost. This applies to the *single*-field shape only: a multi-column composite is a different index with a different name and never collides, so the plain index stays. Express single-column uniqueness through `indexSettings.unique` and keep `compositeIndexSettings` for multi-column identities; the validator warns when you do not.
- **Two properties whose index names project onto one string are refused at design time.** `Name` beside `name`, `full_name` beside `fullName`, `ownerId` beside `owner_id`: each pair snake-cases and lower-cases to one index name. Because the blueprint is otherwise valid and nothing downstream ever reports the missing index, this is an ERROR (`INDEX_NAME_PROJECTION_COLLISION`, or `AUTH_{USER,TENANT}_PROPERTY_INDEX_NAME_COLLISION` on the auth property lists) rather than a warning. Only indexed properties can collide, so two ordinary non-indexed columns spelled that way are unaffected. Rename one of the two.

Both are rules for a freshly generated model. Neither upgrades an existing database whose plain index already holds the contested name: such a database keeps reporting `unique-index-missing` drift after the model is corrected and needs a manual step.

## When to add an index

Three rules of thumb:

1. **Foreign-key columns are already indexed.** Do not re-declare.
2. **Index frequent list-filter columns.** If a list API filters by `status` more often than not, add `indexedInDb: true` on `status`.
3. **Composite for multi-column patterns.** If list APIs commonly filter by `(userId, status, createdAt DESC)`, a composite index `["userId", "status", "createdAt"]` covers the lookup and the sort. Stop at the columns that actually appear: extra columns slow writes for no gain.

## Elasticsearch vs. database indexes

The default list and search path uses Elasticsearch rather than scanning the primary database (PostgreSQL or MongoDB). Properties with `indexedInElastic: true` participate in [data views](../system-services/bff.md), filter expressions, and the list APIs you declare.

Database indexes (`indexedInDb`) matter, in either engine, for:

- Direct DB reads inside a `BusinessApi` action (for example `FetchObjectAction` on a non-Elastic path).
- `FetchStatsAction` aggregations.
- Bulk operations (and, in PostgreSQL, migrations).

Both index families can coexist on the same property without conflict. `indexedInElastic` and the Elasticsearch path are engine-independent.

The Elasticsearch index of an object is a projection that the service can rebuild from the database (the database is the source of truth). Beside the properties you index, the projection always carries the framework columns `id`, `createdAt`, `updatedAt` and, for an object with soft delete, `isActive` and `_archivedAt`. See [the compiler specification](../../compiler/index.md) for how a rebuild walks the table and how a changed mapping is applied.

## What a compiler emits

The same `indexSettings` and `compositeIndexSettings` compile differently per engine (`serviceOptions.dbType`). The contract an author can rely on:

- **PostgreSQL:** every `indexedInDb` and `unique` flag becomes an index; array properties get a GIN index, geo properties a spatial index; every composite index becomes a multi-column index. Under soft delete, unique indexes are partial (`isActive = true`). Index changes ship as SQL migrations. On a reused database the schema reconcile can loosen a stale stricter unique into the declared composite (for example a leftover global single-column unique replaced by the tenant-scoped composite), and a declared unique it may not create, or failed to create, is reported as `unique-index-missing` drift instead of staying silent. When a declared unique gains columns (a composite `[brandType, brandId]` becomes `[brandType, brandId, supplierId]`), the old index is stricter than the blueprint and keeps refusing rows the blueprint allows; the reconcile drops it only when its columns are a strict subset of a declared unique, it is plain or has the same soft-delete predicate, and its name is one the compiler itself creates. Any other stricter subset is reported as `unique-index-stale` drift rather than dropped.
- **MongoDB:** each index becomes a schema index; geo properties index as `2dsphere`. A `unique` index (single-property or composite) adds a partial filter whenever the object uses soft delete, the index contains a **nullable declared property**, or both. Soft delete contributes `isActive: true`, so only live rows compete for the value; every nullable declared property contributes a type condition, so two rows that both leave the property unset do not collide (a non-sparse MongoDB unique index would otherwise treat missing and null as an indexed value). When a composite opts into `nullsNotDistinct`, the nullable-member conditions are omitted and the soft-delete and `partialWhere` predicates are kept. MongoDB has no SQL migrations: indexes are schema-driven and ensured at startup, and an existing collection keeps its old index when a partial filter changes, so review the affected unique and drop the old index by hand before restarting.
- **Tenant-scoped uniques:** a property unique on a tenant-scoped object is keyed `(tenant column, property)`, in that order; unique composites on tenant-level objects also include the tenant column unless it is already present; non-unique composites keep their declared keys.
- **Elasticsearch mapping (both engines):** every `indexedInElastic` property contributes a typed mapping, and so do the columns the framework adds on top of your declared ones. A changed declaration is applied as an additive mapping update; when Elasticsearch refuses it as a conflict (a field whose type changes), the service rebuilds the index from the database and swaps it in, and reads keep being served throughout. A mapping that still does not land is reported as drift rather than hidden.
- **Redis keys (both engines):** `clusterInRedis` and `cacheSelect` influence the entity-cache layout.

See [Db layer](db-layer.md) for what the generated data-access layer guarantees.

## See also

- [Property types](property-types.md), [Data objects](data-objects.md), [Relations](relations.md), [Db layer](db-layer.md)
- [List options](../composition/list-options.md): how indexes back list-side queries.
- [Index patterns](../composition/index-patterns.md): advanced cases (partial indexes, expression indexes).
- Specification: [`PropertyIndexSettings`](../../spec/PropertyIndexSettings.md), [`CompositeIndex`](../../spec/CompositeIndex.md).
