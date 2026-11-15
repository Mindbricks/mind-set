---
title: Where-clause composition
---

# Where-clause composition

`WhereClauseSettings` is the static foundation that decides **which
records a BusinessApi targets**. It applies to `get`, `update`,
`delete`, and `list`. (For `update` / `delete` the WHERE clause locates
the instance; the actual mutation always targets the single fetched
record's id, so the clause's breadth never causes a multi-row write.)
Three composable parts:

- **`selectBy`** — strict, required field equality. Drives the route
  path and parameter creation for single-record APIs.
- **`fullWhereClause`** — an MScript override for fully custom query
  logic.
- **`additionalClauses`** — conditional MScript fragments always
  appended (tenant / role / soft-delete scoping).

This is the *static* WHERE; on a list API the [filter
families](list-options.md) (permission / membership / joint / search /
runtime) append further constraints on top of it.

## Which block activates it

`BusinessApi.query.whereClause` (type `WhereClauseSettings`):

| Field | Type | Notes |
|---|---|---|
| `selectBy` | PropRefer[] | Fields that must match exactly. A single non-id field (e.g. `["slug"]`) makes the route `/:slug` and suppresses the auto id parameter. On `list`, scopes results to matching values. |
| `fullWhereClause` | MScript | Overrides all default WHERE logic. When set, no id parameter is auto-created and the route defaults to the resource base path. |
| `additionalClauses` | ExtendedClause[] | Conditional fragments appended whether the base is `selectBy` or `fullWhereClause`. |
| `fuzzyDomainFilters` | FuzzyDomainFilter[] | List only. A judgement about the distinct values of one column, decided by a decision provider and merged as `column IN (...)`; see [Fuzzy domain filters](../business-apis/list-api.md#fuzzy-domain-filters). |

Each `ExtendedClause`:

| Field | Type | Notes |
|---|---|---|
| `name` | String | Code-safe label (documentation / UI only). |
| `whereClause` | MScript | The query fragment to merge in. |
| `condition` | MScript | Gates the merge — applied when truthy; leave `null` to apply unconditionally. Negate yourself for exclusions (`!this.session?.isAdmin`). |

## What it emits

- **`selectBy`** compiles to required equality predicates and shapes the
  generated route/parameters for single-record APIs.
- **`fullWhereClause`** compiles to the MScript-query WHERE verbatim.
- Each **`additionalClause`** is merged into the final WHERE when its
  `condition` is truthy (or always, when `condition` is null).
- Each **`fuzzyDomainFilter`** (list only) resolves the qualifying values
  of its column through the decision cache, asking the provider only about
  values it has not decided yet, and ANDs `column IN (<values>)` onto the
  WHERE. A provider outage fails the request or answers empty; it never
  drops the filter.

All of this is engine-aware: an MScript query is translated to the
query form of the object's database, whether SQL or a document store.

Beside the author's clauses the service conjoins its own terms: the
tenant term, and on an object moderated with
[`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`
the moderation read gate (`accepted`, or the caller's own rows, for a
non-privileged caller) at the same place, so no `additionalClause` has to
restate either.

## Selector resolution order (get / update / delete)

For single-record APIs the service resolves the selector in this
order:

1. explicit `fullWhereClause`;
2. explicit `selectBy`;
3. inferred `selectBy` from non-id `:` segments in the route path;
4. the standard `:{objectName}Id` (or `:id`) URL parameter;
5. **latest-record fallback** — when none apply, the pipeline sets
   `fullWhereClause = "{}"` and the single-record fetcher returns the
   most recent record (ordered by `createdAt DESC`).

The fallback intentionally supports current-context endpoints
(`GET /snapshots/latest`, `DELETE /drafts/current`). When it triggers
automatically, `validate` emits a `LATEST_RECORD_FALLBACK` warning so
you can confirm intent. Set `fullWhereClause: "{}"` explicitly to
declare latest-record semantics and silence the warning.

## Worked example — selectBy route + scoped additional clauses

```json
{
  "basics": { "apiOptions": { "name": "getArticleBySlug", "crudType": "get", "dataObjectName": "Article" } },
  "query": {
    "whereClause": {
      "selectBy": ["slug"],
      "additionalClauses": [
        {
          "name":        "softDelete",
          "whereClause": { "js": "({ isActive: { $eq: true } })" }
        },
        {
          "name":        "tenantScope",
          "condition":   { "js": "!this.session?.isPlatformAdmin" },
          "whereClause": { "js": "({ workspaceId: { $eq: this.session.workspaceId } })" }
        }
      ]
    }
  }
}
```

`selectBy: ["slug"]` makes the route `GET /articles/:slug` (no id
parameter). `softDelete` always excludes archived rows. `tenantScope`
restricts to the caller's tenant — unless the caller is a platform
admin, where the `condition` skips the clause. The compiled WHERE is
`slug = :slug AND isActive = true [AND tenantId = ?]`.

## fullWhereClause for dynamic logic

When the selection can't be expressed as equality, use an MScript
query override:

```json
{
  "query": {
    "whereClause": {
      "fullWhereClause": { "js": "({ $and: [ { ownerId: { $eq: this.session.userId } }, { status: { $in: ['draft','review'] } } ] })" }
    }
  }
}
```

With `fullWhereClause` set, no id parameter is auto-created. Reach for
`selectBy` when selection is static and business-critical; reach for
`fullWhereClause` when it must be built dynamically.

## See also

- [ListOptions hub](list-options.md) — list filters appended on top of
  this base WHERE.
- [Joint filters](joint-filters.md) / [Search filters](search-filters.md)
  — id-lists folded into the WHERE clause.
- [MScript query reference](../mscript/query-reference.md) — the query
  shape used in `fullWhereClause` / `additionalClauses`.
- [The decision layer](../capabilities/decision-layer.md#fuzzy-domain-filters-query-time)
  — how fuzzy domain filters decide, cache and fail.
- Specification: [`WhereClauseSettings`](../../spec/WhereClauseSettings.md),
  [`ExtendedClause`](../../spec/ExtendedClause.md),
  [`FuzzyDomainFilter`](../../spec/FuzzyDomainFilter.md).
