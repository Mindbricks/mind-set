# ListRuntimeFilterSettings

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListRuntimeFilterSettings in Part 1](../ontology/ListRuntimeFilterSettings.md)

Per-list-API runtime filter behavior. Four independent opt-in flags. The same block applies to DataObject-sourced and DataView-sourced lists (codegen compiles to SQL/ES per source).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `filtersEnabled` | `Boolean` | no | `false` |  |  | When true, the API accepts a structured `filters` POST body with operator-based per-field criteria. Operator vocabulary is shared across DataObject and DataView sources (see RuntimeFilterOperator). |
| `searchEnabled` | `Boolean` | no | `false` |  |  | When true, the API accepts a runtime `?q=` query parameter for full-text search across fields configured in `searchedFields`. For DataObject sources the framework routes the search through the existing ListSearchFilter ES bridge; for DataView sources native ES multi_match is used. |
| `sortEnabled` | `Boolean` | no | `false` |  |  | When true, the API accepts runtime `?sortBy=&sortOrder=` query parameters. The static `listSortBy` becomes the default; runtime sort overrides it. `sortBy` must name a column of `allowedSortFields` (or its computed default); any other value is refused with 400 `INVALID_SORT_FIELD`. |
| `savedFiltersEnabled` | `Boolean` | no | `false` |  |  | When true, the api-layer auto-generates three auxiliary endpoints next to this API at <routePath>/filters (GET, POST) and <routePath>/filters/:filterId (DELETE), plus a per-service `listSavedFilter` DataObject. Saved-filter rows are scoped to the calling user, and the aux endpoints are never more permissive than this API: they inherit its checkRoles, absoluteRoles and permissionCheck without scopeFields (checkRoles is not copied beside permissionCheck). Where the parent API has a tenant filter in force, only superAdmin and saasAdmin remain in the auxiliary absoluteRoles because the preset table is not tenant-scoped; other inherited absolute roles join a non-empty checkRoles only when no permissionCheck is inherited, retaining ownership checks. Other parents keep the existing inheritance. The auxiliary endpoints always require a login, and never inherit M2MAllowed, apiInSaasLevel or requiredCallerKind. |
| `allowedFields` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | Optional explicit allow-list of fields the runtime filter body may target; a declared list is used verbatim (the validator warns, RUNTIME_FILTER_SECRET_FIELD, when it names a `hashed` / `isSecret` column). If null or empty on a `filtersEnabled` api, codegen computes the default from the data source: for DataObject, every property with isFilterParameter=true; for DataView, every projected mainObject property plus every aggregate name plus every stat name; never a `hashed` / `isSecret` or storage-internal column. A body naming a field outside the effective list is refused with 400 `INVALID_FILTER_FIELD`; a default that comes out empty refuses every field. |
| `allowedSortFields` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | Optional explicit allow-list for runtime sort; a declared list is used verbatim. If null or empty on a `sortEnabled` api, codegen computes the default: `id`, `createdAt`, `updatedAt` plus every non-array property of a sortable type (ID, String, Integer, Short, Float, Double, Decimal, Boolean, Date, Enum; on a stored DataView, every ES-sortable field of the view index), restricted to `allowedFields` only when `allowedFields` is declared, and never a `hashed` / `isSecret` or storage-internal column. A `?sortBy=` outside the effective list is refused with 400 `INVALID_SORT_FIELD`. |
| `searchedFields` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>apiOptions.dataObjectName` | Fields searched by the runtime `?q=` parameter. If null, defaults to fields whose property type is text-like. |
| `allowedOperators` | `RuntimeFilterOperator`[] | no |  | 22 values, see [RuntimeFilterOperator](#runtimefilteroperator) |  | Optional explicit subset of the operator vocabulary this API supports. If null, the full set is allowed EXCEPT regexp, which is default-deny and must be named here to be reachable (on nodejs, a caller-supplied regular expression runs on the PostgreSQL and MongoDB read paths; on java and python the DataObject path does not reach a regex engine at all and lowers regexp to a literal $like substring test instead; on rust the generated list lowers regexp to $like: DataObject reads use LIKE semantics and Elasticsearch DataView reads emit a wildcard query from the LIKE pattern; on golang DataObject reads use PostgreSQL regex or MongoDB $regex and Elasticsearch DataView reads emit a Lucene regexp query; on rust and golang an opted-in pattern is capped at 256 characters and scanned for ambiguous constructs before it runs). |

## Allowed values

### RuntimeFilterOperator

`eq`, `noteq`, `in`, `notin`, `gt`, `gte`, `lt`, `lte`, `range`, `exists`, `missing`, `isNull`, `notNull`, `match`, `matchPhrase`, `matchPhrasePrefix`, `contains`, `notContains`, `starts`, `ends`, `wildcard`, `regexp`

## Constraints

Property rules:

- `allowedOperators` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `allowedFields`, `allowedSortFields`, `searchedFields` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `RUNTIME_FILTER_SECRET_FIELD` | warning | allowedFields entry "…" on "…" is a … column. |
| `SEARCH_DISABLED_WITH_FIELDS` | error | searchedFields declares … field(s) (…) but searchEnabled is false — the fields are dead config, no ?q= search is emitted. |
| `SEARCH_ENABLED_WITHOUT_FIELDS` | error | searchEnabled is true but searchedFields is empty — ?q= search has no columns to match against and would silently do nothing. |
| `SEARCH_FIELD_NOT_SEARCHABLE` | error | searchedFields entry "…" on "…" is a "…" property; ?q= search is a case-insensitive text contains and only applies to String/Text/Enum columns — a "…" column would make the generated query a driver-level type error. |
| `SEARCH_FIELD_UNKNOWN` | error | searchedFields entry "…" is a … column of "…". |
