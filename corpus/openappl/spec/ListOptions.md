# ListOptions

**Level:** `section` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListOptions in Part 1](../ontology/ListOptions.md)

Behavioral options for Business APIs of type `list`. These control sorting, grouping, filtering, and caching logic.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `QueryCache` | `const { QueryCache } = require("common")` | One cached list answer of `listOptions.queryCache`: `new QueryCache(objectName, clusters, identity, whereClause)`, read with `readQueryResult()`, written with `writeQueryResult(data, ttlSeconds?)`. | nodejs |
| `QueryCacheInvalidator` | `const { QueryCacheInvalidator } = require("common")` | Flush the `listOptions.queryCache` answers a write can have changed: `new QueryCacheInvalidator(objectName, clusters)` then `invalidateCache(row)` or `invalidateAll()`. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `totalCount` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript for list APIs only, evaluated after afterMainListOperation. Returns a finite non-negative integer, including 0, preferred over the database count. The row producer owns requested-page selection; this does not slice rows or change ListMapAction.replacesResult (a 1:1 map). topPick caps the declared total; paginationOptions.unpaged:true retains returned-row accounting. Cursor mode is incompatible. Query cache stores the main result; this expression runs again after post-main actions on hits and misses. |
| `listSortBy` | [`SortByItem`](./SortByItem.md)[] | no |  |  |  | Sort order definitions for the result set. Multiple fields can be provided with direction (asc/desc). This is the static default order; to let a declared request parameter pick one of several named orders per request, declare `listOrderSets` + `listOrderSelector`. |
| `listOrderSets` | [`ListOrderSet`](./ListOrderSet.md)[] | no |  |  |  | Named alternative orders for this list, each `{ key, sortBy: SortByItem[] }`. At request time the value of the declared request parameter named by `listOrderSelector` is matched against the keys and the matching set's `sortBy` becomes the row order; a value that matches no key (or an absent value) falls back to `listSortBy`. Every property named in a set must exist on the api's data object. A unique `id ASC` tie-break is appended to whichever order is chosen so equal keys page stably. Honoured on the sequelize and mongo list paths, on a DataView (Elasticsearch) list, and in the query-cache identity (a different selected order is a different cache entry). Precedence when `runtimeFilters.sortEnabled` is also on: a selector value that matches a key wins; otherwise a runtime `?sortBy=` naming an allowed field applies; otherwise `listSortBy`. Requires `listOrderSelector`. Honoured by the nodejs lane; the other language lanes are tracked by port records. |
| `listOrderSelector` | `String` | no |  |  |  | The name of one of this api's declared `requestParameters` whose request value selects an entry of `listOrderSets` by `key`. Typically an Enum parameter whose `enumOptions` are product vocabulary such as `newest` / `popular`: at design time every enum option must map to a key (LIST_ORDER_SET_ENUM_VALUE_UNMAPPED) and a key no option can reach is warned about (LIST_ORDER_SET_KEY_UNREACHABLE); a parameter that is not declared on the api is an error (LIST_ORDER_SELECTOR_UNKNOWN). Requires `listOrderSets`. Naming it `sortBy` while `runtimeFilters.sortEnabled` is on makes the runtime property sort unreachable behind the enum vocabulary check (LIST_ORDER_SELECTOR_SHADOWS_RUNTIME_SORT). |
| `listGroupBy` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | RETIRED — leave this empty. Grouping was declared and shape-validated here, and no emitter and no runtime library, in any lane, ever compiled it into a query: a GROUP BY on a list api that returns whole rows is not expressible without aggregates this pattern cannot declare, and visual grouping is a client concern the list envelope does not carry. The only consumer it ever had was a property-existence cross-check that validated the entries and threw them away. A NON-EMPTY value is now refused at design time (RETIRED_LIST_SETTING) rather than silently ignored; an empty array stays legal because it asks for nothing. For report-shaped grouping use a DataView (BFF), or group the rows in the client. |
| `topPick` | `Integer` | no |  |  |  | Optional maximum number of sorted records to consider for this list API. If null or 0, no cap is applied. Works with pagination by limiting the full ranked set first, then paging within that capped set: the page LIMIT never reaches past the cap, a page that starts beyond the cap is empty, and the reported total (and therefore totalPages) never exceeds the cap. Honoured by the nodejs api-layer; the other language lanes still ignore it. |
| `queryCache` | `Boolean` | yes |  |  |  | Author `queryCache` as the boolean `true`. This list api then caches its ANSWER in Redis and serves a repeat of the identical query from the cache until the entry expires or an entity write invalidates it. Supported in nodejs, dotnet, python and golang; golang invalidates every cached answer of the object on a write instead of only the written row's clusterInRedis slices. This declaration guard still warns with QUERY_CACHE_LANE_NOT_IMPLEMENTED for java and rust, and also for golang until its language list is updated: on golang that warning is stale and the list does cache. The shared getQueryCacheEnabled accessor enables only a list whose RESOLVED queryCache value is boolean true. Existing ListOptions hydration also converts the authored string "true" to boolean true before emission; this support declaration does not change that raw-input policy. Direct unresolved strings and numbers do not enable the accessor.  This is a DIFFERENT cache from `objectSettings.redisEntityCacheSettings.useEntityCaching`: that one keys ONE ROW by its id and backs `get<Object>ById`; this one keys ONE ANSWER TO ONE QUERY. Both may be on at once.  Cache identity is the RESOLVED query — the where clause (which is where a list's session-derived narrowing lands: the tenant filter, the ownership filter, the compiled permission/membership filters), the page window, the sort order, the runtime filter/search terms and the declared request parameters. Two callers entitled to different rows therefore never share an entry.  Invalidation is driven by writes to the api's DataObject: every create/update/delete on it drops the cached answers the written row could appear in. Flag the column the list is normally filtered by (a tenant, owner or parent id) with `indexSettings.clusterInRedis` to make that SLICED — otherwise a single write flushes every cached answer for the object, and the design-time warning QUERY_CACHE_UNSLICED points it out.  Entries expire after 60 seconds by default (`QUERY_CACHE_TTL_SECONDS` overrides it per deployment), which is also the backstop for the one thing invalidation cannot see: a list whose rows are enriched from OTHER objects, or a DataView-backed list, only refreshes those parts on expiry. Do not enable it on a list that must be read-your-writes consistent with a different object's writes. |
| `setAsRead` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | RETIRED — leave this empty. A write side-effect fired from a read api, with no declared transaction, ordering, failure or idempotency semantics, and no emitter or runtime library in any lane ever emitted it. A NON-EMPTY value is now refused at design time (RETIRED_LIST_SETTING) rather than silently ignored; an empty array stays legal because it asks for nothing. Declare an `update` BusinessApi and call it after the read, so the mutation carries its own auth, its own contract and its own errors. |
| `permissionFilters` | [`ListPermissionFilter`](./ListPermissionFilter.md)[] | no |  |  |  | Optional filter array that applies permission constraints to the query dynamically based on session or object roles. If given more than one permission filter, all will be applied with @and operator. |
| `membershipFilters` | [`ListMembershipFilter`](./ListMembershipFilter.md)[] | no |  |  |  | An array for membership settings to filter to the WHERE clause of the list. If given more than one membership, one of all will be enough to select the object. |
| `searchFilter` | [`ListSearchFilter`](./ListSearchFilter.md) | no |  |  |  | A ListSearchFilter object that collects an id list from ElasticSearch main object index search and appends to the where clause so that db select is done according to the search results of ElasticSearch |
| `jointFilters` | [`ListJointFilterSettings`](./ListJointFilterSettings.md) | no |  |  |  | A setting for one or more ListJointFilter to filter the list result with a criteria in a joined data object, more than one filters will be combined by (AND) or (OR) according to the operator parameter |
| `runtimeFilters` | [`ListRuntimeFilterSettings`](./ListRuntimeFilterSettings.md) | no |  |  |  | Runtime filter / sort / search / saved-filter behavior for this list API. Operates uniformly on DataObject-sourced and DataView-sourced APIs — codegen compiles to SQL where-clauses or ES queries depending on the API's data source (see porting-docs/closed/PROPOSAL-list-api-runtime-filters.md). Four opt-in flags: filtersEnabled (accept operator-based POST body filters), searchEnabled (accept `?q=` runtime search), sortEnabled (accept runtime `?sortBy=&sortOrder=`), savedFiltersEnabled (auto-generate /filters aux endpoints + a per-service listSavedFilter table). |
| `queryFiltersActive` | `Boolean` | no | `true` |  |  | When set to true, the compiler automatically add filter parameters (the properties that have filter settings enabled) to the request query, and add whereClause items if any query filter is given. A property the list api declares in requestParameters or names as a bare whereClause.selectBy term is not an auto filter: its declared parameter is the value's only binding, and it filters rows only where a clause reads it. A mapped selectBy term (`prop:alias`) on a list keeps its property an auto filter and warns LIST_SELECTBY_MAPPED_TERM_INERT. Leave this value as true unless you have reason to deactivate query filtering in the list api. Honoured now: an explicit false now suppresses the auto-added filter parameters and their where-clause terms for every lane, because the gate lives on the pattern (BusinessApi.getFilterProperties) rather than in one template. Before that it was declared and validated but read by nothing, so false was silently ignored. |

## Constraints

Property rules:

- `queryCache` must be present. (`REQUIRED_FIELD_MISSING`)
- `listGroupBy` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `listSortBy` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `listOrderSets` must have distinct names (`key`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `setAsRead` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `permissionFilters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `membershipFilters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `LIST_ORDER_SELECTOR_REQUIRED` | error | listOrderSets declares … named order(s) but listOrderSelector is empty, so no request value can ever select one and the list always uses listSortBy. |
| `LIST_ORDER_SELECTOR_SHADOWS_RUNTIME_SORT` | warning | listOrderSelector "…" shares its name with the runtime sort query parameter that runtimeFilters.sortEnabled reads, and the parameter declares an enum vocabulary ([…]): every raw property name a caller sends as ?…= is … |
| `LIST_ORDER_SELECTOR_UNKNOWN` | error | listOrderSelector "…" is not a declared request parameter of this api (declared: […])…. |
| `LIST_ORDER_SET_EMPTY` | error | Order set "…" has no sortBy item, so selecting it would apply no order at all. |
| `LIST_ORDER_SET_ENUM_VALUE_UNMAPPED` | error | Enum value "…" of the selector parameter "…" maps to no listOrderSets key (keys: […]). |
| `LIST_ORDER_SET_KEY_UNREACHABLE` | warning | Order set key "…" is not one of the enumOptions of the selector parameter "…" ([…]), so the parameter vocabulary check rejects that value before the order switch ever sees it: this set can never be selected. |
| `LIST_ORDER_SETS_REQUIRED` | error | listOrderSelector "…" is set but listOrderSets is empty, so there is no order for the selector to choose. |
| `LIST_TOTAL_COUNT_CURSOR_INCOMPATIBLE` | error | Cursor pagination does not report totals. |
| `LIST_TOTAL_COUNT_REQUIRES_LIST` | error | listOptions.totalCount is only supported on crudType list. |

## Example

Use ListOptions to control sorting, capping, caching, and runtime filter/search behavior of a list API. This example sorts orders by newest first, enables auto query filtering, and opts the API into runtime filters, search, and sort.

```json
{
  "listSortBy": [
    {
      "name": "newestFirst",
      "property": "createdAt",
      "order": "desc"
    }
  ],
  "queryFiltersActive": true,
  "runtimeFilters": {
    "filtersEnabled": true,
    "searchEnabled": true,
    "sortEnabled": true,
    "searchedFields": [
      "orderNumber",
      "customerName"
    ]
  }
}
```
