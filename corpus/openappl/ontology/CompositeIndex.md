# CompositeIndex

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [CompositeIndex in Part 2](../spec/CompositeIndex.md)

Defines a composite index for a data object. Composite indexes improve database performance for queries that filter or sort based on multiple fields. Each index is created at the database level and can optionally handle duplicate conflicts during insert operations. Note that if you need unique constraints on a single field, you can use the `unique` property of the DataProperty instead. Composite indexes are particularly useful for optimizing complex queries that involve multiple fields, such as searching for users by email and client ID simultaneously or whne you need to ensure uniqueness across multiple fields (e.g., email and clientId). They are defined at the data object level and will be used across all related Business APIs.

## Contained in

- [LoginDefTenantSettingsConfig](./LoginDefTenantSettingsConfig.md) as `compositeIndexSettings` (a list)
- [ObjectSettings](./ObjectSettings.md) as `compositeIndexSettings` (a list)
- [RemoteBucketSettings](./RemoteBucketSettings.md) as `compositeIndexSettings` (a list)

Blueprint paths:

- `authentication.dataObjects.objectSettings.compositeIndexSettings`
- `services.dataObjects.objectSettings.compositeIndexSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

- `indexFields` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
