# MembershipCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [MembershipCheckAction in Part 1](../ontology/MembershipCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines access control based on membership rules configured on a data object. This is used when access to a Business API operation depends on whether the current user is a member of a related entity, such as a project, team, or organization. The `dataObjectName` field specifies which object’s membership rules should be applied—if omitted, the main data object of the Business API is used by default. This action supports direct and nested membership checks, such as validating access to a parent organization while updating a child project.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataObjectName` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object whose membership configuration should be used to validate access. If omitted, the Business API’s main data object is assumed. Use this field when you need to check access against a related or parent object (e.g., checking `Organization` membership when updating a `Project`). |
| `objectKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that returns the ID of the object whose membership should be checked. For example, if checking access to a project, this would return a `projectId`. |
| `userKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that returns the user ID to check against the target object’s membership configuration. Typically `this.session.userId`, but may also reference delegated users or owners. |
| `requiredRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | OPTIONAL. The member roles that satisfy this check — the declarative answer to "which members may do this?", and the form to REACH FOR FIRST. The membership row passes when the value of the scope object's `membershipSettings.configuration.roleField` is any one of these (case-sensitively, as authored). `['owner','admin']` reads exactly as the rule does. Requires the scope object to declare a `roleField`; each name must be one the membership object's role field can actually carry — a role that appears in no `rolePermissions` entry and in no enum on that field is a design-time ERROR (`MEMBERSHIP_REQUIRED_ROLE_UNKNOWN`). Leave BOTH this and `checkFor` empty to gate on membership EXISTENCE alone. Mutually exclusive with `checkFor`. |
| `checkFor` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | OPTIONAL escape hatch for a membership condition that is not a role list — reach for `requiredRoles` first. An MScript expression evaluated ONCE the row is fetched, with the row bound as `membership`: `membership.seatCount > 0`, `membership.expiresAt > this.now`. THE RECEIVER MATTERS: `membership.<field>` reads the membership row; bare `this.<field>` reads the API MANAGER, NOT the row — `this.memberRole === 'owner'` therefore evaluates to `undefined === 'owner'` → false and refuses every caller, and `this.membership.<field>` is undefined and throws. Both mistakes are design-time ERRORs (`MEMBERSHIP_CHECK_FOR_WRONG_RECEIVER`). An expression that does NOT mention `membership` is treated as a VALUE compared against the row's `roleField` — use `requiredRoles` for that instead; it says the same thing without a receiver to get wrong. Mutually exclusive with `requiredRoles`. |
| `checkType` | `ApiCheckType` | yes |  | `storedCheck`, `liveCheck` |  | Specifies whether this membership check should enforce access immediately (`liveCheck`) or simply write the result to context (`storedCheck`). Use `storedCheck` when the result will be used later in a conditional or validation flow. |
| `errorMessage` | `String` | no |  |  |  | A message to display when the membership check fails. Use this to provide a meaningful explanation to the user, such as 'You must be a member of this team to perform this action.' |

## Constraints

Property rules:

- `dataObjectName`, `objectKey`, `userKey`, `checkType` must be present. (`REQUIRED_FIELD_MISSING`)
- `checkType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `requiredRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `dataObjectName` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found. |
| `MEMBERSHIP_CHECK_CONDITION_AMBIGUOUS` | error | This membership check declares BOTH requiredRoles (…) and checkFor — two answers to one question, and only one can run. |
| `MEMBERSHIP_CHECK_FOR_WRONG_RECEIVER` | error | checkFor reads "this.membership" — the membership row is bound as the bare local "membership", never onto "this", so "this.membership" is undefined and this expression throws at runtime (500, not a 403). |
| `MEMBERSHIP_NOT_CONFIGURED` | error | DataObject "…" does not have membership enabled. |
| `MEMBERSHIP_OBJECT_REF_NOT_CANONICAL` | error | DataObject reference "…" does not match the canonical object name "…" exactly. |
| `MEMBERSHIP_REQUIRED_ROLE_UNKNOWN` | error | requiredRoles names …, which the membership role field "…" cannot carry — no row will ever hold that value, so this check refuses every caller. |
| `MEMBERSHIP_ROLE_FIELD_MISSING` | error | requiredRoles names member roles (…), but the scope object declares no membershipSettings.configuration.roleField — there is no field to compare a role against, so every row would be treated as the built-in "member". |
| `MEMBERSHIP_ROLE_VOCABULARY_UNRESOLVED` | warning | requiredRoles names …, but the role vocabulary of "…" cannot be resolved at design time: the membership configuration declares no rolePermissions, and the role field "…" carries no enumOptions on the membership object. |

## Example

Use to gate an operation on whether the current user is a member (optionally with a required role) of a related entity such as a team, project, or organization — liveCheck enforces immediately, storedCheck defers the decision.

```json
{
  "name": "requireProjectMembership",
  "description": "Caller must be an admin or editor member of the project to update it.",
  "dataObjectName": "project",
  "objectKey": { "js": "this.data.projectId" },
  "userKey": { "js": "this.session.userId" },
  "requiredRoles": [
    "admin",
    "editor"
  ],
  "checkType": "liveCheck",
  "errorMessage": "You must be an admin or editor of this project to modify it."
}
```
