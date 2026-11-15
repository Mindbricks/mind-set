# WhereClauseSettings

**Level:** `section` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [WhereClauseSettings in Part 1](../ontology/WhereClauseSettings.md)

Defines how records are filtered in a Business API. This includes:- `selectBy`: strict selection logic based on required field equality. It also drives the default route path and parameter creation for single-record APIs (`get`, `update`, `delete`). When a non-ID field is set as `selectBy`, the route uses that field instead of the object ID, and the ID parameter is suppressed. - `fullWhereClause`: an optional override for complex, flexible query logic. When set, no ID parameter is auto-created and the route path defaults to the resource base path. - `additionalClauses`: optional conditional query fragments that are always appended to the WHERE clause, whether it is derived from `selectBy` or `fullWhereClause`. Use `selectBy` when your selection logic is static and business-critical (e.g., `['slug']`). Use `fullWhereClause` when the WHERE clause needs to be built dynamically using MScript. `additionalClauses` allow context-aware filtering such as role-based visibility or soft-delete exclusion. For `update` and `delete` operations, the actual database mutation always targets the single record fetched by `fetchInstance`, regardless of the WHERE clause breadth. Selector resolution order for `get`/`update`/`delete`: (1) explicit `fullWhereClause`; (2) explicit `selectBy`; (3) inferred `selectBy` from non-id `:` segments in the route path; (4) the standard `:{objectName}Id` (or `:id`) URL parameter; (5) latest-record fallback — when none of the above apply the pipeline sets `fullWhereClause = "{}"` and dbLayer's single-record fetcher returns the most recent record (ordered by `createdAt` DESC). The fallback is intentional support for current-context endpoints (`GET /snapshots/latest`, `DELETE /drafts/current`); when it triggers automatically, validate emits a `LATEST_RECORD_FALLBACK` warning so the designer can confirm intent. Suppress the warning by setting `fullWhereClause: { "js": "{}" }` explicitly when latest-record semantics is desired.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `selectBy` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | A list of fields that must be matched exactly as part of the WHERE clause. This is not a filter — it is a required selection rule. In single-record APIs (`get`, `update`, `delete`), it defines how a unique record is located. In `list` APIs, it scopes the results to only entries matching the given values. When a single non-ID field is specified (e.g., `['slug']`), the default route path is built as `/:slug` instead of `/:objectId`, and the ID parameter is not auto-created. If a custom route path contains non-ID parameters and no `selectBy` is configured, the route parameters are automatically inferred as `selectBy`. For the `id` field, both `/:objectId` and `/:id` are accepted as valid parameter sources. |
| `fullWhereClause` | [`MScript`](./MScript.md) | no |  |  | MScript kind `mquery` | An MScript query expression that overrides all default WHERE clause logic. Use this for fully customized queries. |
| `additionalClauses` | [`ExtendedClause`](./ExtendedClause.md)[] | no |  |  |  | A list of conditionally applied MScript query fragments. These clauses are appended only if their conditions evaluate to true. |
| `fuzzyDomainFilters` | [`FuzzyDomainFilter`](./FuzzyDomainFilter.md)[] | no |  |  |  | Query-time fuzzy filters (FuzzyDomainFilter): each one classifies the distinct values of one property of the API's data object against a criterion with a decision provider, caches every decision, and ANDs `property IN (<qualifying values>)` onto the where clause. List APIs only. A provider outage fails the request (or answers empty), never the unfiltered list. |

## Constraints

Property rules:

- `selectBy` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `additionalClauses` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fuzzyDomainFilters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Example

Use WhereClauseSettings to locate the target record(s) of a get/list/update/delete API — selectBy for a static unique selector (which also shapes the route path), fullWhereClause for dynamic MScript queries, and additionalClauses for always-appended conditional fragments such as soft-delete exclusion or role-based visibility. This example selects a project by slug and hides archived projects from non-admins.

```json
{
  "selectBy": [
    "slug"
  ],
  "additionalClauses": [
    {
      "name": "hideArchivedFromNonAdmins",
      "condition": { "js": "!this.session?.isAdmin" },
      "whereClause": { "js": "{ status: { $ne: 'archived' } }" }
    }
  ]
}
```
