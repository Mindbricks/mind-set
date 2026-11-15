# ListJointFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListJointFilter in Part 2](../spec/ListJointFilter.md)

ListJointFilter definition object for a joint filter from the main object to another related data object to filter the main list result. This is like lefy join in the where clause. If you want to filter your list result with a criteria which is evaluated in a related object other than main object, you can use joint filter.

## Contained in

- [ListJointFilterSettings](./ListJointFilterSettings.md) as `filters` (a list)

## Contains

- `fuzzyDomainFilters`: [FuzzyDomainFilter](./FuzzyDomainFilter.md), a list

## References

- `joinedDataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
