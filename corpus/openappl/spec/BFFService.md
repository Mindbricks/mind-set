# BFFService

**Level:** `module` · **Family:** [BFFService](../ontology/families.md#bffservice)

**Ontology:** [BFFService in Part 1](../ontology/BFFService.md)

Configuration settings for the BFF (Backend-for-Frontend) service in the project. Although optional, a BFF service is highly recommended in microservice architectures to consolidate and simplify data access for frontend clients. Since data is distributed across services, the BFF service acts as a unified interface, retrieving and aggregating data from different sources. An OpenAPPL compiler supports a hybrid CQRS strategy where complex aggregations, defined as DataViews, can be stored and queried efficiently via Elasticsearch. Alternatively, lightweight aggregations can be executed dynamically using dynamic DataViews, which merge data from services at request time without persisting the result. Use Sttaic DataViews for performance-critical or cross-service filtered views, and Dynamic DataViews for dynamic, user-specific aggregations. If no DataViews are defined, the BFF service will not be generated for the project.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `serviceSettings` | [`BffServiceSettings`](./BffServiceSettings.md) | no |  |  |  | Module-level settings chapter for the BFF service — currently holds the documentation section that MindUI reads when wiring DataView consumers in pages. |
| `dataViews` | [`DataView`](./DataView.md)[] | no |  |  |  | A list of DataView definitions that describe how data should be aggregated and exposed by the BFF service. A DataView is a REUSABLE QUERY DEFINITION first (main object + projection + aggregates/stats); `viewBasics.isStored: true` adds an Elasticsearch materialisation on top. Both kinds have the same two consumers: a get/list BusinessApi with `apiOptions.dataViewName` (a stored view is read from its index; a dynamic view binds at READ TIME, the api reading its object from the database with its own where clause and the view's joins applied per row) and custom code calling `LIB.dataViews.<name>(filter?, { page, limit }?)`. Code serving a caller passes `{ session }` (or `{ scoped: true }` inside an api request): the read is then pinned to the caller's tenant and active-only, like the consuming api's where clause. Without either option it is a SYSTEM read with no session (no tenant term; soft-deleted rows are left out of a dynamic view unless the filter names `isActive`), for system work only. |

## Constraints

Property rules:

- The items of `dataViews` must have distinct names (`viewBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
