---
title: CollateListsAction
---

# CollateListsAction

Joins two already-fetched lists in memory by a key field: for each item in the target list, attaches the matching source item (or items) under a new property. It is a **left-outer-join in memory**: no database hit.

Use it after two fetch actions have populated the workflow context. To enrich from the database during the workflow, use [`FetchObjectAction`](./fetch-object-action.md) instead.

## When to use it

- Attach an address list onto a user list by `userId` after both lists are loaded.
- Group child rows under their parent in a single workflow without N+1 queries.
- Decorate a result set with denormalised data (membership info, recent activity, counts) already fetched separately.
- For database-backed enrichment use [`FetchObjectAction`](./fetch-object-action.md); for arbitrary array transforms use [`ListMapAction`](./list-map-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `sourceList` | `MScript` | yes | Expression yielding the **source** array (the rows being attached). |
| `targetList` | `MScript` | yes | Expression yielding the **target** array (the rows the source rows are attached to). |
| `sourceKey` | `String` | yes | Property on each source object to match against. |
| `targetKey` | `String` | yes | Property on each target object to match against. |
| `nameInTarget` | `String` | yes | Property name created on each target object to hold the matched source object(s). |
| `targetIsArray` | `Boolean` | yes | When true, `nameInTarget` is set to the **filtered** array of matching source rows. When false, it is set to the first match (`Array.prototype.find`). |

## Behaviour

For each item in the target list, the action either:

- (`targetIsArray: true`) sets `item[nameInTarget] = source.filter(s => s[sourceKey] === item[targetKey])`, or
- (`targetIsArray: false`) sets `item[nameInTarget] = source.find(s => s[sourceKey] === item[targetKey])`.

It returns the number of target items that found at least one match (useful for `condition` on a downstream action). The target list is mutated in place: keep that in mind if other actions hold references to it.

If `targetList` evaluates to `null`/`undefined`, the action throws.

`sourceList` behaves the same way: a `null`/`undefined` source throws 503, because
collating an ABSENT list writes an empty match onto every target row and the
caller cannot tell that from a real answer. (The usual way to get one is a
producing action that did not run or did not answer: a `FetchStatsAction` whose
remote aggregation failed under `onActionError: completeApi`, for instance.) A
genuinely EMPTY source list (`[]`) is not an error: it collates nothing and
returns `0`.

## Example

Attach a list of addresses onto a list of users, allowing multiple addresses per user:

```json
"fetchObjectActions": [
  {
    "name": "loadUsers",
    "writeToResponse": false,
    "contextPropertyName": "users",
    "targetObject": "User",
    "whereClause": { "js": "({ status: 'active' })" },
    "isArray": true
  },
  {
    "name": "loadAddresses",
    "writeToResponse": false,
    "contextPropertyName": "addresses",
    "targetObject": "Address",
    "whereClause": { "js": "({ userId: { $in: this.users.map(u => u.id) } })" },
    "isArray": true
  }
],
"collateListsActions": [
  {
    "name": "joinAddressesToUsers",
    "writeToResponse": false,
    "sourceList": { "js": "this.addresses" },
    "targetList": { "js": "this.users" },
    "sourceKey": "userId",
    "targetKey": "id",
    "nameInTarget": "addresses",
    "targetIsArray": true
  }
]
```

After the action runs, each user in `this.users` has an `addresses` array populated from `this.addresses`.

## See also

- [`FetchObjectAction`](./fetch-object-action.md): DB-backed enrichment
- [`ListMapAction`](./list-map-action.md): array transforms
- [`SearchObjectAction`](./search-object-action.md), [`FetchFromElasticAction`](./fetch-from-elastic-action.md): fetch the source / target lists from Elastic
