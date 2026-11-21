---
title: AddToResponseAction
---

# AddToResponseAction

Evaluates one or more MScript expressions and writes the results onto the outgoing API response object. Use it for derived values that are not a 1:1 mirror of any single action's result.

## When to use it

- Compose a `summary` block or computed total that does not match any one action's `contextPropertyName`.
- Flatten several fetches into a single response-shaped object.
- Expose a session- or Redis-sourced value that lives on `this` but is not naturally written out by an action that already has `writeToResponse`.
- Add a static or computed marker (timestamp, request id, derived flag) to the response.

For most APIs, `writeToResponse: true` on the action that produces the value is enough. Reach for `AddToResponseAction` when the value does not have a single producing action.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md). The parent's `contextPropertyName` is not used here: properties are added under the names declared inside each `context` entry.

| Property | Type | Req | Description |
|---|---|---|---|
| `context` | `ContextData[]` | no | One or more `{ contextName, contextValue }` pairs. Each evaluates `contextValue` (MScript) and adds the result to the response under `contextName`. Optional at the schema level; an omitted or empty `context` makes the action a no-op: nothing is added to the response. |

Each `ContextData` entry has:

| Property | Type | Req | Description |
|---|---|---|---|
| `contextName` | `String` | yes | The key under which the value is added to the response. |
| `contextValue` | `MScript` | yes | The expression evaluated at runtime. May reference any context property, session field, or earlier action result. |

## Behaviour

For each entry, the compiled action evaluates `contextValue` and hands the result to the api manager's response-addition seam. The addition is kept aside and re-applied after the response is built, so an entry written in any stage (even one that runs before the response exists) reaches the caller. Entries are evaluated in declaration order.

An entry does NOT put its value on the api context: `contextName` is a response key, not a `this.<name>` binding, so a later `contextValue` cannot read an earlier entry as `this.<contextName>`. Compute a shared value once with an [`AddToContextAction`](./add-to-context-action.md) and read it from there, as the example below does.

Two names are checked at design time:

- `RESERVED_RESPONSE_KEY` (ERROR): `contextName` is a key the compiler itself writes for this crudType (`data` / `paging` on a list, `_type` on a single-item api). The runtime also drops such an addition.
- `RESPONSE_ADDITION_SHADOWS_COLUMN` (WARNING): on a `get` / `create` / `update` / `delete` api the response IS the api's record, and the addition is written on top of it. A `contextName` equal to a column of the api's own data object (or `id`) therefore replaces that column's value in every response while the stored row keeps the original. A column name is legitimate and so is an intended override: the warning only documents the collision. Rename the key (`handledByLabel`) when the caller must also see the stored value. The same warning fires for an action with `writeToResponse: true` whose `contextPropertyName` collides with a column. A list api is exempt (its rows live under `data`).

A subsequent [`RemoveFromResponseAction`](./remove-from-response-action.md) can strip any of the properties written here before the response is sent.

## Example

Compute the shared numbers on the context first:

```json
{
  "name": "computeOrderTotals",
  "context": [
    { "contextName": "subtotal", "contextValue": { "js": "this.items.reduce((s, i) => s + i.price * i.qty, 0)" } },
    { "contextName": "tax",      "contextValue": { "js": "this.subtotal * 0.18" } }
  ]
}
```

(an `addToContextActions` entry: each of its entries is bound as `this.<contextName>`, so `tax` can read `this.subtotal`), then write the response:

```json
{
  "name": "shapeOrderResponse",
  "writeToResponse": false,
  "context": [
    { "contextName": "subtotal",   "contextValue": { "js": "this.subtotal" } },
    { "contextName": "tax",        "contextValue": { "js": "this.tax" } },
    { "contextName": "grandTotal", "contextValue": { "js": "this.subtotal + this.tax" } },
    { "contextName": "summary",    "contextValue": { "js": "({ itemCount: this.items.length, grandTotal: this.subtotal + this.tax })" } }
  ]
}
```

The client receives `subtotal`, `tax`, `grandTotal`, and `summary` on the response, regardless of which earlier actions populated `this.items`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): shared fields
- [`AddToContextAction`](./add-to-context-action.md): writes to `this`, not the response
- [`RemoveFromResponseAction`](./remove-from-response-action.md): strip properties before send
- [MScript overview](../mscript/overview.md)
