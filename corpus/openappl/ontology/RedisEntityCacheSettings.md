# RedisEntityCacheSettings

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [RedisEntityCacheSettings in Part 2](../spec/RedisEntityCacheSettings.md)

Configuration for Redis-based entity-level caching. Enables fast access to frequently used data by storing and serving object-level records from Redis, with support for custom cache criteria and smart expiration.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `EntityCache` | `const { EntityCache } = require("common")` | The Redis entity cache the generated dbLayer keeps: `new EntityCache(objectName)` then `getEntityFromCache(id)`, `saveEntityToCache(row)`, `delEntityFromCache(id)`. Refresh or evict a row after a write that bypasses dbLayer. | nodejs |

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `redisEntityCacheSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings.redisEntityCacheSettings`
- `services.dataObjects.objectSettings.redisEntityCacheSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
