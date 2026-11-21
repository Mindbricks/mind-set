---
title: FunctionCallAction
---

# FunctionCallAction

Invokes a function from the service's MScript library and writes the return value onto the workflow context. Use it to share logic across business APIs in the same service without inlining the expression in every action.

`FunctionCallAction` is the *call site*. For an *inline* definition of a function reusable within a single Business API, use [`ArrowFunctionAction`](./arrow-function-action.md). For invoking a named method on a catalogue integration provider, use [`IntegrationAction`](./integration-action.md).

## When to use it

- Hoist a derived calculation (`calculateTotal`, `formatAddress`, `enrichUser`) into the service library and call it from multiple workflows.
- Encapsulate complex MScript that would be unreadable inline.
- Share validation helpers / domain functions across CRUD and custom APIs in the same service.
- For per-workflow helpers use `ArrowFunctionAction`; for cross-service helpers, model the work as an `InterserviceCallAction`.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `callScript` | `MScript` | yes | Expression that calls a library function. Conventionally `LIB.<functionName>(<args>)`. May reference any context value (`this.*`, request parameters, session). |

## Behaviour

The action returns the value of the compiled `callScript`. The MScript compiler resolves `LIB.<name>` against the service's function library. Whatever the function returns is stored on `this.<contextPropertyName>` (when set) and written to the response when `writeToResponse` is true.

The called function runs in the workflow's process: it is **not** an out-of-process call. If it is asynchronous, the awaited value is returned. If it throws, `onActionError` governs whether the workflow aborts or continues.

Author library functions in the service's MScript library.

## Example

```json
{
  "name": "computeOrderTotal",
  "writeToResponse": false,
  "contextPropertyName": "orderTotal",
  "callScript": { "js": "LIB.calculateTotal(this.items, this.session.currency)" }
}
```

Combined with a follow-up validation:

```json
"validationActions": [
  {
    "name": "minimumOrderValue",
    "description": "The order total must be at least 5.",
    "writeToResponse": false,
    "validationScript": { "js": "this.orderTotal.grandTotal >= 5" },
    "shouldBeTrue": true,
    "checkType": "liveCheck",
    "errorStatus": "422",
    "errorMessage": "Order total below minimum."
  }
]
```

## Errors

- An unresolved `LIB.<name>` reference is caught at compile / project validation.
- Library functions that throw propagate per `onActionError`.

## See also

- [`ArrowFunctionAction`](./arrow-function-action.md): inline arrow definition
- [`IntegrationAction`](./integration-action.md): catalogue integration method
- [MScript overview](../mscript/overview.md)
