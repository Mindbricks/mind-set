# ListOptions

**Level:** `section` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListOptions in Part 2](../spec/ListOptions.md)

Behavioral options for Business APIs of type `list`. These control sorting, grouping, filtering, and caching logic.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `QueryCache` | `const { QueryCache } = require("common")` | One cached list answer of `listOptions.queryCache`: `new QueryCache(objectName, clusters, identity, whereClause)`, read with `readQueryResult()`, written with `writeQueryResult(data, ttlSeconds?)`. | nodejs |
| `QueryCacheInvalidator` | `const { QueryCacheInvalidator } = require("common")` | Flush the `listOptions.queryCache` answers a write can have changed: `new QueryCacheInvalidator(objectName, clusters)` then `invalidateCache(row)` or `invalidateAll()`. | nodejs |

## Contained in

- [BusinessApiQuery](./BusinessApiQuery.md) as `listOptions`

Blueprint paths:

- `authentication.businessLogic.query.listOptions`
- `services.businessLogic.query.listOptions`

## Contains

- `listSortBy`: [SortByItem](./SortByItem.md), a list
- `listOrderSets`: [ListOrderSet](./ListOrderSet.md), a list
- `setAsRead`: [DataMapItem](./DataMapItem.md), a list
- `permissionFilters`: [ListPermissionFilter](./ListPermissionFilter.md), a list
- `membershipFilters`: [ListMembershipFilter](./ListMembershipFilter.md), a list
- `searchFilter`: [ListSearchFilter](./ListSearchFilter.md)
- `jointFilters`: [ListJointFilterSettings](./ListJointFilterSettings.md)
- `runtimeFilters`: [ListRuntimeFilterSettings](./ListRuntimeFilterSettings.md)

## References

- `listGroupBy` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
