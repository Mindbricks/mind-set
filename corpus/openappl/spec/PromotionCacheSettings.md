# PromotionCacheSettings

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [PromotionCacheSettings in Part 1](../ontology/PromotionCacheSettings.md)

Redis caching configuration for promotion campaign data.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cacheInRedis` | `Boolean` | no | `true` |  |  | Whether to cache active campaigns in Redis for performance. |
| `cacheTtlSeconds` | `Integer` | no | `3000` |  |  | TTL for campaign cache in Redis (default: 3000 seconds = 50 minutes). |
| `cacheKeyPrefix` | `String` | no | `"promo:"` |  |  | Authored prefix for campaign cache keys (default: 'promo:'). Node.js appends campaigns: followed by the resolved project, service, campaign store and cart, individually encodeURIComponent-encoded and colon-joined. One key serves load, write and invalidation; no tenant/user scope is added. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
