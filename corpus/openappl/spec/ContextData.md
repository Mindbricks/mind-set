# ContextData

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ContextData in Part 1](../ontology/ContextData.md)

**Name:** an instance is named by `contextName`.

ContextData is a container object to represent any key-value pair to write or read to/from context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `contextName` | `String` | yes |  |  |  | The name of the variable to store in the context (e.g., `totalCost`, `userQuota`). The value will be accessible in later steps as `this.<contextName>`. |
| `contextValue` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression used to compute the value for this property. Can reference other context fields, parameters, session values, or constants (e.g., `{ "js": "this.items.length * this.price" }`). |

## Constraints

Property rules:

- `contextName`, `contextValue` must be present. (`REQUIRED_FIELD_MISSING`)
