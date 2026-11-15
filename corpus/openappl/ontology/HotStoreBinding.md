# HotStoreBinding

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [HotStoreBinding in Part 2](../spec/HotStoreBinding.md)

Binds an EventStream's hot store. References a `projectSettings.bigLoadProvidersSettings` store BY NAME (engine cassandra) and declares the table/keyspace, the partition + clustering columns, and the row TTL. The generated hot writer creates the keyspace/table on boot (partition by partitionColumn, cluster by clusteringColumn DESC, TTL) and upserts current-state + last-N rows.

## Contained in

- [EventStream](./EventStream.md) as `hotStore`

Blueprint paths:

- `services.eventStreams.hotStore`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
