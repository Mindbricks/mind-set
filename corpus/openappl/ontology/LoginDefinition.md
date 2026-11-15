# LoginDefinition

**Level:** `chapter` · **Family:** [LoginDefinition](./families.md#logindefinition) (domain `ProjectAuthentication`)

**Specification:** [LoginDefinition in Part 2](../spec/LoginDefinition.md)

Defines the core login architecture of the project, including the user and tenant structures that underpin authentication and access. These settings enable an OpenAPPL compiler to generate a built-in 'auth' service tailored to your data model, supporting user registration, login, permissions, and optional multi-tenant behavior.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `loginDefinition`

Blueprint paths:

- `authentication.loginDefinition`

## Contains

- `userSettings`: [LoginDefUserSettings](./LoginDefUserSettings.md)
- `tenantSettings`: [LoginDefTenantSettings](./LoginDefTenantSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
