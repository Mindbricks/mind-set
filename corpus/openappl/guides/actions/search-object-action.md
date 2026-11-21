---
title: SearchObjectAction
---

# SearchObjectAction

`SearchObjectAction` performs a keyword search against an Elasticsearch-indexed data object and writes the matched IDs back to the workflow context as an array. Use these IDs in a downstream query's membership filter.

## When to use it

- Resolve user-typed search input ("acme inc") to a set of customer IDs before listing their orders.
- Power a quick-find lookup followed by a query that loads the matched documents.
- Find rows by keyword without hand-writing an Elasticsearch DSL query (use [`FetchFromElasticAction`](./fetch-from-elastic-action.md) for the raw-DSL escape hatch).

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `targetObject` | `DataObjectName` | ✓ | Data object to search. The object must be Elastic-indexed. |
| `keyword` | `MScript` | ✓ | Expression evaluating to the keyword string. Example: `this.keyword`, `this.q` (each a declared request parameter). |
| `searchProperties` | `PropRefer`[] | ✓ | Properties of `targetObject` matched against the keyword. The relevance scoring follows the index's configuration on each property. An empty list builds and runs but can never match, so every call returns `[]`; the validator reports it as the warning `SEARCH_OBJECT_NO_SEARCH_PROPERTIES`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties. The matched ID array is written under `contextPropertyName` and made available as `this.<contextPropertyName>`.

## Behaviour

The action evaluates `keyword`. An empty / missing keyword short-circuits and returns `[]` immediately. Otherwise it issues a match or multi-match query across `searchProperties` against the index of `targetObject` with `fuzziness: 'AUTO'`. An array keyword uses exact `terms` membership on the declared fields instead. Each hit contributes `_id`, falling back to `_source.id`; hits with neither ID are omitted. Result order and duplicate IDs are preserved.

The target object must declare Elastic indexes on the properties you list under `searchProperties`. See [indexes](../data-modeling/indexes.md).

**A moderated target.** When `targetObject` carries [`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`, the multi-match query is wrapped in a non-scoring `bool.filter` built from the moderation read gate, so a non-privileged caller's hits are `accepted` rows plus their own. See [the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

## Example

A list API searches `Customer` by name + email keyword, then uses the IDs in its query. The ID array is available as `this.matchedCustomers`:

```json
"searchObjectActions": [
  {
    "name": "searchCustomers",
    "writeToResponse": true,
    "contextPropertyName": "matchedCustomers",
    "targetObject": "Customer",
    "keyword": { "js": "this.q" },
    "searchProperties": ["fullName", "email"]
  }
]
```

Use `{ "id": { "$in": this.matchedCustomers } }` in a downstream where clause to load the matching customers. Use [`FetchObjectAction`](./fetch-object-action.md) when a later action needs their row fields.

## Errors

- `targetObject` not Elastic-indexed: project validation failure.
- Empty keyword: typically a no-op returning `[]`. Guard with `condition` if zero matches should short-circuit the workflow.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`FetchFromElasticAction`](./fetch-from-elastic-action.md): raw-DSL escape hatch for queries beyond keyword search.
- [`FetchObjectAction`](./fetch-object-action.md): typical downstream loader.
- [Indexes](../data-modeling/indexes.md).
