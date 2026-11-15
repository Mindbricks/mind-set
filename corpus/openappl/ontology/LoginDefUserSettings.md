# LoginDefUserSettings

**Level:** `section` · **Family:** [LoginDefinition](./families.md#logindefinition) (domain `ProjectAuthentication`)

**Specification:** [LoginDefUserSettings in Part 2](../spec/LoginDefUserSettings.md)

Defines how users are stored, managed, and authenticated within the project. This includes super admin credentials, login identifiers, optional mobile and email verification settings, public registration policies, and whether user groups are active. This structure governs the behavior and structure of the user service's primary data model.

## Contained in

- [LoginDefinition](./LoginDefinition.md) as `userSettings`

Blueprint paths:

- `authentication.loginDefinition.userSettings`

## Contains

- `superAdminData`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
