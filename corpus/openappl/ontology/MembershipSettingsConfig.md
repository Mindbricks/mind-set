# MembershipSettingsConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [MembershipSettingsConfig in Part 2](../spec/MembershipSettingsConfig.md)

Configuration settings for membership-based access control of a data object. This object does not define access itself but relies on a separate membership data object to manage which users can access this data object. For example, an 'organization' object might have access control defined through an 'organizationMember' object, which holds references to both the user and the organization.

## Contained in

- [MembershipSettings](./MembershipSettings.md) as `configuration`

## Contains

- `rolePermissions`: [MembershipRolePermission](./MembershipRolePermission.md), a list

## References

- `membershipObjectName` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `membershipObjectIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `membershipObjectName`)
- `membershipUserIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `membershipObjectName`)
- `roleField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `membershipObjectName`)

## Referenced by

No property of another pattern names this pattern.
