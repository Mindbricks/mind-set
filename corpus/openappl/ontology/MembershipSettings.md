# MembershipSettings

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [MembershipSettings in Part 2](../spec/MembershipSettings.md)

Configuration settings for membership-based access control of a data object. This object does not define access itself but relies on a separate membership data object to manage which users can access this data object. For example, an 'organization' object might have access control defined through an 'organizationMember' object, which holds references to both the user and the organization.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `doCheckMembership` | `this.doCheckMembership(...)` in MScript slots and action bodies | `this.doCheckMembership(dataObjectName, objectKey, userKey, requiredRoles)` resolves whether the user has a membership row (with one of the roles, when given) on the object. Async. | nodejs |
| `getMembershipOf<Object>` | `this.getMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.getMembershipOf<Object>(userKey, ...)` resolves the user's membership row on one object (cached) or `null`. Async. | nodejs |
| `collectMembershipOf<Object>` | `this.collectMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.collectMembershipOf<Object>(userKey)` resolves every membership row of the user. Async. | nodejs |

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `membershipSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings.membershipSettings`
- `services.dataObjects.objectSettings.membershipSettings`

## Contains

- `configuration`: [MembershipSettingsConfig](./MembershipSettingsConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
