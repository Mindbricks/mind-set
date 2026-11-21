---
title: FetchParentAction
---

# FetchParentAction

Convenience read for the very common case of walking up a **declared parent relation** on the current data object. The compiler uses the relation metadata to pick the foreign-key column: you only name the parent and (optionally) the projection.

`FetchParentAction` is sugar over [`FetchObjectAction`](./fetch-object-action.md): same data layer underneath, but no need to specify the matching key. Use it when validation needs context inherited from the parent (e.g. fetch the `Organization` while creating a `Project`, then run a [`MembershipCheckAction`](./membership-check-action.md)).

## When to use it

- Load the parent row to validate ownership or membership.
- Enrich the response with parent-level metadata (org name, plan tier, locale).
- Apply business rules that depend on parent state (`organization.status === 'active'`).
- For arbitrary lookups not tied to a declared relation, use [`FetchObjectAction`](./fetch-object-action.md).

## Requirement

The current data object **must** declare a relation property pointing at `parentObject`. The compiler picks the foreign-key column in this order: a property literally named `<parentObject>Id`, otherwise the single declared relation property whose `relationTargetObject` is `parentObject`. Without such a column the action returns `null`. Declare the relation on the child data object first; see [Data modelling: relations](../data-modeling/relations.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `parentObject` | `DataObjectName` | yes | Parent data object. Local parents are read from the service's own database; parents owned by another service are read through the Elasticsearch CQRS projection. |
| `properties` | `PropRefer[]` | no | Subset of parent fields to return. Empty / omitted means all fields. |

## Behaviour

The action:

1. Reads `this.instance` (or `this.result`), whichever is populated for the current crudType.
2. Resolves the foreign key, **row first**: `instance.<fk>`, then `this.dataClause.<fk>`, then the request parameter `this.<fk>`. If none answers, returns `null` (no throw).
3. Reads a local parent through the service's data layer, or a cross-service parent through the remote read. Where tenant isolation applies, the lookup includes the authenticated tenant.
4. When `properties` is non-empty, projects the result through a whitelist before returning.

The parent row is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true.

**When the parent resolves nothing.** Each time the action returns `null` it logs one `info` line `FetchParentResolvedNothing`. `info` is the service's default log level, so the service log shows it. Fields: `requestId`; `action`; `object` (the parent object); `source` (`local` or `remote`); `foreignKey` (the foreign-key column the compiler picked); and `reason`. The reason is `parent-id-absent` when neither the row, `this.dataClause` nor the request carried a foreign-key value. It is `parent-not-found` when a value was present but the read returned nothing: the row is absent, outside the caller's tenant, or hidden by the moderation gate. For a cross-service parent, `parent-not-found` also covers a read that was not answered (Elasticsearch not configured, the index missing, a transport error); the remote read prints its own error line naming that case, `was not answered`, just before. The line never prints the foreign-key value or a row.

**A moderated parent.** When the parent object carries [`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`, the parent is resolved by a gated query, never a bare id read: a parent the caller may not see (not `accepted`, not their own) resolves `null`. See [the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

### Resolution on a `create` API

On a `create` there is no fetched row before the main operation: `this.instance` is written only by the instance fetch (update / delete / ownership-get) and `this.result` only after the create itself. A pre-create `FetchParentAction` therefore resolves the foreign key from the **create input**: `this.dataClause.<fk>` once the data clause has been built (stage `afterBuildDataClause` onward), and the request parameter `this.<fk>` from `afterReadParameters` onward, which is what makes the create-project example below work at `afterCheckParameters`.

Row-first precedence means update / delete / get are unchanged: when the fetched row carries the foreign key, that value is used.

If the foreign key can reach the action at neither place, the action resolves `null` on every call. For a `create` whose pre-main stage runs before the value is bound, validation reports it rather than emitting an always-null fetch (finding `FETCH_PARENT_FK_UNAVAILABLE_AT_STAGE`). Every source counts at the stage it binds: a request parameter or `:route` segment from `afterReadParameters`, and anything the data-clause build writes into the clause (a `dataClauseItems` entry, the column's session binding (`sessionSettings.sessionParam`), a `staticJoin` fill, a formula, or the multi-tenant stamp of the tenant column) from `afterBuildDataClause`. The finding is an error when no source can bind the key in time. A server-side column default is not a source (the database applies it at insert, after the main operation), and a multi-tenant project with no usable tenant name has no tenant column to stamp. The finding is a warning only when validation runs without the project in scope and the key could be the child's tenant column. That finding covers `create` only: a `list` or plain `get` has no row to read and is not reported by it.

## Example

In a workflow that creates a `project`, fetch the owning organisation and gate creation behind membership (the `project` object carries an `organizationId` relation to `organization`, the create API takes `organizationId` as a request parameter, and `organization` declares `membershipSettings`):

```json
"actions": {
  "fetchParentActions": [
    {
      "name": "loadOrganization",
      "writeToResponse": false,
      "contextPropertyName": "organization",
      "parentObject": "organization",
      "properties": ["id", "name", "status", "plan"]
    }
  ],
  "validationActions": [
    {
      "name": "orgMustBeActive",
      "description": "The parent organization must be active.",
      "writeToResponse": false,
      "validationScript": { "js": "this.organization?.status === 'active'" },
      "shouldBeTrue": true,
      "checkType": "liveCheck",
      "errorStatus": "403",
      "errorMessage": "Organization is not active."
    }
  ],
  "membershipCheckActions": [
    {
      "name": "checkOrgMembership",
      "writeToResponse": false,
      "dataObjectName": "organization",
      "objectKey": { "js": "this.organizationId" },
      "userKey": { "js": "this.session.userId" },
      "checkType": "liveCheck",
      "errorMessage": "You are not a member of this organization."
    }
  ]
},
"workflow": {
  "create": { "afterCheckParameters": ["loadOrganization", "orgMustBeActive", "checkOrgMembership"] }
}
```

## Errors

- A missing relation (no foreign-key column on the child) yields `null`: the action does not throw. Combine with a `ValidationAction` if the parent is mandatory.
- A foreign key that cannot be sourced at the stage the action is scheduled at is a design-time finding (`FETCH_PARENT_FK_UNAVAILABLE_AT_STAGE`), not a silent `null`.
- A foreign key that names no parent row (or one outside the caller's tenant) also resolves `null`; the action does not throw. Guard a mandatory parent with a `ValidationAction`, as in the example.
- A database or remote read failure throws; use `onActionError: "completeApi"` to inspect it via `this.<actionName>Error`.

## See also

- [`FetchObjectAction`](./fetch-object-action.md): general-purpose read
- [`MembershipCheckAction`](./membership-check-action.md): common follow-up
- [Data modelling: relations](../data-modeling/relations.md)
