# LoginDefTenantSettings

**Level:** `section` · **Family:** [LoginDefinition](../ontology/families.md#logindefinition) (domain `ProjectAuthentication`)

**Ontology:** [LoginDefTenantSettings in Part 1](../ontology/LoginDefTenantSettings.md)

**Activation:** the pattern is switched on by `useMultiTenantFeature`.

Specifies how tenant-based access control is structured for multi-tenant projects. This includes the tenant object name, registration permissions, and tenant separation logic. When enabled, this enforces strict data and user isolation by tenant.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useMultiTenantFeature` | `Boolean` | yes |  |  |  | Enable this if the project requires multi-tenant architecture. If false, the project will be treated as single-tenant and no tenant-based separation is applied. Generated code carries only the tenancy form this setting selects (for example the OAuth login router's tenant-scoped lookup), decided at code generation rather than checked per request, so changing it takes effect on the next build. The string "true" is read as true by every design-time check and by the build alike, so validateService, the build gate and validateProject agree on which objects carry the tenant column. |
| `configuration` | [`LoginDefTenantSettingsConfig`](./LoginDefTenantSettingsConfig.md) | no |  |  |  | The configuration object for tenant settings. Leave it null if useMultiTenantFeature is false. |

## Constraints

Property rules:

- `useMultiTenantFeature` must be present. Enforced only while `useMultiTenantFeature` is on. (`REQUIRED_FIELD_MISSING`)
