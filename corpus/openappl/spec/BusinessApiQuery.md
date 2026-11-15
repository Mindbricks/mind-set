# BusinessApiQuery

**Level:** `chapter` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [BusinessApiQuery in Part 1](../ontology/BusinessApiQuery.md)

Data-access shape of a `BusinessApi` (section): the select / where / data clauses plus delete / get / list / pagination options that drive the API's primary data-object query.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `selectClause` | [`SelectClauseSettings`](./SelectClauseSettings.md) | no |  |  |  | Specifies which fields will be selected from the main data object during a `get` or `list` operation. Leave blank to select all properties. On a `create`, `update` or `delete` API only `selectProperties` is read: it narrows the answer to the declared properties + `id` without projecting the write; `selectJoins` there is ignored. |
| `dataClauseItems` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | Lists every dataClause field the framework writes at create / update time, with the value MScript that produces it. Top-level on the BusinessApi. Runtime composition: for each property on the data object, (1) `sessionSettings` block → auto-inject from session, (2) `staticJoin` block → run the join, expose result via `contextParameterName`, (3) otherwise → look up matching `dataClauseItems[i].name` and evaluate its `value`. Properties with none of the three are not written (auditor flags missing entries). Common value shapes: `this.<paramName>` (caller-supplied), `'<literal>'` (system-managed), `this.<paramName> \|\| '<default>'` (caller-with-fallback), MScript like `LIB.calc(this.X)` for computed. |
| `whereClause` | [`WhereClauseSettings`](./WhereClauseSettings.md) | no |  |  |  | Defines the criteria used to locate the target record(s) for the main operation. This is expressed as a query object and applies to `get`, `list`, `update`, and `delete` APIs. All API types except `list` are expected to target a single record. For `update` and `delete`, the WHERE clause is used to fetch the target instance, and the actual database mutation is performed using the fetched instance's ID to guarantee single-record safety. |
| `deleteOptions` | [`DeleteOptions`](./DeleteOptions.md) | no |  |  |  | Contains settings specific to `delete` type APIs, such as soft-delete configurations or cascade options. |
| `getOptions` | [`GetOptions`](./GetOptions.md) | no |  |  |  | Contains settings specific to `get` type APIs, such as instance enrichment, fallback behaviors, or object caching. |
| `listOptions` | [`ListOptions`](./ListOptions.md) | no |  |  |  | Defines list-specific options including filtering logic, default sorting, and result customization for APIs that return multiple records. Applies only to `list` type APIs; ignored on every other crudType. |
| `paginationOptions` | [`PaginationOptions`](./PaginationOptions.md) | no |  |  |  | Contains settings to configure pagination behavior for `list` APIs (default page size, keyset `cursorMode`, and the `unpaged` opt-out). Paginated lists take 1-based `page`/`pageSize` parameters and respond with `{ data, paging: { page, pageSize, totalCount, totalPages } }`. |

## Constraints

Property rules:

- The items of `dataClauseItems` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
