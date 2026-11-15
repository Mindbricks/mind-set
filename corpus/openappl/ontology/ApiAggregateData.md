# ApiAggregateData

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ApiAggregateData in Part 2](../spec/ApiAggregateData.md)

Defines a single property-value pair used to populate a related data object during an aggregated operation. This structure is used in `CreateCrudAction` and `UpdateCrudAction` to specify how each property of the child object should be assigned—either statically or dynamically—from the API execution context.

## Contained in

- [CreateCrudAction](./CreateCrudAction.md) as `dataClause` (a list)
- [UpdateCrudAction](./UpdateCrudAction.md) as `dataClause` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `(03)childObject`)

## Referenced by

No property of another pattern names this pattern.
