---
title: ListOptions hub
---

# ListOptions hub

`ListOptions` is the orchestrator block for every `list`-type
BusinessApi. It hangs off `query.listOptions` and gathers the six
composable filter families — plus sort, group, cap, and cache — into
one place. Each family is its own small composition pattern; this page is the
map.

`ListOptions` applies **only** to APIs whose `crudType` is `list`. It is
ignored on `get`, `create`, `update`, and `delete`. (Pagination is a
sibling block, `query.paginationOptions`, not part of `ListOptions` —
see [Runtime list filters](runtime-list-filters.md).)

## Which block activates it

`BusinessApi.query.listOptions` (type `ListOptions`). Leave it null for a
plain list that returns every row the caller may see. Populate only the
sub-blocks you need — every field is nullable.

## What it emits

For a list API, the compiler folds each populated sub-block into the
generated query. The static pieces (`listSortBy`, `topPick`, the
WHERE-contributing filters) become the `WHERE`/`ORDER BY` and
the page window of a SQL query, or the equivalent document-store query.
The search-index-backed pieces
(`searchFilter`, runtime `?q=`) become a search-index query
whose id results are folded back into the database WHERE clause.

## Anatomy

| Field | Type | What it does | Page |
|---|---|---|---|
| `runtimeFilters` | `ListRuntimeFilterSettings` | Caller-driven filter / search / sort / saved-filters. | [Runtime list filters](runtime-list-filters.md) |
| `jointFilters` | `ListJointFilterSettings` | Filter by a criterion in a *joined* object (left-join-like). | [Joint filters](joint-filters.md) |
| `permissionFilters` | `ListPermissionFilter[]` | Scope the list by the caller's permissions (multiple → **AND**). | [Permission & membership filters](permission-and-membership-filters.md) |
| `membershipFilters` | `ListMembershipFilter[]` | Scope the list by per-record membership (multiple → **OR**). | [Permission & membership filters](permission-and-membership-filters.md) |
| `searchFilter` | `ListSearchFilter` | Pull an id-list from the search index and append it to the WHERE clause. | [Search filters](search-filters.md) |
| `listSortBy` | `SortByItem[]` | Static default sort order. | below |
| `listOrderSets` | `ListOrderSet[]` | Named alternative orders (`{ key, sortBy }`) a request parameter selects per request. | [Keyed order sets](#keyed-order-sets) |
| `listOrderSelector` | `String` | The declared request parameter whose value picks the `listOrderSets` entry. | [Keyed order sets](#keyed-order-sets) |
| `topPick` | `Integer` | Cap the ranked set before paging. | below |
| `queryCache` | `Boolean` | Enable query-result caching for this list. | below |
| `queryFiltersActive` | `Boolean` | Auto-add per-property filter params (default `true`). | below |
| `listGroupBy` | `PropRefer[]` | Not compiled into any query; must stay empty. | below |
| `setAsRead` | `DataMapItem[]` | No post-read write is emitted; must stay empty. | below |

> `WhereClauseSettings` (`selectBy` / `fullWhereClause` /
> `additionalClauses`) lives one level up, on `query.whereClause`, and
> applies to `get` / `update` / `delete` as well as `list`. See
> [Where-clause composition](where-clause-composition.md). `ListOptions`
> contributes *additional* WHERE fragments on top of it for list APIs.

## How the filter families combine

The families layer into a single effective WHERE clause for the list:

```text
whereClause (selectBy / fullWhereClause / additionalClauses)   [base]
  AND  every permissionFilter           (multiple → AND)
  AND  searchFilter id-list             (from the search index)
  AND  jointFilters                     (each → id-list from a joined object;
                                          combined AND/OR per its operator)
  AND  ( membershipFilter1 OR membershipFilter2 ... )          (multiple → OR)
  AND  runtimeFilters.filters           (caller-supplied operator criteria)
```

On an object moderated with
[`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`
the service also conjoins the moderation read gate (`accepted`, or the
caller's own rows, for a non-privileged caller), where the tenant term
rides; a joint or membership filter over such an object is gated on its
own id pre-selection.

The combination operators are fixed by the language: permission
filters are restrictive (AND), membership filters are permissive (OR),
joint filters carry their own `operator`. This is deliberate —
permissions narrow what you may see, memberships widen it.

> **Joint and search filters get expensive on large data sets.** Both
> pre-fetch an id list on every request and fold it into the WHERE
> clause as one `$in` list. A joint filter reads every row of the joined
> object its `whereClause` matches, with no limit, so a broad clause over
> a large joined object costs a full read plus an `$in` of that size on
> each call. The search filter's id list is capped at
> `min(10000, max(page × pageSize, 1000))` search hits: a keyword
> that matches more rows than that answers only the first hits, and no
> page beyond 10,000 rows can be reached. Keep joint clauses selective,
> and serve heavy, cross-object read paths from a stored
> [BFF DataView](../system-services/bff.md) instead.

## Static sort / group / cap

```json
{
  "basics": { "apiOptions": { "name": "listOrders", "crudType": "list", "dataObjectName": "Order" } },
  "query": {
    "listOptions": {
      "listSortBy": [
        { "name": "byCreatedAt", "property": "createdAt", "order": "desc" }
      ],
      "topPick": 500,
      "queryCache": true
    }
  }
}
```

- **`listSortBy`** — array of `SortByItem` (`name`, `property`, `order`
  = `asc` / `desc`). When `runtimeFilters.sortEnabled` is on, this is the
  *default* and the runtime `?sortBy=` overrides it. To let a declared
  parameter with product vocabulary (`newest` / `popular`) pick among
  several named orders, see [Keyed order sets](#keyed-order-sets).
- **`topPick`** — caps the ranked set *before* pagination pages within
  it: the page `LIMIT` never reaches past the cap, a page that starts
  beyond the cap comes back empty, and `paging.totalCount` /
  `paging.totalPages` describe the capped slice rather than the whole
  table. `null` / `0` means no cap. Whether a given compiler target honours
  `topPick` is stated in [the compiler specification](../../compiler/index.md).
- **`queryCache`** — caches the query result. For object-level caching
  see [Redis entity caching](redis-entity-caching.md).
  Author hooks can observe `isQueryCacheHit` for the current
  `mainOperation` attempt. It resets before each cache read: a HIT followed
  by a MISS on the same manager reports `false` to the second list hook and
  writes the newly queried result. A HIT does not rewrite or refresh its entry.
- **`queryFiltersActive`** (default `true`) — auto-adds filter
  parameters for every property whose filter setting is enabled, and
  appends matching WHERE items. Leave it on unless you have a reason to
  disable per-property query filtering. An explicit `false` suppresses
  both the parameters and the WHERE items.

## Keyed order sets

`listSortBy` is one static order compiled into the service, and the
runtime `?sortBy=` override (below, under `runtimeFilters.sortEnabled`)
only accepts raw property names. Neither lets a caller say
`?sortBy=popular`. `listOrderSets` + `listOrderSelector` do:

```json
{
  "basics": { "apiOptions": { "name": "listRecipes", "crudType": "list", "dataObjectName": "recipe" } },
  "parameters": {
    "requestParameters": [
      { "name": "sortBy", "type": "Enum", "enumOptions": ["newest", "popular", "prepAsc"], "httpLocation": "query", "dataPath": "sortBy" }
    ]
  },
  "query": {
    "listOptions": {
      "listSortBy": [ { "name": "byCreatedAt", "property": "createdAt", "order": "desc" } ],
      "listOrderSets": [
        { "key": "newest",  "sortBy": [ { "name": "byCreatedAt", "property": "createdAt",   "order": "desc" } ] },
        { "key": "popular", "sortBy": [ { "name": "byViews",     "property": "viewCount",   "order": "desc" } ] },
        { "key": "prepAsc", "sortBy": [ { "name": "byPrep",      "property": "prepMinutes", "order": "asc" } ] }
      ],
      "listOrderSelector": "sortBy"
    }
  }
}
```

- **`listOrderSets`** — `[{ key, sortBy: SortByItem[] }]`. Each `key` is
  a value of the selector parameter; each `sortBy` is the order applied
  when that value arrives (over the api's main data object, priority
  order). Keys are unique; a set must not be empty; every property must
  exist on the data object.
- **`listOrderSelector`** — the name of one of the api's own
  `requestParameters`. The generated service reads it the way it reads
  every declared parameter (`this.<name>`), so `GET /recipes?sortBy=popular`
  orders by `viewCount desc`.
- **Fallback** — a value that matches no key, or no value at all, uses
  `listSortBy`.
- **Tie-break** — a unique `id ASC` term is appended to whichever order
  wins (unless it already names `id`), so rows with equal sort keys page
  stably instead of shuffling between pages.
- **Where it is honoured** — SQL and document-store list paths, a
  DataView (search index) list, and the per-query cache identity: two
  selector values are two cache entries and two ETags. Pagination and
  `cursorMode` are unchanged (a keyset walk keeps its fixed
  `createdAt ASC, id ASC` order).
- **Precedence with `runtimeFilters.sortEnabled`** — a selector value that
  matches a key wins; otherwise a runtime `?sortBy=` naming an allowed
  field applies; otherwise `listSortBy`. Naming the selector `sortBy` on a
  `sortEnabled` api makes the runtime property sort unreachable (the enum
  vocabulary check rejects property names first) and is warned about.

Validation: `LIST_ORDER_SELECTOR_UNKNOWN` (the selector is not a declared
parameter), `LIST_ORDER_SET_ENUM_VALUE_UNMAPPED` (an enum option no key
answers, an error: that caller would silently get the default order),
`LIST_ORDER_SET_KEY_UNREACHABLE` (a key no enum option can send, a
warning), `LIST_ORDER_SET_EMPTY`, `LIST_ORDER_SELECTOR_REQUIRED` /
`LIST_ORDER_SETS_REQUIRED` (the two fields go together), and the usual
`PROPERTY_NOT_FOUND` inside a set. Support per compiler target is stated in
[the compiler specification](../../compiler/index.md).

### `listGroupBy` and `setAsRead` stay empty

No compiler reads either field. `listGroupBy` reaches no `GROUP BY` (a
grouping on a list API that returns whole rows needs aggregates the
pattern cannot declare), and `setAsRead` emits no post-read write.

Both stay in the pattern, and an empty array is legal, but a
**non-empty value is refused at design time** with
`RETIRED_LIST_SETTING`. For report-shaped grouping use a BFF DataView
(read model); to mark records read, declare an `update` BusinessApi and
call it after the read, so the mutation carries its own auth, contract
and errors.

## Worked example — all six families on one list

```json
{
  "basics": { "apiOptions": { "name": "listProjects", "crudType": "list", "dataObjectName": "Project" } },
  "query": {
    "whereClause": {
      "additionalClauses": [
        { "name": "tenantScope", "whereClause": { "js": "({ workspaceId: { $eq: this.session.workspaceId } })" } }
      ]
    },
    "listOptions": {
      "permissionFilters": [
        { "name": "canList", "permission": "project.list" }
      ],
      "membershipFilters": [
        { "name": "byOrg", "dataObjectName": "Organisation", "objectKeyIdField": "organisationId", "userKey": { "js": "this.session.userId" } }
      ],
      "jointFilters": {
        "operator": "AND",
        "filters": [
          { "name": "activeOwner", "joinedDataObject": "User", "selector": "ownerId->id", "whereClause": { "js": "({ status: { $eq: 'active' } })" } }
        ]
      },
      "searchFilter": {
        "hasSearchFilter": true,
        "condition": { "js": "!!this.keyword" },
        "keyword": { "js": "this.keyword" },
        "searchProperties": ["name", "description"]
      },
      "runtimeFilters": { "filtersEnabled": true, "sortEnabled": true, "searchEnabled": false },
      "listSortBy": [ { "name": "byCreatedAt", "property": "createdAt", "order": "desc" } ]
    }
  }
}
```

This list is tenant-scoped (base WHERE), requires the `project.list`
permission, is visible to organisation members, only includes projects
whose owner is active, supports a keyword search over `name` /
`description`, and accepts caller-supplied runtime filters and sort.

## See also

- [Runtime list filters](runtime-list-filters.md)
- [Joint filters](joint-filters.md)
- [Permission & membership filters](permission-and-membership-filters.md)
- [Search filters](search-filters.md)
- [Where-clause composition](where-clause-composition.md)
- [Select-join](select-join.md) — read-time projection / joins.
- Specification: [`ListOptions`](../../spec/ListOptions.md),
  [`SortByItem`](../../spec/SortByItem.md),
  [`ListOrderSet`](../../spec/ListOrderSet.md),
  [`PaginationOptions`](../../spec/PaginationOptions.md).
