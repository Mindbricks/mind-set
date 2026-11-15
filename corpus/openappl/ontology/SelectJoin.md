# SelectJoin

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [SelectJoin in Part 2](../spec/SelectJoin.md)

Select join is a definition object for a join from the main object to another related data object to select additional properties from it.

## Contained in

- [SelectClauseSettings](./SelectClauseSettings.md) as `selectJoins` (a list)

## Contains

- `sortBy`: [SortByItem](./SortByItem.md), a list

## References

- `joinedDataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `properties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `joinedDataObject`)

## Referenced by

No property of another pattern names this pattern.
