# ListJointFilterSettings

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListJointFilterSettings in Part 1](../ontology/ListJointFilterSettings.md)

The settings definition for a list api to define any joint filter and combine them with an AND or OR operator

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `operator` | `FilterOperator` | no |  | `AND`, `OR` |  | The combination operator of multi joint filters, will be used if there are more than one joint filter, default value is `AND` |
| `filters` | [`ListJointFilter`](./ListJointFilter.md)[] | no |  |  |  | The ListJointFilter array to define one or more joint filter to a related object |

## Constraints

Property rules:

- `operator` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `filters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INVALID_SELECTOR_SYNTAX` | error | Invalid selector syntax "…". |
| `MISSING_JOIN_RELATION` | error | No relation found between main object "…" and joined object "…". |
