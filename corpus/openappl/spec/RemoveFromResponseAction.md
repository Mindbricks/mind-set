# RemoveFromResponseAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [RemoveFromResponseAction in Part 1](../ontology/RemoveFromResponseAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Removes one or more properties from the final API response before it is returned to the client. This is useful for eliminating internal, sensitive, or unnecessary fields that were added by earlier actions or populated from context. Commonly used to enforce privacy, avoid leaking implementation details, or to conform to specific output schemas. On a `list` api set `applyToListRows: true` — this is THE supported way to redact fields from every row of a list response, and the only construct that can do it conditionally (an `isSecret` property is hidden from the owner and the admin too, and `contextPropertyName` never replaces the response). Place the action in the `afterBuildOutput` workflow stage: the response object it edits does not exist before `buildOutput` composes it.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `properties` | `String`[] | no |  |  |  | An array of property names (strings) that will be removed from the final API response. Use this to clean up sensitive or internal fields before the response is returned. Each entry is a dot-notation path resolved against the RESPONSE ROOT (`customer.internalNotes`, `addresses[0].postalCode`) — or, when `applyToListRows` is true, against EACH ROW of the list response (`pendingPayload`), never against the envelope. |
| `applyToListRows` | `Boolean` | no | `false` |  |  | List responses only. When true, every path in `properties` is deleted from EACH ROW of the list envelope (`output.data[i]`) instead of from the response root — the supported way to redact a list. Leave false (the default) on non-list apis: the row loop has nothing to walk there, and design-time validation rejects the combination. The rows are the composed response rows, so the action must run in the `afterBuildOutput` stage. |
| `itemName` | `String` | no |  |  |  | List-row redaction only. A code-safe identifier bound to the current row inside `rowCondition`, e.g. `row` (the default) lets you write `row.creatorUserId`. Ignored unless `applyToListRows` is true. |
| `rowCondition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | List-row redaction only. An MScript boolean evaluated ONCE PER ROW, with the row bound under `itemName`. The properties are removed only from the rows where it returns true — this is how a field stays visible on the caller's OWN rows and is hidden on everyone else's (`row.creatorUserId !== this.session?.userId`). Leave it null to redact every row. Note the division of labour with the inherited `condition`: `condition` is evaluated ONCE PER REQUEST and gates the whole action (session/role questions — 'is this caller an admin?'), `rowCondition` is evaluated ONCE PER ROW (per-row questions — 'does this caller own this row?'). Requires `applyToListRows: true`. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROPERTIES_REQUIRED` | error | RemoveFromResponseAction must list at least one property to remove. |

## Example

Use to strip internal or sensitive fields from the response before it returns to the client — passwords, internal flags, raw provider payloads. On a list api, `applyToListRows: true` strips the same fields from EVERY row; `condition` gates the whole action once per request (session/role), `rowCondition` decides per row (ownership).

```json
{
  "name": "stripPendingFieldsFromRows",
  "description": "On the anonymous gathering list, hide the moderation fields on every row the caller does not own.",
  "applyToListRows": true,
  "itemName": "row",
  "condition": { "js": "!(this.session?.roles ?? []).includes('admin')" },
  "rowCondition": { "js": "row.creatorUserId !== this.session?.userId" },
  "properties": [
    "pendingPayload",
    "lastUserFacingMessage",
    "pendingModerationStatus"
  ]
}
```
