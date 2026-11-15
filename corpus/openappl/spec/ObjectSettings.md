# ObjectSettings

**Level:** `chapter` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [ObjectSettings in Part 1](../ontology/ObjectSettings.md)

Configuration settings that govern the behavior, access control, and optimization strategies of a data object. These settings allow fine-grained control over how the data object behaves in terms of authorization, caching, indexing, payment processing, ledger accounting, and membership relationships. This is the central point to define how the object integrates with infrastructure and security policies in a microservice.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basicSettings` | [`ObjectBasicSettings`](./ObjectBasicSettings.md) | yes |  |  |  | Core definitions of the data object such as its name, label, and description. These settings influence how the object appears in documentation and interfaces. |
| `authorization` | [`ObjectAuthorization`](./ObjectAuthorization.md) | no |  |  |  | Rules and permissions that control access to this data object. These object-level rules enhance or override project-level authorization to implement fine-grained security models. Optional — omit (or null) when unused; never []. |
| `redisEntityCacheSettings` | [`RedisEntityCacheSettings`](./RedisEntityCacheSettings.md) | no |  |  |  | Configuration for enabling Redis-based entity-level caching. Useful for frequently accessed, lightweight records that benefit from high-speed lookups and smart cache invalidation. Optional — omit (or null) when unused; never []. |
| `compositeIndexSettings` | [`CompositeIndex`](./CompositeIndex.md)[] | no |  |  |  | Defines one or more composite indexes to ensure uniqueness across multiple fields and improve the efficiency of compound queries. This is especially critical for enforcing business constraints or query performance in relational databases. Please note that if you need unique constraints on a single field, you can use the `unique` property of the DataProperty instead. |
| `checkout` | [`Checkout`](./Checkout.md) | no |  |  |  | Provider-neutral one-time-payment activation for this data object. When enabled, the framework auto-generates the sys_<X>Payment system data object and the start/refresh/callback APIs, routed through the PaymentProvider named in `configuration.providerName`. This is the recommended shape for one-time-payment objects, binding to any configured PaymentProvider. Optional — omit (or null) when unused; never []. |
| `subscription` | [`Subscription`](./Subscription.md) | no |  |  |  | Provider-neutral subscription activation for this data object. When enabled, the framework treats this object as a recurring-billing entity, generates sys_<X>Subscription and sys_<X>SubscriptionPlan tables, and emits subscribe/cancel/update APIs. Requires the bound PaymentProvider to support subscriptions. Optional — omit (or null) when unused; never []. |
| `marketplace` | [`Marketplace`](./Marketplace.md) | no |  |  |  | Provider-neutral marketplace activation for this data object. When enabled, the framework generates sys_<X>ConnectedAccount and sys_<X>Payout tables and wires the KYC / transfer / payout APIs. Requires the bound PaymentProvider to support marketplace. Optional — omit (or null) when unused; never []. |
| `invoicing` | [`Invoicing`](./Invoicing.md) | no |  |  |  | Provider-neutral accounts-receivable invoicing activation for this data object. When enabled, the framework treats this object as an invoice-bearing entity: the invoice ledger (sys_<X>Invoice and satellites) and the issue/finalize/void/apply-payment surface are generated around it, bound to the InvoiceProvider named in `configuration.providerName` — or to the framework-internal provider when that is null. Invoicing is a SEPARATE axis from checkout: checkout moves money, invoicing produces the billing document; both can be active on the same object with different providers. Optional — omit (or null) when unused; never []. |
| `fiscalization` | [`Fiscalization`](./Fiscalization.md) | no |  |  |  | Regulatory fiscalization activation for this data object. When enabled, the framework treats this object as the source of fiscal documents (e-invoice, e-archive, fiscal reports): the sys_<X>FiscalDocument ledger and the submit/track surface are generated around it, routed through the FiscalProvider named in `configuration.fiscalProviderName` and the jurisdiction's fiscal policy module. Fiscalization is a SEPARATE axis from invoicing: invoicing produces the commercial billing document, fiscalization adapts it to (or reports it into) the government's fiscal infrastructure — and in reporting-style regimes the fiscalized thing may be transaction data with no invoicing block at all, so this block does NOT require `invoicing` on the same object. Optional — omit (or null) when unused; never []. |
| `membershipSettings` | [`MembershipSettings`](./MembershipSettings.md) | no |  |  |  | Settings to enable access control for this object through an external membership relationship. This object represents the protected resource (such as a project), and access to it is managed by another object (such as projectMember) that links users or roles to this resource. Useful in multi-user collaboration domains where permissions are scoped per resource instance. Optional — omit (or null) when unused; never []. |
| `ledgerSettings` | [`LedgerSettings`](./LedgerSettings.md) | no |  |  |  | Append-only-ledger activation for this data object. When enabled, every ROW of this object owns a ledger of integer value (points, credits, cents, stock units): the framework generates the satellite lot/movement(/reservation) objects and the earn/consume/reserve/commit/release/getBalance/listEntries/adjust API roster, bound to the owner row by a single FK. Requires a relational dbType on the owning service. Optional — omit (or null) when unused; never []. |
| `graphProjection` | [`GraphProjection`](./GraphProjection.md) | no |  |  |  | Opt-in graph-database projection for this DataObject (docs/ADR-graph-database-layer.md §3/§4b). When populated, the object is projected into the named graph provider — either as a NODE (set `labels` + `projectedProperties`, the object-level analogue of the property-level `indexedInElastic` flag) or as an EDGE (set `projectsAsEdge` when the object's rows ARE relationships, e.g. a permissionGrant join/grant table). A projection is node-shaped OR edge-shaped, never both. The graph is a secondary, rebuildable projection over the relational source of truth, synced on write like the ES projection. Leave null/absent when the object is not projected. |
| `enterpriseProjection` | [`EnterpriseProjection`](./EnterpriseProjection.md) | no |  |  |  | Opt-in projection of this DataObject onto an EnterpriseObject declared in enterpriseHub. When populated, this object mirrors an external business object on an enterprise platform (SAP, Salesforce, …): `enterpriseModelName` + `enterpriseObjectName` name the asset, `fieldMap` maps this object's properties to the platform's fields, and `syncMode` decides the data-flow direction (readThrough / pullMirror / writeThrough / bidirectional). The mcpbff bridge does the actual platform I/O; this block is the design-time binding. Leave null when the object is purely local. NOTE: defining an EnterpriseObject in enterpriseHub does NOT require a projection — this is the optional step that also stores it locally. |
| `geoSettings` | [`ObjectGeoSettings`](./ObjectGeoSettings.md) | no |  |  |  | Settings for the generated /geo REST surface of this data object's geo-typed properties (GeoPoint, GeoRoute, GeoArea). The four spatial routes (inCircle, mostClose, inBBox, inPolygon) honor `authorization.dataObjectAccess` — a non-accessPublic object refuses anonymous callers — and this block adds a designer-declared visibility filter applied on top of that gate. Optional — omit (or null) when unused; never []. |
| `objectModeration` | [`ObjectModeration`](./ObjectModeration.md) | no |  |  |  | Content moderation for this data object's writes. When `enabled`, every create and update of this object by a moderated caller is judged by a calibrated decision provider against the designer's `policy` before it becomes visible, and every submission is recorded in a framework-generated `sys_<X>ModerationReview` object that reviewers work through injected Business APIs. In the default `staged` mode an unapproved write never reaches the real object at all. This is CONTENT moderation, not authorization: the verdict never feeds a permission check. Use this block as THE answer to "this project needs moderation"; a hand-authored moderation service is the exception for edge cases the pattern does not cover. Optional - omit (or null) when unused; never []. |
| `visitTracking` | [`VisitTracking`](./VisitTracking.md) | no |  |  |  | Object visits, the object-level SINK of the visits pattern (docs/ADR-object-visits-pattern.md). When `enabled`, the framework records who consumed a row of this object, how (access / view / read / seen) and when, as the analytics fact table `sys_<Obj>Visit`, and can keep a quiet counter column and per-actor read state. WHICH call is a visit is declared on the BusinessApi (`apiOptions.visitSettings`), never here: an enabled visitSettings on an api whose object declares no enabled visitTracking is a design-time error (VISIT_TRACKING_NOT_DECLARED). Analytics-first: the event history is the product, read state is one by-product of it. A visit is an engagement signal, never an authorization, filtering or billing input. Optional - omit (or null) when unused; never []. |
| `recommendationSettings` | [`RecommendationSettings`](./RecommendationSettings.md) | no |  |  |  | Recommendation lists of this object as the ITEM being recommended (docs/ADR-recommendation-engine.md). Each list names a relation (bought together, viewed together, trending, ...) and the evidence that feeds it; the interactions come from sources the patterns publish (discovered automatically, e.g. a catalog-bound shopping cart) or from sources declared here. A generated refresh cron precomputes tenant-scoped neighbor / popularity tables, and the lists are served under this object's own routes, on the item's own service, behind the item's read gate. Filters are deterministic and re-applied at serve time; a recommendation score never feeds authorization or filtering. Optional - omit (or null) when unused; never []. |
| `defaultChoice` | [`DefaultChoice`](./DefaultChoice.md) | no |  |  |  | A DEFAULT row of this object (pattern DefaultChoice): a default address, a default saved card, a default shipping company. When `isActive`, the framework adds an `isDefault` column with a one-default-per-scope invariant, makes the first row of a scope its default, promotes the newest remaining row when the default is deleted, and injects the set<Object>AsDefault / getDefault<Object> / set<Object>AsDefaultForUser / getDefault<Object>ForUser apis. `inline` (the default) keeps the default on the user's own rows (one per owner, or per `scopeField`); `inline: false` makes it a system default plus a per-user override table `sys_UserDefaultFor<Object>`. `isDefault` is never writable through the object's generic create / update apis. Optional - omit (or null) when unused; never []. |

## Constraints

Property rules:

- `basicSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `compositeIndexSettings` must have distinct names (`indexName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Example

Use ObjectSettings to declare a data object's identity, access control, indexing, and infrastructure opt-ins (caching, payments, ledger, membership) in one place. This example configures a tenant-scoped, privately-accessed order object with Redis entity caching and a unique composite index.

```json
{
  "basicSettings": {
    "name": "order",
    "description": "A customer order with line items and a lifecycle status.",
    "useSoftDelete": true
  },
  "authorization": {
    "objectDataIsInTenantLevel": true,
    "dataObjectAccess": "accessPrivate"
  },
  "redisEntityCacheSettings": {
    "useEntityCaching": true
  },
  "compositeIndexSettings": [
    {
      "indexName": "tenantOrderNumberIndex",
      "indexFields": [
        "orderNumber"
      ],
      "onDuplicate": "throwError"
    }
  ]
}
```
