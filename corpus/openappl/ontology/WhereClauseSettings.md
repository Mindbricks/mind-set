# WhereClauseSettings

**Level:** `section` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [WhereClauseSettings in Part 2](../spec/WhereClauseSettings.md)

Defines how records are filtered in a Business API. This includes:- `selectBy`: strict selection logic based on required field equality. It also drives the default route path and parameter creation for single-record APIs (`get`, `update`, `delete`). When a non-ID field is set as `selectBy`, the route uses that field instead of the object ID, and the ID parameter is suppressed. - `fullWhereClause`: an optional override for complex, flexible query logic. When set, no ID parameter is auto-created and the route path defaults to the resource base path. - `additionalClauses`: optional conditional query fragments that are always appended to the WHERE clause, whether it is derived from `selectBy` or `fullWhereClause`. Use `selectBy` when your selection logic is static and business-critical (e.g., `['slug']`). Use `fullWhereClause` when the WHERE clause needs to be built dynamically using MScript. `additionalClauses` allow context-aware filtering such as role-based visibility or soft-delete exclusion. For `update` and `delete` operations, the actual database mutation always targets the single record fetched by `fetchInstance`, regardless of the WHERE clause breadth. Selector resolution order for `get`/`update`/`delete`: (1) explicit `fullWhereClause`; (2) explicit `selectBy`; (3) inferred `selectBy` from non-id `:` segments in the route path; (4) the standard `:{objectName}Id` (or `:id`) URL parameter; (5) latest-record fallback — when none of the above apply the pipeline sets `fullWhereClause = "{}"` and dbLayer's single-record fetcher returns the most recent record (ordered by `createdAt` DESC). The fallback is intentional support for current-context endpoints (`GET /snapshots/latest`, `DELETE /drafts/current`); when it triggers automatically, validate emits a `LATEST_RECORD_FALLBACK` warning so the designer can confirm intent. Suppress the warning by setting `fullWhereClause: { "js": "{}" }` explicitly when latest-record semantics is desired.

## Contained in

- [BusinessApiQuery](./BusinessApiQuery.md) as `whereClause`

Blueprint paths:

- `authentication.businessLogic.query.whereClause`
- `services.businessLogic.query.whereClause`

## Contains

- `additionalClauses`: [ExtendedClause](./ExtendedClause.md), a list
- `fuzzyDomainFilters`: [FuzzyDomainFilter](./FuzzyDomainFilter.md), a list

## References

- `selectBy` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
