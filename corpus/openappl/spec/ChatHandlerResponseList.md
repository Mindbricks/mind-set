# ChatHandlerResponseList

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlerResponseList in Part 1](../ontology/ChatHandlerResponseList.md)

A reply list built from an array in a chat handler's API answer: one line per row, rendered from the `item` template.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `source` | `String` | yes |  |  |  | The dotted path of the array in the API answer (for example `pharmacies` or `data.items`). |
| `item` | `Text` | yes |  |  |  | One line per row, a template that reads `item.<path>` (the row) and `index` (its 1-based position) besides the message roots. |
| `maxItems` | `Integer` | no | `10` |  | min 1, max 50 | At most this many rows are listed (1 to 50). Default 10. |
| `emptyText` | `Text` | no |  |  |  | Sent instead of the rows when the array is empty or absent. Null = nothing after the text. |

## Constraints

Property rules:

- `source`, `item` must be present. (`REQUIRED_FIELD_MISSING`)
- `maxItems` must be between 1 and 50. (`VALUE_OUT_OF_RANGE`)
