---
title: AddToContextAction
---

# AddToContextAction

Evaluates one or more MScript expressions and writes the results to the workflow context under the names you choose. It is the canonical way to stash intermediate values for downstream actions to read.

## When to use it

- Compute a derived value once and reference it from multiple later actions.
- Reshape a fetched object into a smaller projection before validation or response.
- Flag a condition (boolean / count / enum tag) so subsequent actions can branch via their `condition` field.
- Pre-compute MScript that would otherwise be duplicated across action configs.

`AddToContextAction` writes to `this`. Its sibling [`AddToResponseAction`](./add-to-response-action.md) writes to the outgoing API response payload: use that when the value is for the client, not the workflow.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md). Note that the parent's `contextPropertyName` is **not** used here: values are stored under the names declared inside each `context` entry.

| Property | Type | Req | Description |
|---|---|---|---|
| `context` | `ContextData[]` | no | One or more `{ contextName, contextValue }` pairs. Each evaluates `contextValue` (MScript) and writes the result to `this.<contextName>`. Optional at the schema level; an omitted or empty `context` makes the action a no-op: nothing is written. |

Each `ContextData` entry has:

| Property | Type | Req | Description |
|---|---|---|---|
| `contextName` | `String` | yes | The key under which the value is stored on `this`. Subsequent actions read it as `this.<contextName>`. |
| `contextValue` | `MScript` | yes | The expression evaluated at runtime. May reference any previously populated context property, request parameter, or session field. |

## Behaviour

For each entry in `context`, the compiled action assigns the evaluated `contextValue` to `this.<contextName>` and then returns `true`. Entries are evaluated in declaration order, so an earlier `contextValue` can be referenced by a later one in the same action.

The action itself has no meaningful result, so `writeToResponse` is rarely useful and `contextPropertyName` should usually be omitted.

## Example

```json
{
  "name": "computeTotals",
  "writeToResponse": false,
  "context": [
    { "contextName": "subtotal",      "contextValue": { "js": "this.items.reduce((s, i) => s + i.price * i.qty, 0)" } },
    { "contextName": "tax",           "contextValue": { "js": "this.subtotal * 0.18" } },
    { "contextName": "grandTotal",    "contextValue": { "js": "this.subtotal + this.tax" } },
    { "contextName": "highValueOrder","contextValue": { "js": "this.grandTotal >= 1000" } }
  ]
}
```

Later actions can read any of those fields directly. For example, expose a curated totals object on the API response:

```json
{
  "name": "respond",
  "_kind": "AddToResponseAction",
  "writeToResponse": false,
  "context": [
    { "contextName": "orderTotals", "contextValue": { "js": "({ subtotal: this.subtotal, tax: this.tax, grandTotal: this.grandTotal })" } }
  ]
}
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): shared fields
- [`AddToResponseAction`](./add-to-response-action.md): writes to the response payload
- [`CreateObjectAction`](./create-object-action.md): same idea, but builds a structured object under a single context key
- [MScript overview](../mscript/overview.md)
