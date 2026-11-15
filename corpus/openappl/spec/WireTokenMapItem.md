# WireTokenMapItem

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [WireTokenMapItem in Part 1](../ontology/WireTokenMapItem.md)

**Name:** an instance is named by `name`.

A key-value pair whose name is a WIRE-PROTOCOL token (HTTP header or cookie name). The name is preserved VERBATIM — never renamed or camelCase-normalized (never-silently-rename policy) — and must match the RFC 7230 token charset. The value is defined using an MScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [wireToken](./value-formats.md#wiretoken) | The wire token name (HTTP header or cookie name), sent verbatim on the request. Must be an RFC 7230 token: letters, digits and !#$%&'*+-.^_`\|~ (e.g. `x-api-key`, `X-Request-Id`). Invalid characters are a validation error — the name is never auto-renamed. |
| `value` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The value of the data item, defined using MScript to allow dynamic expressions or literals. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`wireToken`](./value-formats.md#wiretoken) format. (`INVALID_WIRE_TOKEN_NAME`)
