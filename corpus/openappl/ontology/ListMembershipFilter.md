# ListMembershipFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListMembershipFilter in Part 2](../spec/ListMembershipFilter.md)

A settings object to add a membership filter to the WHERE clause of the list. If given more than any one membership of all will be enough to select the object.

## Contained in

- [ListOptions](./ListOptions.md) as `membershipFilters` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObjectName` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `objectKeyIdField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
