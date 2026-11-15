# WireKeyMapItem

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [WireKeyMapItem in Part 1](../ontology/WireKeyMapItem.md)

**Name:** an instance is named by `name`.

A key-value pair whose name is a WIRE key (URL query parameter name or JSON body key). The name is preserved VERBATIM — never renamed or camelCase-normalized (never-silently-rename policy) — and must be printable ASCII without spaces. The value is defined using an MScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [wireKey](./value-formats.md#wirekey) | The wire key name (query parameter name or JSON body key), sent verbatim on the request (query names URL-encoded, body keys JSON-escaped). Printable ASCII without spaces or control characters (e.g. `customer_id`, `filter[status]`, `@id`). Invalid characters are a validation error — the name is never auto-renamed. |
| `value` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The value of the data item, defined using MScript to allow dynamic expressions or literals. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`wireKey`](./value-formats.md#wirekey) format. (`INVALID_WIRE_KEY_NAME`)
