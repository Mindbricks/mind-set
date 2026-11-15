# ListOrderSet

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListOrderSet in Part 1](../ontology/ListOrderSet.md)

**Name:** an instance is named by `key`.

One named row order a list api can switch to per request: the `key` a `listOrderSelector` request value is matched against, and the `sortBy` items that become the order when it matches. Declared under `ListOptions.listOrderSets`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `key` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The value of the `listOrderSelector` request parameter that selects this order (for an Enum selector, one of its `enumOptions`). Code-safe and unique within the list. |
| `sortBy` | [`SortByItem`](./SortByItem.md)[] | no |  |  |  | The row order applied when this set is selected: one or more SortByItem entries over the api's main data object, in priority order. Must not be empty. A unique `id ASC` tie-break is appended at runtime. |

## Constraints

Property rules:

- `key` must be present. (`REQUIRED_FIELD_MISSING`)
- `key` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `sortBy` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
