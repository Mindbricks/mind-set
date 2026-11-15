# MembershipSettings

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [MembershipSettings in Part 1](../ontology/MembershipSettings.md)

**Activation:** the pattern is switched on by `hasMembership`.

Configuration settings for membership-based access control of a data object. This object does not define access itself but relies on a separate membership data object to manage which users can access this data object. For example, an 'organization' object might have access control defined through an 'organizationMember' object, which holds references to both the user and the organization.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `doCheckMembership` | `this.doCheckMembership(...)` in MScript slots and action bodies | `this.doCheckMembership(dataObjectName, objectKey, userKey, requiredRoles)` resolves whether the user has a membership row (with one of the roles, when given) on the object. Async. | nodejs |
| `getMembershipOf<Object>` | `this.getMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.getMembershipOf<Object>(userKey, ...)` resolves the user's membership row on one object (cached) or `null`. Async. | nodejs |
| `collectMembershipOf<Object>` | `this.collectMembershipOf<Object>(...)` in MScript slots and action bodies | Generated per object with `membershipSettings.hasMembership`: `this.collectMembershipOf<Object>(userKey)` resolves every membership row of the user. Async. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasMembership` | `Boolean` | no | `false` |  |  | Indicates whether this data object uses an external membership object to manage access rights. If set to true, access to this object is governed by entries in another object. Default is false. |
| `configuration` | [`MembershipSettingsConfig`](./MembershipSettingsConfig.md) | no | `null` |  |  | The configuration object for membership settings. Leave it null if hasMembership is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
