# MembershipSettingsConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [MembershipSettingsConfig in Part 1](../ontology/MembershipSettingsConfig.md)

Configuration settings for membership-based access control of a data object. This object does not define access itself but relies on a separate membership data object to manage which users can access this data object. For example, an 'organization' object might have access control defined through an 'organizationMember' object, which holds references to both the user and the organization.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `membershipObjectName` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the name of the external data object used to manage membership. This object contains membership entries linking users to this object. |
| `membershipObjectIdProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `membershipObjectName` | The field name in the membership object that refers back to this data object (e.g., organizationId). It links the membership entry to this object. |
| `membershipUserIdProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `membershipObjectName` | The field name in the membership object that refers to the user who holds membership. This is typically linked to the user's session during authorization checks. |
| `membershipStatusCheck` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | OPTIONAL extra validity filter on a membership row, and a QUERY FILTER rather than a row test — it is folded into the membership lookup itself (`$and`-ed onto the user/scope clause), so the database never returns a row that fails it. That is why it cannot be a predicate: a predicate can only be judged AFTER a row is fetched, which is exactly the shape that broke (`this` at that point is the service manager, not the row, so it evaluated to a bare boolean and every lookup answered "no membership").  The field is an MScript, and MQuery is a special MScript — `{ memberStatus: { $in: this.includePending ? ['pending','active'] : ['active'] } }` is a JavaScript object, not a language-neutral one, which is why it is typed this way rather than as a separate MQuery type.  WHAT TO AUTHOR: a static MQuery dict — `{ memberStatus: 'active' }`, `{ age: { $gte: 18 } }`, `{ $and: [{ memberStatus: 'active' }, { expiresAt: { $gt: '2026-01-01' } }] }`. Write it as the bare dict (the neutral, portable form every language lowers through its own MQuery converter) or as an MScript source whose js expression EVALUATES to such a dict. Either way it is resolved ONCE at codegen time and baked into the query.  TODAY'S LIMITS, stated because the shape suggests more than it does: only the `js` source is read, so a per-language source map is accepted but its non-js entries are ignored; and because the evaluation happens at build time, an expression referencing runtime state (`this.*`) throws and the filter is OMITTED rather than applied. A PREDICATE (`this.memberStatus === 'active'`) is REJECTED at design time (`MEMBERSHIP_STATUS_CHECK_NOT_A_FILTER`). Express a condition on the row's ROLE with `roleField` + `rolePermissions` (or a MembershipCheckAction's `requiredRoles`), not here. |
| `roleField` | [`PropRefer`](./PropRefer.md) | no | `null` |  | names a [DataProperty](./DataProperty.md) from `membershipObjectName` | OPTIONAL (ADR-native-permission-system §9.3). The field on the membership object whose value carries the member's role (e.g. `role`). It is the ONE place a member's role is read from, by both consumers: the permission resolver's membership layer (L4) reads `membershipRow[roleField]` and looks the role up in `rolePermissions`, and a MembershipCheckAction's `requiredRoles` compares against the same field. ABSENT ⇒ plain ROLELESS membership: the existence check still works, every member is treated as the built-in `member` role for permission binding, and `requiredRoles` cannot be used (there is no field to compare). |
| `rolePermissions` | [`MembershipRolePermission`](./MembershipRolePermission.md)[] | no |  |  |  | OPTIONAL (ADR-native-permission-system §9.3). The membership-role → permission-list map: which permissions each membership role grants on this scope object. CONFIG-ONLY — read straight from the blueprint at request time; NEVER seeded into the `givenPermission` store and NEVER runtime-DB-managed (contrast the GLOBAL role→permission map of RBACSettings.configuration.rolePermissions, which IS seeded). Use the built-in `member` role for permissions common to all members (plain roleless membership resolves to it). Each entry binds a role to declared PermissionGroup permission names.  REQUIRES PERMISSION MANAGEMENT. Exactly one thing reads this map — the permission resolver's membership layer — and that resolver is generated only when `authentication.accessControl.permissionBasics.pbacIsActive` is on. With PBAC off the grants are stored and NOTHING can ever read them: they read like live authorization and are inert, which is a design-time ERROR (`MEMBERSHIP_ROLE_PERMISSIONS_WITHOUT_PBAC`). A MembershipCheckAction does NOT consult this map either — it gates on the member ROLE (`requiredRoles`), not on permissions. So in a project without permission management, keep the member roles and express what each role may do as `requiredRoles` on each gated api; a rule needing a finer distinction wants a finer MEMBER ROLE, not a permission. |

## Constraints

Property rules:

- `membershipObjectName`, `membershipObjectIdProperty`, `membershipUserIdProperty` must be present. (`REQUIRED_FIELD_MISSING`)
- `membershipObjectName` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `membershipObjectIdProperty`, `membershipUserIdProperty`, `roleField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `rolePermissions` must have distinct names (`role`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `MEMBERSHIP_ROLE_PERMISSION_UNKNOWN_PERMISSION` | error | membership rolePermissions permission "…" is not declared in any project PermissionGroup. |
| `MEMBERSHIP_ROLE_PERMISSION_UNKNOWN_ROLE` | error | membership rolePermissions role "…" is not a declared RoleItem name nor the built-in "…". |
| `MEMBERSHIP_STATUS_CHECK_NOT_A_FILTER` | error | membershipStatusCheck must be a STATIC MQuery dict — an object literal like { …: 'active' } or { age: { $gte: 18 } } — but "…" is a predicate. |
