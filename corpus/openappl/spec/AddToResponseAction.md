# AddToResponseAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [AddToResponseAction in Part 1](../ontology/AddToResponseAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Adds one or more properties from the current context to the final response object after the main operation completes. This is useful when some values are computed or fetched indirectly (e.g., session-based, Redis-loaded, or generated) and need to be exposed in the API response explicitly.

ON A LIST API, `this.data` IS NOT THE ROW ARRAY. `this.data` is the main-operation alias of `this.result`, which on a db-backed list is the db-layer RESULT OBJECT `{ rows, count }`; the response envelope's `data` key is built from it later, by `buildOutput()`. An array idiom written against it (`(this.data ?? []).map(r => r.id)` at `afterBuildOutput`) therefore throws `this.data.map is not a function` and answers 500 on EVERY call, not just on an empty result, because `??` does not fall back on an object. The row array has exactly two documented spellings: the plural binding `this.<objects>` (e.g. `this.users` for a `user` object) and `this.data.rows`. Validation reports the wrong idiom as the warning `LIST_DATA_ALIAS_OBJECT_SHAPE`, naming both spellings and the api. A DataView list is exempt: its main operation answers the row array itself, so `this.data` IS the array there.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `context` | [`ContextData`](./ContextData.md)[] | no |  |  |  | An array of `ContextData` entries. Each defines a name-value pair to be copied from the evaluated MScript into the response object. The property will appear in the final API output. |

## Constraints

Property rules:

- The items of `context` must have distinct names (`contextName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CONTEXT_ENTRIES_REQUIRED` | error | AddToResponseAction must have at least one context entry. |
| `LIST_DATA_ALIAS_OBJECT_SHAPE` | warning | AddToResponseAction "…" on the "list" api "…" reads `this.data`. |
| `RESERVED_RESPONSE_KEY` | error | AddToResponseAction contextName "…" is a reserved response-envelope key of a "…" api ("…") — the framework writes it in buildOutput, and a designer addition under that name would overwrite the response payload. |
| `RESPONSE_ADDITION_SHADOWS_COLUMN` | warning | … on the "…" api "…" writes the response key "…", which is also … of its own data object "…". |

## Example

Use to copy computed or indirectly-fetched context values into the final response object that wouldn't otherwise be exposed — e.g. a generated download URL or a derived total.

```json
{
  "name": "exposeTotals",
  "description": "Surface the computed subtotal and the rendered receipt URL in the response.",
  "context": [
    {
      "contextName": "subtotal",
      "contextValue": { "js": "this.subtotal" }
    },
    {
      "contextName": "receiptUrl",
      "contextValue": { "js": "this.receiptUrl" }
    }
  ]
}
```
