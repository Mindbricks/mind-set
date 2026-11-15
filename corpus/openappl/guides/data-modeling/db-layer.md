---
title: Db Layer
---

# Db Layer

The Db Layer is what a [`DataObject`](../../spec/DataObject.md) becomes after a compiler builds it: a **model** for the service's database engine, plus a set of typed **data-access helpers** the API handlers (and custom code) call instead of touching the database driver directly. This page states what an author can rely on: how a DataObject maps to each engine, what the helpers guarantee, and which errors the layer answers with. How one compiler writes the model class and the helper functions is described in [the compiler specification](../../compiler/index.md).

Which engine a service gets is selected per service by `serviceOptions.dbType` ([`ServiceOptions`](../../spec/ServiceOptions.md)); see [Services](../blueprint/services.md). The blueprint is identical for both engines; only the generated model differs.

## Sample DataObject

```json
{
  "objectSettings": {
    "basicSettings": { "name": "order", "description": "Customer order header.", "useSoftDelete": true }
  },
  "properties": [
    {
      "basicSettings": { "name": "userId", "type": "ID", "isRequired": true },
      "relationSettings": {
        "relationName": "owner",
        "relationTargetObject": "user",
        "relationTargetKey": "id",
        "onDeleteAction": "doDelete",
        "relationIsRequired": true
      },
      "indexSettings": { "indexedInDb": true }
    },
    {
      "basicSettings": { "name": "status", "type": "Enum", "enumOptions": ["pending", "paid", "cancelled"], "defaultValue": "pending" }
    },
    {
      "basicSettings": { "name": "total", "type": "Decimal", "decimalScale": 2, "isRequired": true }
    }
  ]
}
```

The relation activates by **block presence**: populating `relationSettings` (with `relationTargetObject` set) makes `userId` a foreign key. There is no separate activation flag.

## The model per engine

What the sample above becomes:

| Property | PostgreSQL column | MongoDB field |
|----------|-------------------|---------------|
| `id` (added automatically) | `UUID`, primary key, UUID v4 default | string holding the UUID v4 |
| `userId` | `UUID NOT NULL`, indexed | string, required, indexed |
| `status` | short string (`VARCHAR`), nullable, default `'pending'` | string, not required, default `'pending'` |
| `total` | double-precision number, NOT NULL (see the `Decimal` note below) | number, required |
| `isActive` (soft delete) | boolean, NOT NULL, default `true` | boolean, required, default `true` |
| `_archivedAt` (soft delete) | timestamp, nullable | date, default null |
| `createdAt`, `updatedAt` | timestamps managed by the service | timestamps managed by the service |

The mapping rules behind it:

- `ID` is a `UUID` column in PostgreSQL and a string in MongoDB (not an `ObjectId`), so ids are identical across engines. `Double` is a double-precision number; `Enum` is a plain short string. The full type table is in [Property types](property-types.md#type-catalogue).
- `Decimal` is stored as a double-precision number for now: the type is [staged](property-types.md#decimal), so storage stays floating point while the declared scale is enforced by rounding at every write boundary. The create, bulk-create and update helpers on this page round the `Decimal` columns of every payload they write. Exact storage (`NUMERIC`) arrives later under the same declaration.
- Geo types map to `GEOGRAPHY(POINT | LINESTRING | POLYGON, 4326)` on PostgreSQL and to GeoJSON sub-documents with a `2dsphere` index on MongoDB. An `isArray` geo property is ONE multi-geometry column (`GEOGRAPHY(MULTIPOINT | MULTILINESTRING | MULTIPOLYGON, 4326)`, or a GeoJSON `MultiPoint` / `MultiLineString` / `MultiPolygon` sub-document; an empty list is stored as `null` on MongoDB). Every other `isArray` type is a native array. The helpers normalize every geo column of the payload they write to canonical GeoJSON (a list folds into its multi-geometry), and a read unfolds a stored multi-geometry back into the list; see [Geography features](../capabilities/geography-features.md#lists-of-geo-values-isarray).
- `isRequired` becomes `NOT NULL` (PostgreSQL) or `required: true` (MongoDB); otherwise the column is nullable.
- `useSoftDelete: true` adds `isActive` and `_archivedAt`; timestamps are managed for `createdAt` and `updatedAt`.
- `indexedInDb` becomes an index; `unique` adds a uniqueness constraint (partial on `isActive` under soft delete, and, on MongoDB, also when the index contains a nullable declared property). Composite indexes land here too. See [Indexes](indexes.md) for the exact conditions.
- **Relations are not a native FK in MongoDB.** `userId` is a plain string field; the join is resolved at the application layer (the data-access and API layers read the related row), not by a schema-level populate reference. App-level integrity applies in both engines; see [Relations](relations.md).
- A read of an `Enum` property that is not an array also carries a derived ordinal `<property>_idx` (the position of the value in `enumOptions`) next to the string value.

The `belongsTo` / `hasMany` associations from a relation are wired between the models: the child model gets an association named by `relationName`, and the target model gets the matching reverse association.

On a reused PostgreSQL database, the schema reconcile at boot can replace a stale framework single-column unique with the model's looser composite. It only drops indexes whose names are declared by the model or follow the framework's object-prefixed unique-index form. User-named indexes are preserved and logged as protected. A unique with a non-default operator class or a key collation different from the column's is preserved and does not satisfy a plain model unique. For PostgreSQL arrays, reconciliation reads the live element type as well as the array dimension: a live `text[]` under a declared `uuid[]` or `integer[]` is reported as pending type drift, and boot preserves the stored values and leaves the conversion to an explicit migration.

## Deployment requirements and limits

- The session store and other multi-key Redis paths of a generated service support **standalone Redis and Redis Sentinel only**. Redis Cluster is not supported: the session-write script accesses keys in two hash slots, so it cannot execute as a single Redis Cluster script.
- The shared PostgreSQL connection pool is bounded. A query that cannot get a pooled connection within the acquisition limit (5 seconds by default) fails fast with `503` and `errorCode: "DB_POOL_SATURATED"` instead of hanging; the caller should retry, the pool should be enlarged, or the slow query holding connections should be found.
- A single request-path statement that runs longer than the statement limit (30 seconds by default) is cancelled by the database and surfaces as `503` with `errorCode: "DB_STATEMENT_TIMEOUT"`. The same limit applies to MongoDB queries and aggregates (a server-side time limit), with the same code. Boot-time schema work (reconcile, sync, migrations) runs exempt from the request-path limit.
- An Elasticsearch search that the cluster cuts short returns partial hits with `timed_out: true`; the service refuses to present that as a page and answers `503` with `errorCode: "SEARCH_TIMEOUT"`.
- All of these surface as the standard RFC 9457 problem+json error body (`type`, `title`, `status`, `detail`, `errorCode`, `requestId`) and never echo driver internals; the full error and stack are logged server-side under the same `requestId`.
- The limits and the retry bounds for the initial boot connection are deployment settings of the compiler's runtime, not blueprint settings; see [the compiler specification](../../compiler/index.md). A service can also shed excess load **before** it reaches the pool with a [`loadShield`](../capabilities/load-shield.md).

## The data-access helpers

Every generated service ships a set of per-DataObject helper functions that the API handlers (and your service-library code) call instead of touching the ORM directly. They are generated for both engines, so calling code is engine-agnostic.

For each DataObject `X` you get, among others:

| Helper | Does |
|--------|------|
| `create<X>(data, context?)` | Insert a row, run unique-index checks, index to Elasticsearch, emit the `created` Kafka event. |
| `get<X>ById(id)` | Fetch one row by id (cache-aware when entity cache is on). |
| `update<X>ById(id, data, context?)` | Update, re-index and emit `updated`. |
| `delete<X>ById(id, context?)` | Delete (or soft-delete) and emit `deleted`, then apply the object's [on-delete relations](relations.md#on-delete-cascades): a live `restrict` child anywhere below refuses with 409 before any write, `doDelete` children go recursively, `setNull` children lose their FK. |
| `list<X>({ where, order, limit, offset, includeArchived? })` | Paginated list. |

Each write emits a DB-level Kafka event and keeps the Elasticsearch read-replica in sync. A create, update or delete waits a bounded time for its Elasticsearch projection write to settle before it publishes the row's change events, so consumers that re-read the source object normally see the post-write row; every projection write carries a version derived from `updatedAt`, so Elasticsearch itself rejects a late landing older than the document it would overwrite. Under an Elasticsearch stall the write and its events proceed after the bound and a consumer that re-reads the source can still see the pre-event row; use the event payload when that matters.

Naming follows one convention (`create<X>`, `get<X>ById`, `update<X>ById`, `delete<X>ById`, `list<X>`, plus bulk and by-query variants); the rules for soft-deleted rows apply to every by-query variant alike (see [Lifecycle and state](lifecycle-and-state.md#who-sees-archived-rows)). For the full helper catalogue (the `context` parameter, bulk helpers, MQuery variants, and when to use helpers versus CRUD actions) see [the compiler specification](../../compiler/index.md). This page is the "blueprint to generated model" bridge.

## See also

- [Data objects](data-objects.md), [Property types](property-types.md), [Indexes](indexes.md), [Relations](relations.md)
- [Services](../blueprint/services.md): where `dbType` is chosen.
- Specification: [`DataObject`](../../spec/DataObject.md), [`DataProperty`](../../spec/DataProperty.md), [`ServiceOptions`](../../spec/ServiceOptions.md).
