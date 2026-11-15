# ScopedRoleCondition

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ScopedRoleCondition in Part 1](../ontology/ScopedRoleCondition.md)

An equality filter on the membership edge of a ScopedRolePermissionSpec (e.g. `status` equals `active`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `property` | `String` | yes |  |  |  | The membership edge property compared (e.g. `status`). The membership edge projection must write it as an edge property. |
| `equals` | `Any` | yes |  |  |  | The literal the property must equal (e.g. `active`, `true`, `1`): a boolean, a number, or a string of letters, digits, spaces and `_ . : @ -`. It is written into the query text, so any other character is refused. |

## Constraints

Property rules:

- `property`, `equals` must be present. (`REQUIRED_FIELD_MISSING`)
