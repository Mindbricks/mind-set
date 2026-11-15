---
title: Data modeling overview
---

# Data modeling overview

A **data model** is the set of persistent entities a service owns, expressed as [`DataObject`](../../spec/DataObject.md) entries under `services[].dataObjects[]`. Each DataObject is far more than a database table: it is a semantic entity that carries its schema (the properties), the rules around it (authorization, validation, ownership, soft delete), its relationships to other objects, and the capabilities the compiler emits from it (caching, indexing, payments, membership, file storage).

An author, whether a person or an AI agent, writes the model as blueprint JSON. That JSON is the only input a compiler reads, and the validator checks it against `openappl.json` before anything is built.

This page is the on-ramp. Each section below is self-contained and links to the dedicated page that covers it in depth.

## What a data model is

A DataObject is a semantic blueprint, not just a DB schema. It simultaneously serves as:

- a **validation framework**: types, required columns, enum constraints, uniqueness;
- the **foundation for the APIs you declare**: properties shape the request and response bodies of the business APIs you author (they are *not* auto-generated; see below);
- the basis for **access control**: object-level authorization, ownership, tenancy, membership;
- the **source of truth for cross-service contracts**: relations and Elasticsearch read-replicas let other services reference this object;
- a **compile input**: the model drives the generated persistence layer, the data-access helpers, the Kafka topics and the Elasticsearch indices.

See [Data objects](data-objects.md) for the full DataObject shape and [DataObject capabilities](object-capabilities.md) for everything a DataObject can emit.

## How a data model founds services and APIs

The model is the spine of a service. From it:

1. **Service structure**: the DataObjects define what the service stores and owns.
2. **API shape**: when you declare a business API in `businessLogic[]`, the object's properties inform its request parameters and response body. There is no auto-CRUD: every API is author-defined. Properties tell you *what fields exist to expose*, not *which APIs exist*.
3. **Validation layer**: `isRequired`, `type`, `enumOptions`, and uniqueness are enforced at write time regardless of which API performs the write.
4. **Business logic**: actions, computed values, and state transitions are composed per API against the object's fields.
5. **Cross-service communication**: relations (including qualified `serviceName:objectName` relations) and the per-object Kafka events let other services read and react to this object.

See [Business APIs overview](../business-apis/overview.md) for the explicit API model.

## The property model at a glance

A property is a [`DataProperty`](../../spec/DataProperty.md) with a required `basicSettings` block (the DB shape) plus optional blocks that activate by **block presence**: populate the block and the capability turns on.

| Block | Activates | Effect |
|-------|-----------|--------|
| `basicSettings` | always | name, `type`, `isRequired`, `isArray`, `enumOptions`, `defaultValue`. |
| `relationSettings` | populate the block (set `relationTargetObject`) | foreign-key relationship to another object. |
| `sessionSettings` | set `sessionParam` | the service injects `session[sessionParam]` when the object is the main data object of a create API (not on update, not on a `CreateCrudAction` / `CreateBulkCrudAction` nested create). `isOwnerField: true` marks the ownership field. |
| `staticJoin` | set `jointSource` | resolve a value from another object at write time and store it statically. |
| `indexSettings` | populate the block | DB / Elasticsearch index + uniqueness. |
| `decisionSource` | populate the block | a decision provider decides the value at write time. |

`sessionSettings` and `staticJoin` are auto-binding hooks: a value populated from one is not declared on any API. They are mutually exclusive on a single property.

Two flags are commonly misread:

- **`isRequired` = DB NOT-NULL only.** It says the persisted column may not be null; it does *not* decide whether the caller must supply the value. Whether the caller must send it is a per-API `requestParameters[].required` decision. A value can reach a NOT-NULL column from a request binding, a session inject, a static join, or a `defaultValue`.
- **`defaultValue` = a scalar DB default only.** Use it for static literals (`"pending"`, `0`, `false`). Computed defaults (`new Date()`, `LIB.<fn>(...)`) belong in a per-API `dataClauseItems` MScript entry, not on the property.

See [Property types](property-types.md) for the full type catalogue and [How a Property value is populated](property-types.md#how-a-property-value-is-populated) for the value-source model.

## Relations

A relation is a typed reference from one object to another, declared by populating [`relationSettings`](../../spec/PropertyRelation.md) on the property carrying the foreign key. There is no separate "has a relation" flag: populating the block (with `relationTargetObject` set) *is* the relation. A relation is consumed across the whole service (joins, joint filters, parent-ownership checks, aggregates, cross-service reads), not just as a FK column.

See [Relations](relations.md).

## Two database engines

Every DataObject can be compiled for both supported engines, selected per service by `serviceOptions.dbType`:

- **PostgreSQL**: a table with columns, SQL constraints, indexes and migrations.
- **MongoDB**: a collection with schema fields and schema-driven indexes.

MongoDB is a first-class alternative, not a fallback. The data-modeling pages describe both engines side by side wherever an engine-specific artifact (column type, index, constraint) is involved. See [Db layer](db-layer.md) for what the generated data-access layer guarantees on either engine.

## Lifecycle

A row moves through created, validated, persisted, retrieved, updated, deleted. That lifecycle runs through the CRUD-shaped business APIs **you declare** for the object (not auto-generated ones). Domain state (`draft`, `published`, `archived`) is modeled as an `Enum` property changed by your APIs; soft delete and timestamps are managed by the service; every create, update and delete emits a Kafka event.

See [Lifecycle and state](lifecycle-and-state.md).

## Multi-tenancy

Tenancy is switched on once for the project, on the [`LoginDefinition`](../../spec/LoginDefinition.md). Each object then opts in with `objectSettings.authorization.objectDataIsInTenantLevel: true`: it gets a `<tenantName>Id` column and is auto-filtered by the session's tenant id. The data slice lives in [Multi-tenancy](multi-tenancy.md); the full guide is [Multi-tenancy (capabilities)](../capabilities/multi-tenancy.md).

## Where to go next

- [Data objects](data-objects.md): the full `DataObject` shape.
- [DataObject capabilities](object-capabilities.md): what each block emits (membership, payments, cache, buckets).
- [Property types](property-types.md): the `DataTypes` catalogue and the value-population model.
- [Relations](relations.md), [Indexes](indexes.md), [Lifecycle and state](lifecycle-and-state.md).
- [Db layer](db-layer.md): what the generated data-access layer guarantees.
- [Remote buckets](../composition/remote-buckets.md) and [DB buckets](../composition/db-buckets.md): file storage as a data pattern.
- [Business APIs overview](../business-apis/overview.md): the explicit API model that consumes the data model.
