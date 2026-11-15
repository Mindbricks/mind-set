# PropertyIndexSettings

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyIndexSettings in Part 2](../spec/PropertyIndexSettings.md)

Index configuration for the data property across supported storage and caching layers. This includes Elasticsearch indexing for query performance, relational database indexing for faster selection, and Redis-based optimizations for efficient cache invalidation and retrieval. Use these settings to control how the property contributes to performance, queryability, and caching logic.

## Contained in

- [DataProperty](./DataProperty.md) as `indexSettings`

Blueprint paths:

- `authentication.userProperties.indexSettings`
- `authentication.tenantProperties.indexSettings`
- `authentication.dataObjects.properties.indexSettings`
- `services.dataObjects.properties.indexSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
