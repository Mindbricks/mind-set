# OBACPermission

**Level:** `section` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [OBACPermission in Part 1](../ontology/OBACPermission.md)

Configuration for Object-Based Access Control (OBAC), which restricts access to specific data objects based on object ownership or association. If your system requires permissions that vary per object instance (e.g., 'only the creator can edit this record'), OBAC should be enabled and the relevant data objects listed.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectBasedPermissionsIsActive` | `Boolean` | no | `false` |  |  | A boolean value that enables object-level permission checks. When true, permissions can be enforced per record based on ownership or related fields. |
| `dataObjects` | [`DataObjectName`](./DataObjectName.md)[] | no |  |  | names a [DataObject](./DataObject.md) | An array of data object names to which object-level permissions will apply. These are the models for which individual access control should be enforced. |

## Constraints

Property rules:

- `dataObjects` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
