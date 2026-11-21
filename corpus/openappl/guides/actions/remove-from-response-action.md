---
title: RemoveFromResponseAction
---

# RemoveFromResponseAction

`RemoveFromResponseAction` strips named properties from the outgoing API response before it is returned to the client. Use it when an earlier action wrote a value to the response that the API needed for in-flight logic but should not expose externally, internal IDs, debug breadcrumbs, or sensitive joined fields.

## When to use it

- Hide an upstream `contextPropertyName` whose value was written to the response purely as a side effect.
- Filter sensitive joined data that an action loaded for permission-check purposes.
- Conform to a fixed external schema by trimming extras off the response.
- **Hide a field on every row of a list, for some callers only.** See [Redacting a LIST response](#redacting-a-list-response); this is the only construct that can make a row field visible to its owner and an admin while hiding it from everyone else.

The cleaner alternative is **not setting `writeToResponse: true`** on the action that produced the value in the first place. Reach for `RemoveFromResponseAction` only when the value was author-controlled to be on the response and now needs to be hidden conditionally, or when an automatic emit (e.g., the API event payload) included a field you don't want returned to the client.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `properties` | `String`[] | ✓ | Property paths to delete. Each entry is a dot-notation path, top-level keys like `riskScore` or nested keys like `customer.internalNotes`. Array indices may be embedded with bracket form (`addresses[0].street`). Resolved against the response object, or against each ROW when `applyToListRows` is set. |
| `applyToListRows` | `Boolean` | | List apis only. Deletes each path from **every row** of the list envelope (`output.data[i]`) instead of from the response root. Default `false`. |
| `rowCondition` | `MScript` | | List-row redaction only. A boolean evaluated **once per row**, with the row bound under `itemName`. The properties are removed only from the rows where it is true. |
| `itemName` | `String` | | The name the current row is bound to inside `rowCondition`. Default `row`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The action mutates the in-progress response object in place, walking each entry's dot path and deleting the leaf key. It runs in the order it appears in the workflow, to remove a property, this action must run **after** whatever wrote it. A common slot is the response-shaping step near the end of the workflow.

Path resolution:

- A top-level path (e.g. `riskScore`) deletes the property directly on the response root.
- A nested path (e.g. `customer.internalNotes`) walks the path and deletes the leaf on the resolved parent. Missing intermediate segments are a no-op, the action does not throw.
- Bracket-style indices (`addresses[0].street`) are normalised to dot form (`addresses.0.street`) before walking, so individual array slots can be addressed.

The action does not throw on a missing key, deleting a property that wasn't there is a no-op. Pair with [`AddToResponseAction`](./add-to-response-action.md) when you need to substitute one property for another.

## Redacting a LIST response

A list response is an **envelope**, not a record:

```json
{ "data": [ { "id": "…", "pendingPayload": { … } }, … ], "paging": { … } }
```

so a path like `pendingPayload` walked from the root finds nothing, the rows are at `data[i]`. Set `applyToListRows: true` and every path in `properties` is deleted from **each row** instead:

```json
{
  "name":            "stripPendingForGuests",
  "applyToListRows": true,
  "itemName":        "row",
  "condition":       { "js": "!((this.session?.roles ?? []).includes('admin'))" },
  "rowCondition":    { "js": "row.creatorUserId !== this.session?.userId" },
  "properties":      ["pendingPayload", "lastUserFacingMessage", "pendingModerationStatus"]
}
```

### The two conditions, and how often each runs

This is the part you must not have to guess:

| | evaluated | gates | ask it |
|---|---|---|---|
| `condition` (inherited) | **once per request** | the whole action | session/role questions, *"is this caller an admin?"* |
| `rowCondition` | **once per row** | that row only | per-row questions, *"does this caller own THIS row?"* |

In the example above an admin short-circuits at `condition`, so the action never runs and `rowCondition` is not evaluated at all. Everyone else runs the loop, and each row keeps its fields only if the caller created it. Both expressions are ordinary MScript; `rowCondition` additionally has the row bound under `itemName`.

Leave `rowCondition` out to redact every row unconditionally.

### Where it must run

Put a row-scoped removal in the **`afterBuildOutput`** workflow stage. The rows it edits are the *composed response* rows: before `buildOutput` the manager's `this.output` is a truthy empty object, so the loop would run zero times, and by `afterSendResponse` the caller already holds the unredacted rows. Design-time validation rejects any other stage (`LIST_ROW_REDACTION_WRONG_STAGE`), rejects `applyToListRows` on a non-list api, and rejects a `rowCondition` without the flag.

### What it does not touch

Deleting from `output.data[i]` does not reach `this.result`. `buildOutput` composes each row as a copy, so the server-side rows an api event or a later action reads keep every field. Paging is untouched, redaction never removes rows, only fields.

### Why not the alternatives

- `isSecret` on the property is **unconditional**: it would hide the field from the owner and the admin too.
- A [`ListMapAction`](./list-map-action.md) with `writeToResponse: true` only *adds* a key beside the still-raw `data` array. To reshape the rows themselves, add a derived field, for instance, use `replacesResult` on that action; to only drop fields, this action is simpler and needs no MScript.
- `contextPropertyName: "result"` never replaces the response. It is a reserved name and a validation ERROR (`RESERVED_CONTEXT_PROPERTY`).

## Example

A workflow loads a customer record to drive ABAC decisions, then trims internal fields off the response:

```json
"actions": {
  "fetchObjectActions": [
    {
      "name": "loadCustomer",
      "targetObject": "customer",
      "matchValue": { "js": "this.customerId" },
      "localKey": "id",
      "contextPropertyName": "customer",
      "writeToResponse": true
    }
  ],
  "removeFromResponseActions": [
    {
      "name": "stripInternalFields",
      "properties": [
        "internalAuditNotes",
        "riskScore",
        "customer.internalNotes",
        "addresses[0].postalCode"
      ]
    }
  ]
}
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`AddToResponseAction`](./add-to-response-action.md): the write side.
- [`AddToContextAction`](./add-to-context-action.md): write to context only (without ever touching the response).
