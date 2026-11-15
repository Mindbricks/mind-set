---
title: Data layer
---

# 4. Data layer

A data object ([`DataObject`](../spec/DataObject.md)) declares stored records. This
chapter states what a compiler must produce for it: the logical names, the system
fields, the delete, tenancy, index and relation semantics, the search projection and the
data-access operations. It is engine-neutral: a relational database, a document database
and a managed store can all conform, as long as the semantics below hold.

A data object produces **no API by itself**. Its records are reachable only through the
business APIs the blueprint declares ([chapter 5](05-business-apis.md)).

## 4.1 Engines

A service's engine comes from `serviceOptions.dbType` (`postgresql`, the default, or
`mongodb`) or from the compile request ([chapter 2](02-compiler-pipeline.md#21-inputs)).
The engine is per service, never per object.

- A compiler **MAY** map `postgresql` to any relational engine and `mongodb` to any
  document engine, and **MAY** support a managed store for either, as long as the
  semantics of this chapter hold. Wire-visible differences (for example the id format) are
  deviations ([chapter 1](01-conformance-model.md#14-documented-deviations-and-adapters)).
- A compiler that does not support an engine **MUST** refuse a service that selects it
  ([chapter 1](01-conformance-model.md#15-profiles-and-compile-time-refusal)).
- An object with `basicSettings.virtual: true` is not stored: no table, no system fields,
  no projection, no events.

## 4.2 Logical names

Names are part of the interface where a client, a migration tool, a shared database or
another service can see them.

| Asset | Rule | `userGroup` in project `shop`, service `order` |
|---|---|---|
| Object name | `basicSettings.name`: one camelCase word, singular | `userGroup` |
| Relational table | English plural of the object name, case kept | `userGroups` (`person` → `people`) |
| Document collection | the object name | `userGroup` |
| Column / field | the property name, unchanged | `ownerId` |
| Service codename | `<projectCodename>-<serviceName>-service`, lower-cased | `shop-order-service` |
| Search projection index | `<projectCodename>_<objectName>`, lower-cased | `shop_usergroup` |
| Change-event topics | [chapter 7](07-event-bus.md) | `shop-order-service-dbevent-usergroup-created` |
| System objects of high-level patterns | `sys_` + owner object + role | `sys_orderPayment` |

- A compiler using a relational engine **MUST** use the table and column names above.
  Rationale: data migration, reporting tools and a shared database depend on them.
- A compiler using a document engine **MUST** use the collection name above.
- Index names (relational) **SHOULD** follow the reference rule: snake case of the
  simply-pluralised object name and the indexed fields, joined by `_`, cut to 63
  characters with a hash suffix when longer (`user_groups_user_id`).
- The search index name **MUST** follow the rule above, because other services read it.

> **To verify:** the reference pluralisation is an English inflector (irregular nouns
> included); a normative word list belongs in the generated tables (S9).

## 4.3 System fields

Every stored object **MUST** have these fields, maintained by the generated system and
never by the blueprint:

| Field | Type | Set when | In API responses |
|---|---|---|---|
| `id` | relational: UUID v4 string; document: 24-hex ObjectId string | insert | yes |
| `createdAt` | timestamp | insert | yes |
| `updatedAt` | timestamp | every write | yes |
| `isActive` | boolean, default `true` | soft-delete objects (4.4) | yes |
| `_archivedAt` | timestamp or null | soft-delete objects, on delete | no |
| `<tenantName>Id` | id | tenant-scoped objects (4.5), on insert | yes |

- There is no version column, no `createdBy` and no owner column added by the system. The
  owner is an authored property marked `isOwnerField` ([chapter 6](06-authorization.md#65-ownership)).
- Timestamps on the wire **MUST** be ISO 8601 strings in UTC with milliseconds
  (`2026-11-12T08:15:30.123Z`).
- Ids of records the system seeds (the root tenant, the first super admin, the admin
  group) **MUST** be fixed values: the reference uses fixed UUIDs, and their first 24 hex
  digits on a document engine.

> **To verify:** the document-engine id form (ObjectId) on every reference target; it is
> confirmed on two of them.

Derived values that the reference keeps beside a record (the owner, the tenant, the
public flag, the ordinal of an enum value) appear in the search projection and in events
but **MUST NOT** appear in API responses ([chapter 5](05-business-apis.md#54-success-envelope)).
Properties marked `hashed` or `isSecret` **MUST NOT** appear in responses, events or the
search projection.

## 4.4 Soft delete

`basicSettings.useSoftDelete` defaults to `true`.

| Operation | Soft-delete object | Other object |
|---|---|---|
| delete | set `isActive = false`, `_archivedAt = now`; the record stays | remove the record |
| read, list, count, update, delete | match only `isActive = true`, unless the query names `isActive` or the API includes archived records | all records |
| create with the unique key of an archived record | a new record with a new id; the archived one is not revived | — |
| search projection | the document is kept and marked archived | the document is removed |
| event | the deleted event carries the archived record | the deleted event carries the removed record |

- Unique indexes on a soft-delete object **MUST** apply to live records only.
- Restoring is an ordinary update that sets `isActive` back to `true`.

Rule example:

```json
{ "objectSettings": { "basicSettings": { "name": "coupon" } },
  "properties": [ { "basicSettings": { "name": "code", "type": "String" },
                    "indexSettings": { "unique": true } } ] }
```

Delete coupon `SPRING`, then create a new coupon `SPRING`: the create succeeds with a new
id. A get API on the old id answers **404**.

> **To verify:** whether a blueprint can ask for a hard delete on a soft-delete object
> (the documentation suggests it; no mechanism was found in the reference).

## 4.5 Tenant scope

In a multi-tenant project ([chapter 6](06-authorization.md#66-tenant-isolation)), an
object with `authorization.objectDataIsInTenantLevel: true` is **tenant-scoped**:

- It **MUST** carry the column `<tenantName>Id` (lower-camel tenant name + `Id`), required
  and indexed. If the blueprint already declares a property of that name, it is used as
  declared.
- On create, the column **MUST** be filled from the request tenant unless the API's data
  clause sets it explicitly.
- Every unique index of the object **MUST** become unique per tenant: `(<tenantName>Id,
  field)`.
- The tenant root object itself is not scoped by a column; its scope is its own `id`.

The tenant filter on reads and writes is part of the authorization model, not of the
data-access operations: it is added by the API to every query
([chapter 6](06-authorization.md#66-tenant-isolation)).

> **To verify:** whether the tenant column of a record may be changed by an update.

## 4.6 Indexes and duplicate handling

| Declaration | Required result |
|---|---|
| `indexSettings.indexedInDb` | an index on the field (a spatial index for geo types) |
| `indexSettings.unique` | a unique index; per tenant (4.5); live rows only (4.4); a duplicate create answers **409** |
| `compositeIndexSettings[]` | a multi-field index; unique unless `onDuplicate` is `doInsert`; `partialWhere` makes it partial |
| geo properties | always a spatial index |

`onDuplicate` on a composite index decides what a create does when a live record with
the same key exists:

| `onDuplicate` | Create result |
|---|---|
| `throwError` (also a single-field `unique`) | **409**, nothing written |
| `stopOperation` | nothing written; the existing record is returned |
| `doUpdate` | the existing record is updated with the new values |
| `doInsert` | the index is not unique; a new record is inserted |

The check applies only when every key field has a value, unless the index declares
`nullsNotDistinct`.

Indexes that help a relational query planner (for example on relation fields) are free.

## 4.7 Property types

The type set is the 16 values of `DataTypes`. The storage type is free; the value
semantics are not:

| Type | Semantics a compiler must keep |
|---|---|
| `ID` | an id string in the engine's id form |
| `String` | text up to `maxLength` (default 255); a longer value **MUST** answer **422** |
| `Text` | unbounded text |
| `Integer`, `Short` | integers of the declared range |
| `Double`, `Float` | floating point |
| `Decimal` | rounded half-to-even to `decimalScale` (default 2) on every write |
| `Boolean` | true or false |
| `Date` | an instant; ISO 8601 UTC on the wire |
| `Enum` | one of `enumOptions`; checked at the API boundary, not by a database constraint |
| `Object` | a JSON value |
| `GeoPoint`, `GeoRoute`, `GeoArea` | GeoJSON geometries in WGS 84 |
| `Blob` | binary |

`isArray` makes a list of the type. `isRequired` makes the field non-null.

> **To verify:** the reference enforces `maxLength` on some targets only; this chapter
> states the stricter rule.

## 4.8 Relations

A property with `relationSettings` references a record of `relationTargetObject`
(`object` in the same service, or `service:object`).

- Nullability comes from the property's `isRequired`, not from `relationIsRequired`.
- On delete of a target record, the compiler **MUST** apply each referencing relation's
  `onDeleteAction` to the referencing records of the **same service**:

| `onDeleteAction` | Effect on referencing records |
|---|---|
| `doDelete` | deleted too (soft or hard, as each object says), each raising its own deleted event |
| `setNull` | the reference is set to null (an update, with its event) |
| `restrict` | the delete is refused with **409** `RELATION_RESTRICTED` if any live referencing record exists outside the set being deleted |
| `doNothing` | nothing |

- `restrict` **MUST** be checked over the whole cascade before anything is deleted.
- An omitted `onDeleteAction` behaves as `doDelete` in the reference.
- Self-references and relations to another service do not cascade.
- The cascade is the generated system's work. A compiler **MAY** use database foreign-key
  actions only if the observable result (including the events per record and soft delete)
  is the same.

> **To verify:** the reference schema documentation asks authors to state `doDelete`
> explicitly; whether the omitted value stays `doDelete` is to be confirmed.

**Joins.** A list or get API may embed related records (`selectJoins`). A local join reads
the service's own store; a join to an object of another service **MUST** read that
object's search projection (4.9), never call the owning service.

## 4.9 Search projection

Every stored object **MUST** have a search projection: a queryable copy of its live and
archived records, under the index name of 4.2, readable by every service of the project.

- The owning service **MUST** update the projection on every create, update and delete,
  before it publishes the change event ([chapter 7](07-event-bus.md)).
- Every non-secret property is part of the projection. Identifier, string and enum values
  are matched exactly; text values are full-text searchable.
- Reads of another service's objects (fetch actions, remote joins, remote statistics,
  membership lookups) **MUST** use the projection and see live records only by default.
- The projection is rebuildable from the store at any time.

The search engine is free ([chapter 1](01-conformance-model.md#13-free-technology)). A
compiler **MAY** answer projection reads from the primary store when the results are the
same.

## 4.10 Data-access operations

Business APIs, actions, expressions and library functions work on records through a
fixed set of operations per object. Library code written by blueprint authors calls them
by name, so the set is part of what a compiler provides.

| Operation (reference name for `Order`) | Effect |
|---|---|
| `createOrder`, `createBulkOrder` | insert with duplicate handling (4.6), projection, event |
| `getOrderById` (one id or a list) | read live records by id |
| `getOrderByQuery`, `getOrderByMQuery` | first live record matching a query |
| `listOrder`, `getOrderListByMQuery`, `countOrder` | paged list and count |
| `updateOrderById`, `updateOrderByIdList`, `updateOrderByMQuery` | update live records; the event carries the previous record |
| `deleteOrderById`, `deleteOrderByQuery`, `deleteOrderByMQuery` | delete with restrict and cascade (4.8) |
| `getOrderStatsByMQuery` | counts and aggregates, optionally bucketed |
| `getNextCodenameForOrder` | next free codename (objects with a codename) |

- A compiler **MUST** provide every operation of this set for every stored object, with
  these semantics, to the code the blueprint carries.
- A compiler **SHOULD** use the reference names in its target language's naming style
  (`createOrder`, `CreateOrderAsync`, `create_order`) and **MUST** document them.
- Every write operation **MUST** keep the system fields, the projection and the events
  consistent, whoever calls it.

The reference provides more operations than this core set: reads by an indexed property,
reads with joins resolved, id lists and id pages, delete-restriction checks, geo reads
for geo properties and a service-wide conditional update. Authored library code calls
them too, so they are part of the library surface
([12.4](12-derived-surface.md#124-library-surface)).

The query language these operations accept (MQuery) is a small, engine-neutral,
document-style filter language. Its definition belongs to the generated tables.

> Generated table goes here (S9): the operation catalogue with signatures, and the MQuery
> operator list.

## 4.11 Caching

`redisEntityCacheSettings` declares a per-record cache. A cache **MUST NOT** change what an
API returns: every write through the operations of 4.10 refreshes or evicts the cached
record. The cache store is free.
