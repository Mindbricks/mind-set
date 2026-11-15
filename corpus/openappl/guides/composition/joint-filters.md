---
title: Joint filters
---

# Joint filters

A joint filter (the user-facing "joinedCriteria") filters a list by a
criterion evaluated in a **related** object rather than the main one.
It behaves like a left-join in the WHERE clause: the service runs a
query against the joined object, collects the matching id-list, and
appends it to the main list's WHERE clause. Use it when "show me X
where its related Y satisfies Z" — without writing a custom
`fullWhereClause` or a BFF DataView.

This is the read-side sibling of [`SelectJoin`](select-join.md):
select-join *returns* fields from a related object; a joint filter
*filters by* a criterion in a related object.

## Which block activates it

`BusinessApi.query.listOptions.jointFilters` (type
`ListJointFilterSettings`) on a `list`-type API:

| Field | Type | Notes |
|---|---|---|
| `operator` | `FilterOperator` | How multiple filters combine: `AND` (default) or `OR`. |
| `filters` | `ListJointFilter[]` | One or more joint-filter definitions. |

Each `ListJointFilter`:

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | String | ✓ | Code-safe identifier for the filter. |
| `joinedDataObject` | DataObjectName | ✓ | The related object to evaluate the criterion in. Must be related to the main object via a relation on either side; may be local or in a remote service. |
| `selector` | String | | Disambiguates when more than one relation exists. Syntax `mainObjectKey->joinedObjectKey`; the left side is a main-object property, the right side a joined-object property. Shorthands `->`, `->key`, `key->` are accepted. |
| `whereClause` | MScript | | MScript query selecting the id-array from the joined object. That id-list folds into the main WHERE clause. |
| `condition` | MScript | | Boolean — when it evaluates false, the filter is skipped. Cannot reference the main object's rows; for that complexity use a BFF DataView. |
| `fuzzyDomainFilters` | FuzzyDomainFilter[] | | Narrow the joined rows by a decision-provider judgement about one joined property, before their keys are collected (support depends on the compiler target; see [the compiler specification](../../compiler/index.md)). See [Fuzzy domain filters](../business-apis/list-api.md#fuzzy-domain-filters). |

## What it emits

For each filter, the service runs the joined query (`whereClause` against
`joinedDataObject`) to produce a set of matching ids, then constrains
the main list to rows whose `selector` key falls in that set. With more
than one filter, the per-filter id-sets combine by `operator` (`AND`
intersects, `OR` unions). When the join target is in another service,
the resolution runs through a search index rather
than a SQL join — the wire result is identical.

When the `joinedDataObject` carries
[`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`,
the id pre-selection runs its read gate with the caller's identity, so a
hidden row (not `accepted`, not the caller's own) never contributes an id —
the other object's list cannot be used to probe unapproved content. See
[the onPlace read gate](../capabilities/object-moderation.md#the-onplace-read-gate).

## Worked example

List projects whose owner is an active user **and** whose organisation
is on a paid plan:

```json
{
  "basics": { "apiOptions": { "name": "listBillableProjects", "crudType": "list", "dataObjectName": "Project" } },
  "query": {
    "listOptions": {
      "jointFilters": {
        "operator": "AND",
        "filters": [
          {
            "name":             "activeOwner",
            "joinedDataObject": "User",
            "selector":         "ownerId->id",
            "whereClause":      { "js": "({ status: { $eq: 'active' } })" }
          },
          {
            "name":             "paidOrg",
            "joinedDataObject": "Organisation",
            "selector":         "organisationId->id",
            "condition":        { "js": "this.session.role !== 'superAdmin'" },
            "whereClause":      { "js": "({ plan: { $in: ['pro', 'enterprise'] } })" }
          }
        ]
      }
    }
  }
}
```

`activeOwner` collects `User.id` where `status = 'active'` and keeps
projects whose `ownerId` is in that set. `paidOrg` collects
`Organisation.id` on a paid plan and keeps projects whose
`organisationId` is in that set — but only when the caller is not a
`superAdmin` (the `condition` skips it otherwise). The two sets
intersect (`AND`).

## When to reach for something else

- The criterion must reference the **main row's** own fields per row →
  use a `fullWhereClause` or a BFF DataView; a joint filter's
  `condition` is evaluated once, not per row.
- You need to *return* the joined fields, not just filter by them →
  add a [`SelectJoin`](select-join.md) alongside the joint filter.
- The composition spans several services and aggregates →
  [BFF DataView](../system-services/bff.md).
- The criterion on the joined object is a **judgement** no column holds
  ("products whose category is perishable") → add `fuzzyDomainFilters`
  to the joint filter: a decision provider classifies the distinct
  values of the joined property and the joined rows are narrowed to the
  qualifying ones. See
  [Fuzzy domain filters](../business-apis/list-api.md#fuzzy-domain-filters).

## See also

- [ListOptions hub](list-options.md) — the orchestrator.
- [Select-join](select-join.md) — return fields from a related object.
- [Where-clause composition](where-clause-composition.md) — the base
  WHERE the joint id-list is appended to.
- [Permission & membership filters](permission-and-membership-filters.md)
  — the other id-list-producing filters (relation-consumer pattern).
- Specification: [`ListJointFilterSettings`](../../spec/ListJointFilterSettings.md),
  [`ListJointFilter`](../../spec/ListJointFilter.md).
  (`FilterOperator` is an enum: `AND` / `OR`.)
