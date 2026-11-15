# ListMembershipFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListMembershipFilter in Part 1](../ontology/ListMembershipFilter.md)

**Name:** an instance is named by `name`.

A settings object to add a membership filter to the WHERE clause of the list. If given more than any one membership of all will be enough to select the object.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human readable and source-code safe to define the membership filter. |
| `dataObjectName` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object whose membership configuration should be used to validate access. If omitted, the Business API’s main data object is assumed. Use this field when you need to check access against a related or parent object (e.g., checking `Organization` membership when updating a `Project`). |
| `objectKeyIdField` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | An property reference that returns the ID of the object from the expected list item whose membership should be checked. Typically it will the id of the list item, but you may want to apply filter through another field of the list item like projectId of a task. |
| `userKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that returns the user ID to check against the target object’s membership configuration. Typically `this.session.userId`, but may also reference delegated users or owners. |
| `checkFor` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript expression to validate specific aspects of the membership (such as role or permissions). If omitted, any valid membership grants access. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript expression that skips the membership check entirely if it evaluates to false. Useful for exempting trusted users such as object owners or platform admins. |

## Constraints

Property rules:

- `name`, `dataObjectName`, `objectKeyIdField`, `userKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `dataObjectName` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `objectKeyIdField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
