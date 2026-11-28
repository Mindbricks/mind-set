# PropertyIndexSettings

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyIndexSettings in Part 1](../ontology/PropertyIndexSettings.md)

Index configuration for the data property across supported storage and caching layers. This includes Elasticsearch indexing for query performance, relational database indexing for faster selection, and Redis-based optimizations for efficient cache invalidation and retrieval. Use these settings to control how the property contributes to performance, queryability, and caching logic.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `indexedInElastic` | `Boolean` | no | `true` |  |  | Determines whether the property is searchable in the Elasticsearch CQRS index. It controls searchability, not storage: the value of every property is stored in the index document either way, and when enabled the property can be used in DataView filters and search queries. A hashed or isSecret property is the exception: it is never written to Elasticsearch at all, whatever this flag says. |
| `fulltextSearch` | `Boolean` | no | `false` |  |  | If set to true, the generated service will create an additional text index in elastic search other than the type based term query. Note that this feature is ignored if indexedInElastic is false. Text type data properties are alread have full text search. |
| `indexedInDb` | `Boolean` | no | `false` |  |  | Specifies whether a native database index should be created for this property to accelerate selection queries. Recommended for frequently filtered or sorted fields. |
| `unique` | `Boolean` | no | `false` |  |  | Indicates whether the property's value must be unique across all records. Enabling this will enforce a uniqueness constraint at the database level. |
| `clusterInRedis` | `Boolean` | no | `false` |  |  | Makes this property a CLUSTER KEY of the object's query cache — the slice dimension along which cached list answers are invalidated. Supported for query-cache slicing in nodejs, dotnet and python; this guard still treats java, golang and rust as unsupported. This flag slices QUERY answers, not the separate id-based EntityCache. Only meaningful when a list api on this object opts in with `listOptions.queryCache: true`; without one the flag slices nothing and a design-time warning (CLUSTER_IN_REDIS_UNUSED) says so.  With it, a cached answer records the value this property was pinned to by the query (or `all` when the query did not pin it), and a write to a row only flushes the slices that row belongs to — a write in tenant `t1` leaves tenant `t2`'s cached pages intact. Flag the column the object's lists are normally filtered by: a tenant id, an owner id, a parent id. Flagging several multiplies the slices (2^n patterns swept per write), so keep it to the one or two that actually partition the reads. |
| `cacheSelect` | `Boolean` | no | `false` |  |  | Defines whether this property is used as a key in Redis entity cache for batch-select operations. Enables lookup by this value across cached entities. |
| `isSecondaryKey` | `Boolean` | no | `false` |  |  | Marks the property as a secondary identifier, improving query performance on non-primary keys. Useful for access tokens, slugs, or alternative keys. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
