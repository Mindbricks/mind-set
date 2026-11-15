# AddToContextAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [AddToContextAction in Part 1](../ontology/AddToContextAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Adds one or more calculated values to the runtime context (`this`) at a specific point in the Business API flow. This is typically used to prepare values that will be referenced in later actions, such as computed totals, enriched properties, or temporary flags. The values are evaluated via MScript and written under the names you specify.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `context` | [`ContextData`](./ContextData.md)[] | no |  |  |  | An array of `ContextData` objects. Each defines a property name and an MScript expression to compute its value. These values will be written to the runtime context (`this.<contextName>`), making them accessible in subsequent steps. A contextName that spells a member of the generated API manager (`session`, `result`, `output`, `dataClause`, a pipeline method - the same reserved set RESERVED_CONTEXT_PROPERTY uses) is refused (RESERVED_CONTEXT_NAME): the assignment would REPLACE that member for the rest of the workflow. To feed an owner column on an internal create, declare `sessionSettings.ownerProvenance: "payload"` instead of writing `session`. |

## Constraints

Property rules:

- The items of `context` must have distinct names (`contextName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CONTEXT_ENTRIES_REQUIRED` | error | AddToContextAction must have at least one context entry. |
| `RESERVED_CONTEXT_NAME` | error | AddToContextAction… context[…] writes contextName "…", which is a member of the generated API manager's base chain (ApiManager / <Service>ServiceManager / <Model>Manager). |

## Example

Use to compute and stash one or more intermediate values on the context (this.*) so later actions can reference them — totals, flags, normalized inputs.

```json
{
  "name": "prepareTotals",
  "description": "Compute subtotal and a high-value flag for use by validation and the response.",
  "context": [
    {
      "contextName": "subtotal",
      "contextValue": { "js": "this.lineItems.reduce((s, li) => s + li.subtotal, 0)" }
    },
    {
      "contextName": "isHighValue",
      "contextValue": { "js": "this.subtotal > 1000" }
    }
  ]
}
```
