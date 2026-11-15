---
title: DataObject capabilities
---

# DataObject capabilities

A [`DataObject`](../../spec/DataObject.md) is more than a database table. Populating a block under `objectSettings` (or on a property) makes the compiler **emit whole subsystems**: payment tables and APIs, a membership access layer, a Redis cache, composite indexes, file-upload routes, session-aware binding, and more.

This page is a capability catalogue. Use it for discovery: if you are building a feature ("I want a membership system", "I want paid orders"), find the capability here, learn which block activates it and what it emits, then follow the link to the deep page. It does not duplicate those pages; it is the index that ties them together.

## Recipe to capability lookup

| You want... | Activate | Where |
|-------------|----------|-------|
| A membership / access-control system around a resource | `objectSettings.membershipSettings` (`hasMembership: true`) | [Membership](#membership-membershipsettings) |
| Paid one-time orders | `objectSettings.checkout` | [Payments](#payments-checkout-subscription-marketplace) |
| Recurring subscriptions | `objectSettings.subscription` | [Payments](#payments-checkout-subscription-marketplace) |
| Marketplace payouts to sellers | `objectSettings.marketplace` | [Payments](#payments-checkout-subscription-marketplace) |
| Object-level access rules (private / protected / public) | `objectSettings.authorization` | [Authorization](#object-level-authorization) |
| A hot-record cache | `objectSettings.redisEntityCacheSettings` | [Redis entity cache](#redis-entity-cache) |
| Moderate what users write before it is published | `objectSettings.objectModeration` (`enabled: true`) | [Content moderation](#content-moderation-objectmoderation) |
| Multi-field unique / compound indexes | `objectSettings.compositeIndexSettings[]` | [Composite indexes](#composite-indexes) |
| Soft delete (tombstone instead of remove) | `basicSettings.useSoftDelete: true` | [Soft delete](#soft-delete) |
| Owner-scoped data ("only my rows") | property `sessionSettings.isOwnerField: true` | [Session-aware binding](#session-aware-binding) |
| Auto-fill `userId` / the tenant id from the session | property `sessionSettings` | [Session-aware binding](#session-aware-binding) |
| Copy a value from a related object at write time | property `staticJoin` | [Static join](#static-join) |
| A foreign-key relationship | property `relationSettings` | [Relation](#relation) |
| File uploads attached to a record | a [bucket](#file-storage-buckets) on the service | [File storage](#file-storage-buckets) |
| Hold user-written content until it is accepted | `objectSettings.objectModeration` | [Object content moderation](../capabilities/object-moderation.md) |
| A column whose value is a judgement (category, priority, needs-review) decided at write time | property `decisionSource` | [Decided value](#decided-value) |

## Object-level capabilities

Set under `objectSettings`. The [`ObjectSettings`](../../spec/ObjectSettings.md) specification page is authoritative.

### Object-level authorization

**Block:** `authorization` ([`ObjectAuthorization`](../../spec/ObjectAuthorization.md)). **Emits:** access rules woven into *every* business API on the object. `dataObjectAccess` sets the baseline visibility (`accessPrivate`, `accessProtected`, `accessPublic`); `objectDataIsInTenantLevel` makes the object tenant-scoped so reads and writes are auto-filtered by the session tenant. Pair with `membershipSettings` for resource-level sharing. See [Multi-tenancy](multi-tenancy.md), [Permissions strategy](../best-practices/permissions-strategy.md).

### Redis entity cache

**Block:** `redisEntityCacheSettings` ([`RedisEntityCacheSettings`](../../spec/RedisEntityCacheSettings.md)). **Emits:** an entity-level Redis cache layer with smart invalidation for hot, lightweight records: reads hit Redis first and writes invalidate the cached entry. See [Redis entity caching](../composition/redis-entity-caching.md).

### Composite indexes

**Block:** `compositeIndexSettings[]` ([`CompositeIndex`](../../spec/CompositeIndex.md)). **Emits:** multi-column DB indexes and, when `onDuplicate: "throwError"`, multi-column uniqueness constraints. For single-field uniqueness use the property's `indexSettings.unique` instead. See [Indexes](indexes.md).

### Payments: checkout / subscription / marketplace

Payments are **provider-neutral**: each block binds to a configured `PaymentProvider` named in its `configuration.providerName`, matching an entry in `projectSettings.paymentProvidersSettings.paymentProviders[]`.

| Block | Capability | What the compiler emits |
|-------|-----------|-------------------------|
| `checkout` ([`Checkout`](../../spec/Checkout.md), `objectIsAnOrderObject: true`) | One-time payments | A `sys_<X>Payment` system data object + start / refresh / callback APIs, routed through the named provider. |
| `subscription` ([`Subscription`](../../spec/Subscription.md), `objectIsSubscriptionObject: true`) | Recurring billing | `sys_<X>Subscription` + `sys_<X>SubscriptionPlan` tables + subscribe / cancel / update APIs (needs a provider that supports subscriptions). On a tokenized provider the opt-in also emits the `sys_<X>Payment` ticket table and the payment intent machine, with no checkout API, so the recharge scheduler's tickets are reconciled by the provider webhook. |
| `marketplace` ([`Marketplace`](../../spec/Marketplace.md), `objectIsMarketplaceObject: true`) | Marketplace payouts | `sys_<X>ConnectedAccount` + `sys_<X>Payout` tables + KYC / transfer / payout APIs (needs a provider that supports marketplace). |

`configuration.lifecycleHooks[]` lets you attach MScript handlers that fire as the payment state machine advances. See [Payment workflow](../capabilities/payment-workflow.md).

### Membership (`membershipSettings`)

**Block:** `membershipSettings` ([`MembershipSettings`](../../spec/MembershipSettings.md), `hasMembership: true`). **Emits:** automatic membership and access logic. The object becomes a protected resource whose access is governed by a separate **linking object** (for example `projectMember`) that maps users and roles to instances of the resource. This is the "wrap a DataObject with automatic membership" capability, the answer to "I want to build a membership system". Access checks, ownership through the link, and the membership filter are all generated. See [Membership](../composition/membership.md) and [Permission and membership filters](../composition/permission-and-membership-filters.md).

### Content moderation (`objectModeration`)

**Block:** `objectModeration` ([`ObjectModeration`](../../spec/ObjectModeration.md), `enabled: true`). **Emits:** a decision-provider verdict (`accept` / `reject` / `review`) on every create and update api of the object, a `sys_<X>ModerationReview` queue with reviewer accept and reject apis and the author's own-submissions list, and, in `mode: onPlace`, a managed `moderationStatus` column with a read gate that hides unapproved rows from everyone but their author and the reviewers. In the default `mode: staged` a held write answers `202` and the real row is only written on accept. See [Object content moderation](../capabilities/object-moderation.md).

### Soft delete

**Flag:** `basicSettings.useSoftDelete: true`. **Emits:** `delete<X>` flips an `isActive` flag instead of removing the row; list APIs exclude inactive rows by default. See [Lifecycle and state](lifecycle-and-state.md#soft-delete).

## Property-level capabilities

Set on a single property. The [`DataProperty`](../../spec/DataProperty.md) specification page is authoritative.

### Session-aware binding

**Block:** `sessionSettings` (set `sessionParam`). **Emits:** when this object is the main data object of a create API, the service injects `session[sessionParam]` into the column; the value is not declared in that API's `requestParameters` or `dataClauseItems`. Updates do not refresh it, and a row created by another API's `CreateCrudAction` / `CreateBulkCrudAction` is not filled from it: map the column there explicitly (see [Write-time data composition](../composition/write-time-data-composition.md)). Use for `userId`, the tenant id, audit columns. Setting `isOwnerField: true` marks the property as the ownership field used by owner-based access checks ("only my rows"). See [Session-aware logic](../composition/session-aware-logic.md).

### Static join

**Block:** `staticJoin` (set `jointSource`). **Emits:** at create time the service resolves a value from another data object (via `jointForeignKey` to `jointSourceKey`, reading `jointRead`) and stores it statically on this row. Use for values that should not change over the row's lifetime. See [Static joins](../composition/static-joins.md).

### Relation

**Block:** `relationSettings` (set `relationTargetObject`). **Emits:** a foreign-key relationship: FK column, join wiring, and relation-based fetches and filters across the service. See [Relations](relations.md).

### Index and uniqueness

**Block:** `indexSettings`. **Emits:** `indexedInDb` (DB index), `unique` (uniqueness constraint), `indexedInElastic` (Elasticsearch mapping for list and search and DataView filters), plus Redis cache-key hooks. See [Indexes](indexes.md).

### Enum constraint

**Setting:** `basicSettings.type: "Enum"` + `enumOptions`. **Emits:** a value vocabulary checked when an api writes the property, and a filterable keyword field. The storage is a plain short string with no database-level constraint of its own. See [Property types: Enum](property-types.md#enum).

### Filterability

**Flag:** `basicSettings.isFilterParameter: true`. **Emits:** exposes the property as a list-API filter parameter.

### Decided value

**Block:** `decisionSource` (set `providerName`, `state`, `question`). **Emits:** on create, and on an update that writes one of its `recomputeOn` properties, a decision provider answers one typed question about the row; the value is stored with `<prop>DecisionConfidence`, `<prop>DecidedBy`, `<prop>DecidedAt` and `<prop>DecisionOverridden` companion columns, and a background backfill decides rows the provider could not. A compiler may support it for only some target languages. See [Property types: decided properties](property-types.md#decided-properties-decisionsource) and [The decision layer](../capabilities/decision-layer.md#decisionsource-write-time-columns).

### Scalar default

**Setting:** `basicSettings.defaultValue`. **Emits:** a DB column default for NOT-NULL safety. Dynamic defaults belong in per-API `dataClauseItems` instead; see [How a Property value is populated](property-types.md#how-a-property-value-is-populated).

## File storage (buckets)

File storage is a **data pattern on the service**, not a separate bucket service. Declaring a bucket emits a metadata data object plus upload, download and presign routes mounted into the owning service:

- **Remote bucket**: bytes live in a cloud provider (S3 / R2 / any S3-compatible endpoint / GCS / Azure); only metadata is stored locally. See [Remote buckets](../composition/remote-buckets.md).
- **Native bucket**: bytes live in an object store the hosting platform manages, with no cloud account or credentials, which suits on-prem and data-sovereignty needs. See [Native buckets](../composition/native-buckets.md).
- **DB bucket**: bytes live in the service database (`BYTEA` / binary buffer) alongside the metadata, transactional with the row. See [DB buckets](../composition/db-buckets.md).

Pair a bucket with a data object via its `ownerDataObject` block to get "list / cascade files for this record". The provider catalogue lives once at `projectSettings.bucketProvidersSettings`.

## See also

- [Data modeling overview](overview.md): the property model on-ramp.
- [Data objects](data-objects.md): the full `DataObject` shape.
- [Property types](property-types.md), [Relations](relations.md), [Indexes](indexes.md), [Lifecycle and state](lifecycle-and-state.md).
- Specification: [`ObjectSettings`](../../spec/ObjectSettings.md), [`DataProperty`](../../spec/DataProperty.md).
