# ViewStat

**Level:** `section` · **Family:** [DataView](./families.md#dataview) (domain `BFFService`)

**Specification:** [ViewStat in Part 2](../spec/ViewStat.md)

Defines a statistical aggregation for a DataView. Unlike ViewAggregates that collect related records, ViewStats compute mathematical summaries such as sum, count, average, min, and max over grouped data. These groupings, or 'buckets', are constructed based on parent-child relationships between objects. This is conceptually similar to Elasticsearch's bucket-based aggregations. Each ViewStat joins the main object with a target object (child) using a foreign key relationship and computes one or more aggregates using the defined conditions. It's ideal for summarizing numerical data across associations, such as counting user orders or summing revenue per company.

## Contained in

- [DataView](./DataView.md) as `stats` (a list)

Blueprint paths:

- `bffService.dataViews.stats`

## Contains

- `aggList`: [AggregateItem](./AggregateItem.md), a list

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `parentKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>viewBasics.mainObject`)
- `childKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `childObject`)

## Referenced by

No property of another pattern names this pattern.
