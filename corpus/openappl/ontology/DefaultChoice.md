# DefaultChoice

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [DefaultChoice in Part 2](../spec/DefaultChoice.md)

A default row per scope for a data object (`objectSettings.defaultChoice`). Two shapes occur. INLINE (`inline: true`, the default): the object already belongs to a user (an address, a saved card, a user's membership row); the user's default is the `isDefault` flag on the object's own row, at most one per `scopeField` value - the owner field unless the block names another property, and per tenant on a tenant-level object - enforced by a partial unique index. The first row created in a scope becomes its default; deleting the default row (hard or soft delete) makes the most recently created remaining row of that scope the default, and no remaining row means no default. RELATED (`inline: false`): the object is global (a shipping company); `isDefault` marks the ONE system default (per tenant on a tenant-level object), the first row created becomes it and deleting it promotes the newest remaining row; each user may override it through the generated table `sys_UserDefaultFor<Object>` (`userId`, `default<Object>Id`, the tenant column on a tenant-level object, unique per user), and deleting an object removes the override rows that point at it so those users fall back to the system default. Four apis are injected per object, with fixed names: set<Object>AsDefault(id) - inline: makes the row the default of its own scope, behind the object's normal ownership check; related: sets the system default, platform operator only. getDefault<Object>() - inline: the session user's default or null; related: the system default or null. set<Object>AsDefaultForUser(id, userId?) - the same for another user's scope (inline) or the user's own override row (related); `userId` absent means the session user, and naming another user is operator-only. getDefault<Object>ForUser(userId?) - that user's default; in related mode the user's override, else the system default, and the answer says which in `defaultSource` (user | system). A set is atomic: unsetting the previous default and setting the new one happen in one transaction, and the changed rows go out on the normal update events. `isDefault` is not writable through the object's generic create / update apis - a request parameter or dataClauseItems entry naming it is refused at design time (DEFAULT_CHOICE_MANAGED_COLUMN_WRITTEN) - so the one-default invariant cannot be broken by a designer write. Validation: an inline object with no `scopeField` and no owner field is refused (DEFAULT_CHOICE_SCOPE_MISSING); an unknown `scopeField` is refused (DEFAULT_CHOICE_SCOPE_FIELD_NOT_FOUND); an authored property named `isDefault` that is not a Boolean is refused (DEFAULT_CHOICE_COLUMN_CONFLICT) and a Boolean one is warned about (DEFAULT_CHOICE_COLUMN_MANAGED - the pattern manages it); related mode on an object that declares an owner field is warned about (DEFAULT_CHOICE_RELATED_WITH_OWNER - did you mean inline?). Refused on framework `sys_` objects and auth-service objects (DEFAULT_CHOICE_ON_SYSTEM_OBJECT). The guide is the docs-site page [Default choice](../guides/capabilities/default-choice.md).

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `defaultChoice`

Blueprint paths:

- `authentication.dataObjects.objectSettings.defaultChoice`
- `services.dataObjects.objectSettings.defaultChoice`

## Contains

No other pattern: every property is a value or a reference.

## References

- `scopeField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
