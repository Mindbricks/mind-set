# ShoppingCartReservationSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartReservationSettings in Part 2](../spec/ShoppingCartReservationSettings.md)

Opt-in TTL stock reservation. Requires productCatalogSettings.useProductCatalog plus exactly one stock mapping (productMappings.stockField or capacityField). Adding a line atomically reserves its units against a per-product Redis capacity counter seeded from the catalogue row; the counter is the ONLY runtime availability authority (the DB cart mirror is never consulted), holds expire on ttlSeconds (guestTtlSeconds for session-owned carts), are released on remove/clear/expiry, consumed inside the claimed checkout window, and restored by a compensating release when order creation definitively fails. A shortfall is the typed 409 CART_CAPACITY_EXCEEDED naming the short lines.

## Contained in

- [ShoppingCartConfig](./ShoppingCartConfig.md) as `reservationSettings`

Blueprint paths:

- `services.shoppingCartConfig.reservationSettings`

## Contains

- `guestQuota`: [CartGuestHoldQuota](./CartGuestHoldQuota.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
