# LoginDefinition

**Level:** `chapter` · **Family:** [LoginDefinition](../ontology/families.md#logindefinition) (domain `ProjectAuthentication`)

**Ontology:** [LoginDefinition in Part 1](../ontology/LoginDefinition.md)

Defines the core login architecture of the project, including the user and tenant structures that underpin authentication and access. These settings enable an OpenAPPL compiler to generate a built-in 'auth' service tailored to your data model, supporting user registration, login, permissions, and optional multi-tenant behavior.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `userSettings` | [`LoginDefUserSettings`](./LoginDefUserSettings.md) | yes |  |  |  | Defines how the built-in user object is configured and authenticated within the project. While the user data model is fully managed by the compiler, this setting allows you to control aspects such as super admin credentials, registration behavior, user group support, and whether mobile-based features are enabled. These settings shape how authentication flows and access are handled at the user level. |
| `tenantSettings` | [`LoginDefTenantSettings`](./LoginDefTenantSettings.md) | no |  |  |  | Configuration for multi-tenant applications, including tenant object definitions and their relationship to users and user groups. When enabled, this isolates resources by tenant and supports tenant-scoped access control. Omit this section for single-tenant projects. |

## Constraints

Property rules:

- `userSettings` must be present. (`REQUIRED_FIELD_MISSING`)
