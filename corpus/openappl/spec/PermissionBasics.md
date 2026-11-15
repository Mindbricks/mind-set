# PermissionBasics

**Level:** `section` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [PermissionBasics in Part 1](../ontology/PermissionBasics.md)

**Activation:** the pattern is switched on by `pbacIsActive`.

Defines the foundational permission model of the project. This section enables Permission-Based Access Control (PBAC) by allowing the architect to organize granular permissions into named groups. These permission groups act as the reference set for roles, users, and object-level rules throughout the project.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `pbacIsActive` | `Boolean` | yes |  |  |  | A boolean flag indicating whether Permission-Based Access Control (PBAC) is active for this project. If enabled, the generated service will enforce permission checks according to the defined permission model. |
| `configuration` | [`PermissionBasicsConfig`](./PermissionBasicsConfig.md) | no |  |  |  | The configuration object for permission basics. Leave it null if pbacIsActive is false. |

## Constraints

Property rules:

- `pbacIsActive` must be present. Enforced only while `pbacIsActive` is on. (`REQUIRED_FIELD_MISSING`)
