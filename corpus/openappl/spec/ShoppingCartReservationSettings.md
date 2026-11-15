# ShoppingCartReservationSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartReservationSettings in Part 1](../ontology/ShoppingCartReservationSettings.md)

**Activation:** the pattern is switched on by `enabled`.

Opt-in TTL stock reservation. Requires productCatalogSettings.useProductCatalog plus exactly one stock mapping (productMappings.stockField or capacityField). Adding a line atomically reserves its units against a per-product Redis capacity counter seeded from the catalogue row; the counter is the ONLY runtime availability authority (the DB cart mirror is never consulted), holds expire on ttlSeconds (guestTtlSeconds for session-owned carts), are released on remove/clear/expiry, consumed inside the claimed checkout window, and restored by a compensating release when order creation definitively fails. A shortfall is the typed 409 CART_CAPACITY_EXCEEDED naming the short lines.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Turns TTL stock reservation on for this cart. Off by default; when off nothing about the emitted service changes. |
| `ttlSeconds` | `Integer` | no | `900` |  |  | Reservation hold TTL in seconds for authenticated (user-owned) carts. Deliberately decoupled from redisSettings.cartTtlSeconds and MUCH shorter (minutes, not hours): an abandoned basket must not starve stock for the cart's whole lifetime. |
| `guestTtlSeconds` | `Integer` | no | `300` |  |  | Reservation hold TTL in seconds for guest (session-owned) carts - the SHORT anti-hoarding hold. Should not exceed ttlSeconds. |
| `guestQuota` | [`CartGuestHoldQuota`](./CartGuestHoldQuota.md) | no | `{"maxLines":20,"maxUnits":100}` |  |  | Per-session hold quota for guest carts - the second half of the anti-hoarding defense (a rotating session can still multiply holds, but each rotation is bounded and short-lived). |
| `reconcileIntervalSeconds` | `Integer` | no | `300` |  |  | How long a seeded counter is trusted before it is lazily re-seeded (reconciled) from the catalogue row on the next reservation touch. The reconcile re-reads the row's stock mapping and resets the counter's consumed tally - the row is the durable truth the counter re-anchors to. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
