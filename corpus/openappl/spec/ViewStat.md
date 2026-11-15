# ViewStat

**Level:** `section` · **Family:** [DataView](../ontology/families.md#dataview) (domain `BFFService`)

**Ontology:** [ViewStat in Part 1](../ontology/ViewStat.md)

**Name:** an instance is named by `name`.

Defines a statistical aggregation for a DataView. Unlike ViewAggregates that collect related records, ViewStats compute mathematical summaries such as sum, count, average, min, and max over grouped data. These groupings, or 'buckets', are constructed based on parent-child relationships between objects. This is conceptually similar to Elasticsearch's bucket-based aggregations. Each ViewStat joins the main object with a target object (child) using a foreign key relationship and computes one or more aggregates using the defined conditions. It's ideal for summarizing numerical data across associations, such as counting user orders or summing revenue per company.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The name of the statistic in the DataView result. This will appear as a property in the view (e.g., 'totalRevenue', 'userOrderCount'). |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the target object to aggregate data from (e.g., orders, sessions, transactions). Can also be a previously defined view. |
| `parentKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>viewBasics.mainObject` | The key from the main object that groups the stat results. Acts as the bucket owner (e.g., userId if calculating per user). |
| `childKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `childObject` | The foreign key in the target object used to relate it back to the main object. Typically a reference like 'userId' or 'companyId'. |
| `select` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript filter applied before bucketing. Use this to narrow the child data (e.g., only 'canceled' orders in the last month). The filter is evaluated per child record with the record bound to `this`, so read record fields as `this.<field>` — e.g. `{ "js": "this.status === 'canceled'" }`. There is no `parent` binding in any DataView script slot — the parent/child correlation is the parentKey/childKey join — and a bare field name or `parent.<field>` read does not resolve and is refused at validation. It is COMPILED into the stat's own Elasticsearch child query, beside the parentKey/childKey term, so it accepts the same expression forms `AggregateItem.filterValue` does and refuses the same ones at validation. |
| `aggList` | [`AggregateItem`](./AggregateItem.md)[] | no |  |  |  | The list of AggregateItems to apply on the grouped buckets. Each defines a numeric operation like sum, count, average. If empty, a default count is applied. |

## Constraints

Property rules:

- `name`, `childObject`, `parentKey`, `childKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `parentKey`, `childKey` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `aggList` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VIEW_STAT_PROPERTY_COLLISION` | warning | Stat "…" collides with a sibling stat of the same name in this view — both write the same output property `source['…']`, so one bucket of aggregation results overwrites the other. |
| `VIEW_STAT_SELECT_FIELD_NOT_IN_CHILD_VIEW` | warning | select on stat "…" reads `this.…`, but childObject "…" is a stored DataView whose documents do not carry "…" - the stat searches that view's index, which holds only the view's projected columns and its own aggregate/stat … |
| `VIEW_STAT_SELECT_NOT_LOWERABLE` | error | select on stat "…" cannot be compiled into an Elasticsearch filter: … A stat's child search runs at PROJECTION time against the child object's index, so `select` is lowered into that query; an expression with no faithful … |
| `VIEW_STAT_SELECT_UNBOUND_IDENTIFIER` | error | select on stat "…" references `…`, which no stat scope binds. |
