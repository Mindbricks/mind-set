# SortByItem

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [SortByItem in Part 1](../ontology/SortByItem.md)

**Name:** an instance is named by `name`.

Sort clause configuration for list operations. Used by `ListOptions.listSortBy` (the static default order), `ListOptions.listOrderSets[].sortBy` (a selectable named order) and `SelectJoin.sortBy` (order over a joined object).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `property` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | A property reference to define the field that the sort will be done by. On a stored-DataView-bound list, use a projected field, aggregate column path, or declared stat/aggregate name from the view; the underlying data object is not the sort namespace. |
| `order` | `SortOrder` | yes |  | `asc`, `desc` |  | The sort order, it should be either asc or desc |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human readable code safe name to define the sort item |

## Constraints

Property rules:

- `property`, `order`, `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `order` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `property` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROPERTY_NOT_FOUND` | error | Property "…" not found in DataView "…". |
