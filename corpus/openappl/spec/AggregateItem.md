# AggregateItem

**Level:** `subsection` · **Family:** [DataView](../ontology/families.md#dataview) (domain `BFFService`)

**Ontology:** [AggregateItem in Part 1](../ontology/AggregateItem.md)

**Name:** an instance is named by `name`.

Defines a single mathematical operation to apply to a group of records within a ViewStat. Supports standard operations like sum, average, min, max, and count. Each AggregateItem targets a specific field in the child object and may apply additional filters. It is particularly useful when multiple grouped metrics are required from the same set of joined records, such as 'count of failed orders' vs. 'sum of successful order values'.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The identifier of the computed metric (e.g., 'orderCount', 'totalAmount'). Appears as a key in the result object. |
| `aggType` | `AggTypes` | yes |  | `count`, `sum`, `avg`, `min`, `max` |  | The aggregation operation to perform. |
| `aggField` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>stats._currentAsset_.childObject` | The field of the target object used in the aggregation (e.g., 'amount', 'id'). For count operations, typically use 'id'. |
| `dataType` | `DataTypes` | yes |  | 16 values, see [DataTypes](#datatypes) |  | The expected data type of the result (e.g., 'Integer', 'Float'). Often reflects the type of the aggField but may differ (e.g., averaging integers produces floats). |
| `filterValue` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript condition to filter records inside the bucket before applying the operation. Allows multiple filtered aggregations on the same group (e.g., 'totalCanceledAmount', 'totalCompletedAmount'). The condition is evaluated per bucket record with the record bound to `this`, so read record fields as `this.<field>` — e.g. `{ "js": "this.status === 'completed'" }`. There is no `parent` binding in any DataView script slot — the parent/child correlation is the owning stat's parentKey/childKey join — and a bare field name or `parent.<field>` read does not resolve and is refused at validation. It is COMPILED into an Elasticsearch `filter` sub-aggregation around this item's metric, so the expression has to be one Elasticsearch can express: comparisons of `this.<field>` against a literal (`==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`) combined with `&&`, `\|\|` and `!`. A function call, an arithmetic expression, a ternary, or a comparison between two fields is refused at validation rather than dropped, and so is an exact filter on a column Elasticsearch analyzes (a scalar Text) or does not index at all - both of those would compile cleanly and match nothing. |

## Allowed values

### DataTypes

`ID`, `String`, `Text`, `Integer`, `Boolean`, `Double`, `Decimal`, `Float`, `Short`, `Object`, `Date`, `Enum`, `GeoPoint`, `GeoRoute`, `GeoArea`, `Blob`

## Constraints

Property rules:

- `name`, `aggType`, `aggField`, `dataType` must be present. (`REQUIRED_FIELD_MISSING`)
- `aggType`, `dataType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `aggField` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGGREGATE_ITEM_FIELD_NOT_IN_CHILD_VIEW` | warning | … on aggregate item "…" reads "…", but the stat's childObject "…" is a stored DataView whose documents do not carry "…" - the stat searches that view's index, which holds only the view's projected columns and its own … |
| `AGGREGATE_ITEM_FILTER_VALUE_NOT_LOWERABLE` | error | filterValue on aggregate item "…" cannot be compiled into an Elasticsearch aggregation filter: … A stat's aggregations run at PROJECTION time against the child object's index, so `filterValue` is lowered to a `filter` … |
| `AGGREGATE_ITEM_FILTER_VALUE_UNBOUND_IDENTIFIER` | error | filterValue on aggregate item "…" references `…`, which no stat scope binds. |
| `VIEW_STAT_SECRET_AGGFIELD` | error | aggregate item "…" aggregates "…" of "…", which is declared `hashed` / `isSecret`. |
