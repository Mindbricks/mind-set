---
title: Redis entity caching
---

# Redis entity caching

Two Redis-backed patterns for keeping hot data out of the database
read path:

- **Entity cache** (`RedisEntityCacheSettings`): cache individual
  records of a data object in Redis: read-through on `get<Model>ById`,
  refreshed on every write, evicted on delete. This is the *strategy* page; the data-object
  capability it activates is catalogued under
  [DataObject capabilities](../data-modeling/object-capabilities.md).
- **Redis API parameters** (`RedisApiParameter`): read a value from
  Redis into a BusinessApi's context *before* execution, exposed as
  `this.<name>`.

Both are first-class on either engine: caching sits in front of the DB
layer regardless of whether the source is Postgres or MongoDB.

## Entity cache

### Which block activates it

`DataObject.objectSettings.redisEntityCacheSettings` (type
[`RedisEntityCacheSettings`](../../spec/RedisEntityCacheSettings.md)):

| Field | Type | Notes |
|---|---|---|
| `useEntityCaching` | Boolean | Activates the cache for this object. It is the only field: there is nothing else to configure. |

> **No `configuration` block.** There are no cache-admission criteria and
> no access-frequency TTL: a `configuration` block (`useSmartCaching` /
> `cacheCriteria` / `checkCriteriaOnlyInCreateAndUpdates`) is refused at
> design time (`RETIRED_SETTING`).

### What it provides

When active, the generated service wraps the object's single-record fetchers with a
Redis read-through / write-through layer. `get<Model>ById` checks Redis
first; a miss falls through to the DB and writes the normalized row back
into the cache. Creates and updates re-save the record, deletes evict it
(soft-deleted rows are evicted, not cached), and the object's Kafka CRUD
events keep the cache coherent. Every record of the object is cached:
there is no admission rule and no per-record TTL policy.

Redis is non-critical, and the cache degrades instead of failing during
a Redis outage: a cache read that fails is served as a miss (the
database answers the `get<Model>ById`), and a write-through or eviction
that fails never fails the DB write it follows. Because a lost eviction
is not replayed after the reconnect, every entity-cache key (the record
and its secondary-index sets) is written with a TTL backstop:
3600 seconds by default, overridden per service process by the
`ENTITY_CACHE_TTL_SECONDS` environment variable (a non-positive or
unparsable value falls back to the default). The record and each
secondary-index member are written together with their expiry in one
atomic step, so no cache key can exist without an expiry
even when the connection drops mid-write. A record a lost eviction left
behind is therefore stale for at most that window. The first cache
failure of an outage is logged once as `EntityCacheDegraded`; the next
cache command that succeeds ends the episode.

A read that carries a declared column projection deliberately bypasses
the cache in both directions: the cache holds FULL rows, so a hit would
answer with columns the projection excludes, and caching a projected row
would poison every later full read.

### Worked example

```json
{
  "objectSettings": {
    "basicSettings": { "name": "Ticket" },
    "redisEntityCacheSettings": {
      "useEntityCaching": true
    }
  }
}
```

Every `Ticket` read by id is served from Redis when present.

> Entity caching caches *records* by id. For caching a whole *list query
> result* instead, use `query.listOptions.queryCache`; see the
> [ListOptions hub](list-options.md).

## Redis API parameters

### Which block activates it

`BusinessApi.parameters.redisParameters[]` (array of
[`RedisApiParameter`](../../spec/RedisApiParameter.md)). Each entry reads a Redis value into the context
before the API runs:

| Field | Type | Notes |
|---|---|---|
| `name` | String | Context key: the value lands at `this.<name>`. |
| `type` | DataTypes | Expected type for validation. |
| `redisKey` | String | MScript expression evaluating to the Redis key (may use `this.session.userId` etc.). |
| `required` | Boolean | When true, a missing key / null value throws. |
| `defaultValue` | Any | Fallback when the lookup fails (makes the parameter optional). |

### What it provides

The generated API runs a pre-execution step that evaluates each `redisKey`,
reads Redis, and writes the result to `this.<name>`, so it reads like
any other parameter in downstream MScript (where-clauses,
dataClauseItems, actions) without the client sending it.

### Worked example

```json
{
  "basics": { "apiOptions": { "name": "getDashboard", "crudType": "get", "dataObjectName": "Dashboard" } },
  "parameters": {
    "redisParameters": [
      {
        "name":         "tenantConfig",
        "type":         "Object",
        "redisKey":     { "js": "`tenant:${this.session.workspaceId}:config`" },
        "required":     false,
        "defaultValue": {}
      }
    ]
  }
}
```

Before `getDashboard` runs, the service reads
`tenant:<tenantId>:config` from Redis into `this.tenantConfig`, falling
back to `{}` if absent. Downstream logic reads `this.tenantConfig`
directly.

## See also

- [DataObject capabilities](../data-modeling/object-capabilities.md):
  the canonical home of the entity-cache capability.
- [ListOptions hub](list-options.md): `queryCache` for caching list
  results.
- Patterns: [`RedisEntityCacheSettings`](../../spec/RedisEntityCacheSettings.md),
  [`RedisApiParameter`](../../spec/RedisApiParameter.md).
