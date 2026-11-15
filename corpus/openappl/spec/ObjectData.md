# ObjectData

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ObjectData in Part 1](../ontology/ObjectData.md)

**Name:** an instance is named by `key`.

Represents a single property assignment used when constructing a new object via `CreateObjectAction`. The value is evaluated dynamically from context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `key` | `String` | yes |  |  |  | The name of the property to assign on the created object (e.g., `status`, `createdBy`). |
| `value` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression used to compute the value assigned to this property. Can include references to `this`, `session`, or other computed context. |

## Constraints

Property rules:

- `key`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
