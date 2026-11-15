# HotStoreBinding

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [HotStoreBinding in Part 1](../ontology/HotStoreBinding.md)

Binds an EventStream's hot store. References a `projectSettings.bigLoadProvidersSettings` store BY NAME (engine cassandra) and declares the table/keyspace, the partition + clustering columns, and the row TTL. The generated hot writer creates the keyspace/table on boot (partition by partitionColumn, cluster by clusteringColumn DESC, TTL) and upserts current-state + last-N rows.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the bigLoadProvidersSettings store this hot store binds to (must match a projectSettings.bigLoadProvidersSettings.bigLoadStores[].name whose engine is cassandra). The big-load-layer resolves its client from BIGLOAD_<NAME>_* env at runtime. |
| `keyspace` | `String` | no |  |  |  | [cassandra] The keyspace the hot table lives in. Defaults to the provider's configured keyspace, else the service codename. Auto-created on boot when absent. |
| `table` | `String` | no |  |  |  | The hot table name. Defaults to the stream name snake_cased + `_hot` (e.g. `vehiclePing` → `vehicle_pings`). Auto-created on boot. |
| `partitionColumn` | `String` | no |  |  |  | The CQL partition column. Defaults to streamBasics.partitionKey. All rows for one entity colocate under this partition. |
| `clusteringColumn` | `String` | no |  |  |  | The CQL clustering column (rows ordered within a partition). Defaults to streamBasics.clusteringKey (the timestamp). Read surfaces order/limit by this. |
| `ttlSeconds` | `Integer` | no |  |  |  | Row TTL in seconds — Cassandra ages hot rows out automatically so the hot store stays small/fast (the full history lives in the cold sink, P4). 0 or absent = no TTL. |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
