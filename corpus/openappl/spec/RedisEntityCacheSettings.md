# RedisEntityCacheSettings

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RedisEntityCacheSettings in Part 1](../ontology/RedisEntityCacheSettings.md)

**Activation:** the pattern is switched on by `useEntityCaching`.

Configuration for Redis-based entity-level caching. Enables fast access to frequently used data by storing and serving object-level records from Redis, with support for custom cache criteria and smart expiration.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `EntityCache` | `const { EntityCache } = require("common")` | The Redis entity cache the generated dbLayer keeps: `new EntityCache(objectName)` then `getEntityFromCache(id)`, `saveEntityToCache(row)`, `delEntityFromCache(id)`. Refresh or evict a row after a write that bypasses dbLayer. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useEntityCaching` | `Boolean` | yes |  |  |  | Enables Redis entity caching for this object. When active, individual records are cached in Redis, improving read performance for high-frequency access patterns. |

## Constraints

Property rules:

- `useEntityCaching` must be present. Enforced only while `useEntityCaching` is on. (`REQUIRED_FIELD_MISSING`)
