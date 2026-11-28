---
title: FetchObjectAction
---

# FetchObjectAction

Loads one or more records from a target data object and stores them on the workflow context. Supports the simple key-equality form (`matchValue` + `localKey`) and an advanced `whereClause` form. Optionally enforces existence (404 on miss) and projects a subset of properties.

This is the canonical read action: most workflows include at least one `FetchObjectAction` to load the parent or sibling rows the rest of the workflow operates on.

## When to use it

- Load a parent / sibling row by id (or another unique key) before validation, response shaping, or downstream writes.
- Enforce existence: combine `isArray: false` + `isRequired: true` to short-circuit the API with a 404 when the row is missing.
- Pull a small projection (`properties` array) on a hot path to avoid hydrating large rows.
- For elastic / keyword queries use [`SearchObjectAction`](./search-object-action.md). For raw aggregations use [`FetchFromElasticAction`](./fetch-from-elastic-action.md). For in-memory joins between already-fetched arrays use [`CollateListsAction`](./collate-lists-action.md). For walking up a parent chain use [`FetchParentAction`](./fetch-parent-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `targetObject` | `DataObjectName` | yes | Data object to read. A local object (bare name, or prefixed with this service's name) reads the service's own database. A `service:object` target naming another service, or a bare name that is not one of this service's objects, reads that object's Elasticsearch projection instead (see [Cross-service reads](#cross-service-reads)). |
| `matchValue` | `MScript` | no | Expression yielding the key value to match against `localKey`. |
| `localKey` | `PropRefer` | no | The target object's property to match against. Must be unique / indexed. There is no default: the match term is emitted only when BOTH `matchValue` and `localKey` are set, and authoring `matchValue` without `localKey` is rejected by validation (`FETCH_MATCH_VALUE_WITHOUT_LOCAL_KEY`). "Authored" means a language source carries something: an absent slot, `null` and the untouched multilanguage envelope an editor scaffolds (`{ "js": null, "java": null, ... }`) all count as EMPTY, so an untouched section is never rejected. |
| `whereClause` | `MScript` | no | Advanced query. When provided, it is merged with the `matchValue` + `localKey` form (if both are set, the key equality is added to the where-clause query). |
| `properties` | `PropRefer[]` | no | Subset of fields to return. Empty / omitted means all fields. Dot notation supported for nested fields. |
| `isArray` | `Boolean` | no | When true, return a list. When false (default), return a single object. |
| `isRequired` | `Boolean` | no | When true and `isArray: false`, a null result throws a 404. Honours `onActionError`: set it to `completeApi` to suppress the abort. |
| `notFoundMessage` | `String` | no | The message of the 404 a required single fetch answers when it finds nothing (`Patient profile not found` instead of `<targetObject> not found`). A plain string, not MScript; unset keeps the generated message. Read only with `isRequired: true` and `isArray: false` (an `INERT_OPTION` warning otherwise). |

## Behaviour

The action builds a query, then reads through the service's data layer:

- **Query build**: starts from `whereClause` (when set), then assigns `query[localKey] = matchValue` (when both set).
- **`isArray: false`**: reads a single row by the query. When `isRequired: true` and the result is null, throws `ApiError(404, '<targetObject> not found')`, or `ApiError(404, <notFoundMessage>)` when `notFoundMessage` is set.
- **`isArray: true`**: reads the list matching the query and returns the rows.
- **`properties`**: when non-empty, projects each row through a whitelist of property names before returning.

The result is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true.

**When the fetch resolves nothing.** An optional single fetch that returns `null`, or a list fetch that returns `[]`, logs one `info` line `FetchActionResolvedNothing` per occurrence. `info` is the service's default log level, so the service log shows it. The line is not logged when the action throws (a required single fetch answers 404), or when a cross-service read was not answered: `RemoteFetchNotAnswered` already names that occurrence. Fields:

| Field | Meaning |
|---|---|
| `requestId` | The request the line belongs to. |
| `action`, `object` | The action name and the target object. |
| `source`, `sourceService` | `local` or `remote`. `sourceService` is present on a cross-service read only. |
| `shape` | `single` or `list`. |
| `localKey`, `matchExpression` | The authored `localKey` and `matchValue` expression; `null` when the action has no `matchValue`. |
| `matchValueState`, `matchValueType` | `undefined`, `null` or `present` for the evaluated match value (`none` when the action has no `matchValue`), and its runtime type name (`null` when no `matchValue` is declared). `undefined` means the expression itself resolved nothing, for example a misspelled loop-item or session reference. `present` means a value was evaluated and no row matched it. |
| `hasWhereClause` | Whether the action declares a `whereClause`. |

The line never prints the match value, a row or the query.

**A moderated target.** When `targetObject` carries [`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`, the moderation read gate is conjoined onto the query (local and cross-service alike), with the calling request's identity: a non-privileged caller reads `accepted` rows plus their own, so a hidden row is absent (`null`, or `404` under `isRequired: true`). See [the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

### Cross-service reads

A cross-service target is read from the owning service's Elasticsearch projection. The query is built the same way, including the tenant term. Three rules follow from reading the projection:

- The read is active-only, like the local one. A soft-deleted row keeps its projection document, archived (`isActive: false`), and the read excludes it unless the query names `isActive` itself or the API declares [`apiOptions.includeSoftDeleted: true`](../../spec/ApiOptions.md) and the target soft-deletes, in which case the read includes archived rows.

- Every DataObject is projected whatever its `dataObjectAccess`. That setting, and the owning service's `authOptions.ownershipCheck`, do not narrow this read: an `accessPrivate` object is readable. Put any owner or status condition in `whereClause`. When the owner's access rules must apply, or the read must see the database, call the owning service's Business API with an [`InterserviceCallAction`](./interservice-call-action.md) instead.
- A read the projection could not answer is never reported as "row absent". The action logs `RemoteFetchNotAnswered` with a `reason` (`elastic-not-configured`, `invalid-arguments`, `query-conversion-failed`, `projection-index-missing`, `transport-error`). It then throws `ApiError(503)` when `isRequired: true`, and leaves the context `null` / `[]` otherwise. An array read that reaches the index's result window is not such a failure: it keeps the rows read and logs `RemoteFetchResultWindowReached` (reason `result-window`). The reasons mean: Elasticsearch is not configured for the service, the arguments were invalid, the query could not be converted to the projection's query form, the projection index is missing, or the transport to the index failed.

## Example

**Simple key lookup with existence enforcement:**

```json
{
  "name": "loadOrder",
  "writeToResponse": false,
  "contextPropertyName": "order",
  "targetObject": "Order",
  "matchValue": { "js": "this.orderId" },
  "localKey": "id",
  "isArray": false,
  "isRequired": true
}
```

A miss surfaces as a 404 to the client.

**Advanced query with a projected subset:**

```json
{
  "name": "draftOrdersThisWeek",
  "writeToResponse": true,
  "contextPropertyName": "drafts",
  "targetObject": "Order",
  "whereClause": { "js": "({ status: 'draft', createdAt: { $gte: this.weekStart }, ownerId: this.session.userId })" },
  "properties": ["id", "createdAt", "total", "currency"],
  "isArray": true
}
```

Only the four named fields are returned: useful for list views that don't need the full row.

## Errors

- `isRequired: true` with a null single-row result throws `ApiError(404, ...)`. Use `onActionError: "completeApi"` to expose it as `this.<actionName>Error` instead of aborting.
- A malformed `whereClause` throws at the data layer.
- A cross-service read the projection could not answer throws `ApiError(503, 'Cannot fetch <object> from <service>: <reason> ...')` when `isRequired: true` (see [Cross-service reads](#cross-service-reads)).
- An unknown `targetObject` (or one not reachable) is flagged at project-validation time.
- An optional single-row fetch (`isRequired: false`, the default, with `isArray: false`) leaves `this.<contextPropertyName>` `null` when no row matches. A later action that reads a field off it with no null guard (`this.product.stock`, or `line.product.stock` inside the same LoopAction) is flagged at design time with the WARNING `OPTIONAL_FETCH_RESULT_READ_UNGUARDED`. Guard the read (`this.product?.stock` or a null test), put a `condition` that tests the value on the consuming action, or set `isRequired: true` when a missing row is an error.

## See also

- [`FetchParentAction`](./fetch-parent-action.md): walk up a relation chain
- [`SearchObjectAction`](./search-object-action.md): keyword + filter via Elastic
- [`FetchFromElasticAction`](./fetch-from-elastic-action.md): raw Elastic queries
- [`CollateListsAction`](./collate-lists-action.md): in-memory join between fetched arrays
- [`FetchStatsAction`](./fetch-stats-action.md): aggregate counts and sums
