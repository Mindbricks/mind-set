# BulkColumnPolicy

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [BulkColumnPolicy in Part 1](../ontology/BulkColumnPolicy.md)

**Name:** an instance is named by `property`.

The onExisting policy of one column when an UpsertBulkCrudAction updates a matched row. A column without a policy is overwritten by the incoming value.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `property` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The child object property the policy applies to. |
| `onExisting` | `BulkOnExistingPolicies` | no | `"overwrite"` | `overwrite`, `fillIfEmpty`, `keep`, `skipIfEmpty`, `compute` |  | One of the BulkOnExistingPolicies values: overwrite, fillIfEmpty, keep or compute. |
| `value` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Required for the `compute` policy: an MScript evaluated per matched row with `existing` (the stored row) and `row` (the incoming row) in scope; its result is written to the column. |

## Constraints

Property rules:

- `property` must be present. (`REQUIRED_FIELD_MISSING`)
- `onExisting` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `property` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
