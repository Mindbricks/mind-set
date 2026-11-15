# DataMapItem

**Level:** `section` · **Family:** [SeedData](../ontology/families.md#seeddata) (domain `Service`)

**Ontology:** [DataMapItem in Part 1](../ontology/DataMapItem.md)

**Name:** an instance is named by `name`.

Represents a single key-value pair used in most context. The value can be defined dynamically using an MScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The key name for the data item (e.g., a header name or parameter name). |
| `value` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The value of the data item, defined using MScript to allow dynamic expressions or literals. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CUSTOM_ROLE_LOOKUP_UNSUPPORTED` | error |  |
