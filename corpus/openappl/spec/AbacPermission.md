# AbacPermission

**Level:** `section` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [AbacPermission in Part 1](../ontology/AbacPermission.md)

Configuration for Attribute-Based Access Control (ABAC), allowing fine-grained permission control using attribute-level rules on data objects. ABAC evaluates access by applying custom filter conditions to each object. When a rule matches, the user session may be granted specific permissions or even dynamic roles for that object. These rules can supplement or override standard RBAC or OBAC logic.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `attributeBasedPermissionsIsActive` | `Boolean` | yes |  |  |  | A boolean value that enables attribute-level access control. When true, data access will be filtered according to ABAC rules defined in `abacDefinitions`. |
| `abacDefinitions` | [`ABACDefinititon`](./ABACDefinititon.md)[] | no |  |  |  | An object array to define ABAC (Attribute-Based Access Control) rules. Each rule applies a conditional filter to determine which records a user can access, and grants either dynamic permissions or a role for matching records. |

## Constraints

Property rules:

- `attributeBasedPermissionsIsActive` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `abacDefinitions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
