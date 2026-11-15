# DefaultChoice

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [DefaultChoice in Part 1](../ontology/DefaultChoice.md)

**Activation:** the pattern is switched on by `isActive`.

A default row per scope for a data object (`objectSettings.defaultChoice`). Two shapes occur. INLINE (`inline: true`, the default): the object already belongs to a user (an address, a saved card, a user's membership row); the user's default is the `isDefault` flag on the object's own row, at most one per `scopeField` value - the owner field unless the block names another property, and per tenant on a tenant-level object - enforced by a partial unique index. The first row created in a scope becomes its default; deleting the default row (hard or soft delete) makes the most recently created remaining row of that scope the default, and no remaining row means no default. RELATED (`inline: false`): the object is global (a shipping company); `isDefault` marks the ONE system default (per tenant on a tenant-level object), the first row created becomes it and deleting it promotes the newest remaining row; each user may override it through the generated table `sys_UserDefaultFor<Object>` (`userId`, `default<Object>Id`, the tenant column on a tenant-level object, unique per user), and deleting an object removes the override rows that point at it so those users fall back to the system default. Four apis are injected per object, with fixed names: set<Object>AsDefault(id) - inline: makes the row the default of its own scope, behind the object's normal ownership check; related: sets the system default, platform operator only. getDefault<Object>() - inline: the session user's default or null; related: the system default or null. set<Object>AsDefaultForUser(id, userId?) - the same for another user's scope (inline) or the user's own override row (related); `userId` absent means the session user, and naming another user is operator-only. getDefault<Object>ForUser(userId?) - that user's default; in related mode the user's override, else the system default, and the answer says which in `defaultSource` (user | system). A set is atomic: unsetting the previous default and setting the new one happen in one transaction, and the changed rows go out on the normal update events. `isDefault` is not writable through the object's generic create / update apis - a request parameter or dataClauseItems entry naming it is refused at design time (DEFAULT_CHOICE_MANAGED_COLUMN_WRITTEN) - so the one-default invariant cannot be broken by a designer write. Validation: an inline object with no `scopeField` and no owner field is refused (DEFAULT_CHOICE_SCOPE_MISSING); an unknown `scopeField` is refused (DEFAULT_CHOICE_SCOPE_FIELD_NOT_FOUND); an authored property named `isDefault` that is not a Boolean is refused (DEFAULT_CHOICE_COLUMN_CONFLICT) and a Boolean one is warned about (DEFAULT_CHOICE_COLUMN_MANAGED - the pattern manages it); related mode on an object that declares an owner field is warned about (DEFAULT_CHOICE_RELATED_WITH_OWNER - did you mean inline?). Refused on framework `sys_` objects and auth-service objects (DEFAULT_CHOICE_ON_SYSTEM_OBJECT). The guide is the docs-site page [Default choice](../guides/capabilities/default-choice.md).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `isActive` | `Boolean` | yes |  |  |  | Turns the default-row feature on for this object. False (the default) leaves the block inert: no column, no index, no override table, no injected api, and the object is generated exactly as without the block. The other fields are only checked while this is true. |
| `inline` | `Boolean` | no | `true` |  |  | `true` (the default): the object belongs to a user and the default is a flag on the object's own rows, one per `scopeField` value. `false`: the object is global; `isDefault` marks the one system default and each user may override it through the generated `sys_UserDefaultFor<Object>` table. Choose `false` only for an object that has no owner field (DEFAULT_CHOICE_RELATED_WITH_OWNER warns otherwise). |
| `scopeField` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Inline mode only. The property that groups rows into scopes, one default per value: the user field of a relation object (e.g. `userId` on a membership row), or any other declared property. Defaults to the object's owner field (`sessionSettings.isOwnerField`); when the object has no owner field it is required (DEFAULT_CHOICE_SCOPE_MISSING). Must be a declared property of this object (DEFAULT_CHOICE_SCOPE_FIELD_NOT_FOUND). Ignored in related mode. |

## Constraints

Property rules:

- `isActive` must be present. Enforced only while `isActive` is on. (`REQUIRED_FIELD_MISSING`)
- `scopeField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DEFAULT_CHOICE_COLUMN_CONFLICT` | error | defaultChoice on "…" conflicts with the authored property "…" (type …): the pattern adds a Boolean column of that name. |
| `DEFAULT_CHOICE_COLUMN_MANAGED` | warning | "…" authors a Boolean property "…" while defaultChoice is active: the pattern manages it. |
| `DEFAULT_CHOICE_LANGUAGE_UNSUPPORTED` | error | defaultChoice on "…" cannot be active: service "…" generates for …, and the default-row column, the override table and the four apis are emitted by … so far. |
| `DEFAULT_CHOICE_MANAGED_COLUMN_WRITTEN` | error | … binds a request parameter named "…" on "…", whose default is managed by defaultChoice: the column is never caller-writable. |
| `DEFAULT_CHOICE_ON_SYSTEM_OBJECT` | error | defaultChoice cannot be active on "…": … are the framework's own bookkeeping. |
| `DEFAULT_CHOICE_RELATED_WITH_OWNER` | warning | defaultChoice on "…" is in related mode (inline: false) although the object declares the owner field "…": a user-owned object normally wants an inline default (one per owner on the object's own rows). |
| `DEFAULT_CHOICE_SCOPE_FIELD_IGNORED` | warning | defaultChoice on "…" names scopeField "…" in related mode (inline: false), where the system default has no per-row scope; the field is ignored. |
| `DEFAULT_CHOICE_SCOPE_FIELD_NOT_FOUND` | error | defaultChoice on "…" names scopeField "…", which is not a property of the object. |
| `DEFAULT_CHOICE_SCOPE_MISSING` | error | defaultChoice on "…" has no scope: the object declares no owner field (sessionSettings.isOwnerField) and the block names no scopeField, so "one default per user" has no user to group by. |
