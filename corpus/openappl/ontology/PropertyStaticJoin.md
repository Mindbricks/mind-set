# PropertyStaticJoin

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyStaticJoin in Part 2](../spec/PropertyStaticJoin.md)

Static join settings define how this property's value is derived from another data object at the time of creation when this block is populated. The join is resolved on every create write path - an API create, a create CRUD action writing a child object, and a seed-data row of the same service - and never on an update (a seeded row is the one exception: the seed refresh re-resolves it on every boot). This approach is useful when a field in the current object depends on a static value from a related object, and that value is not expected to change frequently. Unlike dynamic joins, static joins store the fetched value directly to allow for faster queries and avoid repeated lookups. A common use case is transferring tenant or client identifiers from a parent object into a child record. For example, when creating an email job for a specific user, the system can use the userId to join the User object, fetch its clientId, and statically assign it to the EmailJob object. This makes it easy to query email jobs by clientId without needing to join back to the User table at runtime. Note that static joins are resolved AFTER the API's dataClauseItems are evaluated, so a dataClauseItems expression cannot read the joined value; when a dataClauseItems entry names the joined property itself, its value is written first and the join only fills the column while it is still null. A join keyed on the property it writes (`jointForeignKey` naming this property) can never fire and is refused (STATIC_JOIN_SELF_FOREIGN_KEY). Leave the wrapping object null when no static-join is configured.

## Contained in

- [DataProperty](./DataProperty.md) as `staticJoin`

Blueprint paths:

- `authentication.userProperties.staticJoin`
- `authentication.tenantProperties.staticJoin`
- `authentication.dataObjects.properties.staticJoin`
- `services.dataObjects.properties.staticJoin`

## Contains

No other pattern: every property is a value or a reference.

## References

- `jointSource` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `jointRead` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `jointSource`)
- `jointSourceKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `jointSource`)
- `jointForeignKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `currentDataObject`)

## Referenced by

No property of another pattern names this pattern.
