# LoginDefTenantSettings

**Level:** `section` · **Family:** [LoginDefinition](./families.md#logindefinition) (domain `ProjectAuthentication`)

**Specification:** [LoginDefTenantSettings in Part 2](../spec/LoginDefTenantSettings.md)

Specifies how tenant-based access control is structured for multi-tenant projects. This includes the tenant object name, registration permissions, and tenant separation logic. When enabled, this enforces strict data and user isolation by tenant.

## Contained in

- [LoginDefinition](./LoginDefinition.md) as `tenantSettings`

Blueprint paths:

- `authentication.loginDefinition.tenantSettings`

## Contains

- `configuration`: [LoginDefTenantSettingsConfig](./LoginDefTenantSettingsConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
