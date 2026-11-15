# ShoppingCartRedisSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartRedisSettings in Part 2](../spec/ShoppingCartRedisSettings.md)

Redis-first cart storage settings. Redis is the authoritative live store; cart/cartItem database rows are a best-effort mirror that may lag. In the nodejs generated service cart manager, onEveryChange retains lifecycle mirroring and delete parity; onCheckout attempts a full mirror only after a settled successful checkout; never disables automatic mirror reads and writes. periodic scheduling, independent item expiry, HASH headers and a selectable SET item index are not implemented. Workflow cart actions retain Redis-only lifecycle persistence. Use cart routes for live state.

## Contained in

- [ShoppingCartConfig](./ShoppingCartConfig.md) as `redisSettings`

Blueprint paths:

- `services.shoppingCartConfig.redisSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
