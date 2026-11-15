# PermissionBasicsConfig

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [PermissionBasicsConfig in Part 1](../ontology/PermissionBasicsConfig.md)

Configuration details for permission basics, including permission groups.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permissionGroups` | [`PermissionGroup`](./PermissionGroup.md)[] | no |  |  |  | An array of PermissionGroup objects that define the named permissions of the project grouped under logical categories. These groups help structure and reuse permission definitions across services. |

## Constraints

Property rules:

- The items of `permissionGroups` must have distinct names (`groupName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
