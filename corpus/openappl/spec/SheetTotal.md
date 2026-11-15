# SheetTotal

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SheetTotal in Part 1](../ontology/SheetTotal.md)

**Name:** an instance is named by `column`.

One cell of the totals row written under the exported table.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `column` | `String` | yes |  |  |  | The column the total is for, by output header or by source property name. |
| `fn` | `SheetTotalFunctions` | no | `"sum"` | `sum`, `count`, `avg`, `min`, `max` |  | One of the SheetTotalFunctions values; sum by default. |
| `label` | `String` | no |  |  |  | Optional text written in the first column of the totals row (e.g. `Total`) when that column carries no total itself. |

## Constraints

Property rules:

- `column` must be present. (`REQUIRED_FIELD_MISSING`)
- `fn` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
