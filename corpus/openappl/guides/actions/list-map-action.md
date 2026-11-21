---
title: ListMapAction
---

# ListMapAction

`ListMapAction` is a declarative `Array.prototype.map`: it takes a source array, runs a single MScript expression against each item, and writes the new array to the workflow context. No inner actions, no per-iteration side effects: just a pure value transform expressed inline.

By default the mapped array goes to the **context only**: it does not change what the api returns. On a `list` api, `replacesResult: true` makes the mapped rows *be* the response rows; see [Reshaping the rows of a list response](#reshaping-the-rows-of-a-list-response).

## When to use it

- Project a fetched list into a different shape (e.g., a user list into `{ id, displayName }` pairs).
- Pluck a single field off every row, or derive one with a small inline expression.
- Build a payload list before passing it to a downstream action.
- **Add a derived field to every row a list api returns**: with `replacesResult: true`.

Reach for [`LoopAction`](./loop-action.md) instead when each iteration needs to **do** things (call other actions, fan out integration calls, run side effects). `ListMapAction` is for value-shaping; `LoopAction` is for per-item workflow.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `sourceList` | `MScript` | yes | Expression that evaluates to the source array. Typically references an earlier action's context, e.g. `this.usersList`. |
| `itemName` | `String` | yes | Code-safe identifier bound to the current source item inside `mapScript`. Example: `"user"` lets you write `user.email` rather than `item.email`. |
| `mapScript` | `MScript` | yes | Expression that returns the new item, given the source item bound to `itemName`. For multi-statement logic, wrap in an inline arrow IIFE: `((user) => { /* ... */ return out; })(user)`. |
| `replacesResult` | `Boolean` | no | List apis only. The mapped array becomes the api's result rows, so the response ships them. Default `false`. |

Plus every property inherited from `BusinessApiAction` (`name`, `condition`, `contextPropertyName`, `writeToResponse`, `onActionError`, ...).

The result array is written to `contextPropertyName` on the workflow context, ready for any later action to consume.

## Behaviour

At runtime, the action evaluates `sourceList`, then maps over the resulting array, binding each source item to `itemName` and evaluating `mapScript` for it.

Both `sourceList` and `mapScript` are compiled MScript. The transform runs in-process, awaits Promise-valued source and map expressions, and gathers mapped items concurrently. Use `LoopAction` for sequential per-item workflow or `ParallelAction` for concurrent action execution.

If `sourceList` evaluates to something other than an array, the action throws a typed 503 naming the action before mapping; `ListMapAction` does not silently coerce. A `null`/`undefined` source has a separate unavailable-source diagnostic: mapping an ABSENT list would ship `[]` as if it were the answer, and under `replacesResult` that empty array is written over the caller's rows while the query's own `count` stays on the envelope. (The usual way to get one is a producing action that did not run or did not answer: a `FetchStatsAction` whose remote aggregation failed under `onActionError: completeApi`, for instance.) A genuinely EMPTY source (`[]`) is not an error: it maps to `[]`. Guard with a `condition` if the source is legitimately optional.

## Example

Take a fetched list of users and project to a compact `{ id, displayName }` shape (under the `listMapActions[]` slot):

```json
"listMapActions": [
  {
    "name":                "buildUserSummaries",
    "sourceList":          { "js": "this.usersList" },
    "itemName":            "user",
    "mapScript":           { "js": "({ id: user.id, displayName: user.firstName + ' ' + user.lastName })" },
    "contextPropertyName": "userSummaries"
  }
]
```

Downstream actions can now reference `this.userSummaries` directly.

A small inline IIFE handles a multi-line transform:

```json
{
  "name":                "pricedItems",
  "sourceList":          { "js": "this.cartItems" },
  "itemName":            "item",
  "mapScript":           { "js": "((item) => { const tax = item.price * 0.18; return { ...item, tax, total: item.price + tax }; })(item)" },
  "contextPropertyName": "pricedItems"
}
```

## Reshaping the rows of a list response

Storing the mapped array in context does **not** change what the caller receives: the response is built from `this.result`, which still holds the rows the query returned. Setting `contextPropertyName: "result"` does not change that either: `result` is a reserved manager member, the write-back is rerouted to an internal slot nothing reads, and design-time validation rejects it (`RESERVED_CONTEXT_PROPERTY`).

`replacesResult: true` is the supported way:

```json
"listMapActions": [
  {
    "name":           "deriveStatus",
    "sourceList":     { "js": "this.gatherings" },
    "itemName":       "gathering",
    "mapScript":      { "js": "({ ...gathering, derivedStatus: LIB.deriveStatus(gathering.startTime, gathering.publicationStatus) })" },
    "replacesResult": true
  }
]
```

wired into the workflow as:

```json
"workflow": { "list": { "afterMainListOperation": ["deriveStatus"] } }
```

Notes that matter:

- **Source.** On a list api the fetched rows are bound under the *pluralized* object name: `this.gatherings` for a `gathering` list. That is the source to map; you do not need to unwrap `this.result` by hand.
- **Stage.** `afterMainListOperation` is the only stage that works, and validation enforces it (`RESULT_REPLACEMENT_WRONG_STAGE`): earlier there are no rows yet, and from `afterBuildOutput` on the envelope is already composed, so the write-back would never be read.
- **List apis only.** The mapped value is an array; replacing a single-record result with one would ship an array where the response contract promises an object (`RESULT_REPLACEMENT_ON_NON_LIST`).
- **Paging stays honest.** Only the rows are replaced: the query's `count` is untouched, which stays correct because a map is 1:1. A `ListMapAction` cannot drop rows; use the where clause or a filter for that.
- **No stray keys.** The rows *are* the response, so nothing is published twice. (`writeToResponse` is the other, additive option: it puts the mapped array under its own response key and leaves `data` alone.)
- **To only drop fields**, prefer [`RemoveFromResponseAction`](./remove-from-response-action.md) with `applyToListRows: true`: it is declarative, needs no MScript, and can key the drop on each row's ownership.

A list api that maps its own rows and neither replaces the result nor writes to the response raises the `LIST_MAP_RESULT_DISCARDED` warning: the map runs on every request and its answer is thrown away while the caller receives the unmapped rows.

## Computed list totals

`ListMapAction.replacesResult` keeps its 1:1 contract. A computed list can declare `query.listOptions.totalCount: { "js": "this.computedTotal" }`. The expression runs after `afterMainListOperation` and takes precedence over the placeholder query count; explicit 0 is meaningful. It must return a finite non-negative integer.

The producer must select the requested page itself using `this.pagination.page` and `this.pagination.pageSize`; the runtime does not slice a whole computed set. For example, a producer can return the requested page of search hits, map those hits 1:1 into response rows, and expose the search result total as `this.computedTotal`. Page 1 and page 2 must supply distinct rows.

`topPick` caps the declared total. With `query.paginationOptions.unpaged: true`, the envelope continues reporting the returned row count. Cursor pagination has no total and rejects this option at design time. Query-cache hits still run post-main actions and re-evaluate the expression; cache/accounting otherwise keeps its existing main-query behavior.

## See also

- [`RemoveFromResponseAction`](./remove-from-response-action.md): per-row redaction on a list response.
- [`LoopAction`](./loop-action.md): when each iteration runs a workflow of inner actions rather than a single MScript.
- [`ParallelAction`](./parallel-action.md): concurrent execution of a fixed set of named actions (not per-item).
- [MScript syntax](../mscript/syntax.md): what's legal inside `sourceList` and `mapScript`.
- Reference: [`ListMapAction`](../../spec/ListMapAction.md).
