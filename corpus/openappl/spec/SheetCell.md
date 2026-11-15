# SheetCell

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SheetCell in Part 1](../ontology/SheetCell.md)

**Name:** an instance is named by `address`.

One free cell of an exported worksheet: any address, any MScript. Written before the table, so it can sit above, beside or below it (the table's own cells win on overlap).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `address` | `String` | yes |  |  |  | The cell address, e.g. `B1` or `F2`. |
| `value` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript for the cell value, with `rows` (the rows being written) in scope; a number stays a number, a Date a date, a string starting with `=` is written as a formula. |

## Constraints

Property rules:

- `address`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
