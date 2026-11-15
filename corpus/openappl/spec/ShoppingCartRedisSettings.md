# ShoppingCartRedisSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartRedisSettings in Part 1](../ontology/ShoppingCartRedisSettings.md)

**Activation:** the pattern is switched on by `enabled`.

Redis-first cart storage settings. Redis is the authoritative live store; cart/cartItem database rows are a best-effort mirror that may lag. In the nodejs generated service cart manager, onEveryChange retains lifecycle mirroring and delete parity; onCheckout attempts a full mirror only after a settled successful checkout; never disables automatic mirror reads and writes. periodic scheduling, independent item expiry, HASH headers and a selectable SET item index are not implemented. Workflow cart actions retain Redis-only lifecycle persistence. Use cart routes for live state.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `true` |  |  | Whether to use Redis for cart caching. |
| `keyPrefix` | `String` | no | `"cart:"` |  |  | Prefix for all Redis keys related to this cart type (e.g., 'cart:'). |
| `cartTtlSeconds` | `Integer` | no | `86400` |  |  | TTL for cart data in Redis. After this time inactive carts are evicted. |
| `itemsTtlSeconds` | `Integer` | no | `86400` |  |  | Declared item-data TTL in seconds (schema default 86400). Current nodejs cart storage refreshes item and item-index expiry using cartTtlSeconds; this setting does not select an independent lifetime. For example, cartTtlSeconds=3600 also gives items a 3600-second refresh lifetime. Independent expiry, its default and migration behavior remain undecided. |
| `persistStrategy` | `RedisPersistStrategy` | no | `"onEveryChange"` | `onEveryChange`, `onCheckout`, `periodic`, `never` |  | Selects automatic cart/cartItem database mirroring in the nodejs generated service cart manager. onEveryChange is the default and retains best-effort lifecycle mirroring. Explicit onCheckout suppresses ordinary lifecycle writes and attempts to mirror the frozen header and current items after a successful or reconciled checkout; failed handoffs do not create a checkout mirror. Explicit never disables automatic mirror reads and writes. periodic retains existing lifecycle emission and has no scheduler; its interval and durability contract remain undecided. Workflow cart actions retain their Redis-only lifecycle persistence. These modes govern the cart mirror, not separate order or campaign-usage writes. |
| `persistIntervalSeconds` | `Integer` | no | `null` |  |  | Declared interval in seconds for periodic cart persistence; nullable, default null. Current nodejs generation does not schedule periodic persistence or consume this interval. A required interval or fallback and scheduling durability contract remain undecided; setting an interval does not enable a timer. |
| `useHashForCart` | `Boolean` | no | `false` |  |  | Declared cart-header storage selector, default false. Current nodejs cart storage uses Redis STRING headers for either value; true does not enable HASH storage. Existing readers and atomic updates depend on the STRING format. A HASH format and migration/rollback contract remain undecided. |
| `useListForItems` | `Boolean` | no | `false` |  |  | Declared item-index storage selector, default false. Current nodejs cart storage uses Redis LIST operations for either value; false does not select SET storage. Reconciling that schema default with existing ordered LIST data and defining a migration remain undecided. |

## Constraints

Property rules:

- `persistStrategy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_REDIS_INTERVAL_REQUIRED` | error | persistIntervalSeconds is required when persistStrategy is "interval" |
| `SHOPPING_CART_REDIS_INVALID_TTL` | error | … must be a positive integer (seconds), got … |
