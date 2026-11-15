# ViewAggregate

**Level:** `section` · **Family:** [DataView](./families.md#dataview) (domain `BFFService`)

**Specification:** [ViewAggregate in Part 2](../spec/ViewAggregate.md)

Defines an aggregate (join) within a DataView that links related objects to the main object, similar to SQL-style joins. Aggregates are resolved at the Elasticsearch layer using replicated microservice data. Each aggregate pulls in one or more records from a child object based on matching keys and optional conditions, then embeds them under the specified property name in the final view output.

## Contained in

- [DataView](./DataView.md) as `aggregates` (a list)

Blueprint paths:

- `bffService.dataViews.aggregates`

## Contains

No other pattern: every property is a value or a reference.

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `parentKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>viewBasics.mainObject`)
- `childKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `childObject`)
- `properties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `childObject`)

## Referenced by

No property of another pattern names this pattern.
