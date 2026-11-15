# ListSearchFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListSearchFilter in Part 2](../spec/ListSearchFilter.md)

Searches one or more records from the main data object and uses the id array in the where clause of the list. The search is made in elastic search index and the result id array is appended to the where clause of the main query.

## Contained in

- [ListOptions](./ListOptions.md) as `searchFilter`

## Contains

No other pattern: every property is a value or a reference.

## References

- `searchProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `currentObject`)

## Referenced by

No property of another pattern names this pattern.
