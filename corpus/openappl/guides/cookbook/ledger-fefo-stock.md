---
title: Multi-store stock with FEFO
---

# Multi-store stock with FEFO

Perishable inventory across many stores: goods arrive in batches
with their own expiry dates, picking must drain the
first-expired-first-out, and a cart hold must keep two shoppers from
selling the same last unit. This is a ledger with a composite owner
identity and the `fefo` consumption policy.

> **Audience.** AI agent or human author modeling stock on hand.
> Read [the ledger pattern page](../capabilities/ledger.md) first.

## Step 1: the owner is (store, product)

The unit of ownership is the ROW, so multi-store stock is a
`storeStockItem` object whose identity is the (store, product) pair:
dividers are owner-identity columns, never ledger machinery:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "storeStockItem",
                       "description": "Stock ledger owner: one row per (store, product)" },
    "compositeIndexSettings": [
      { "indexFields": ["storeId", "productId"], "onDuplicate": "throwError" }
    ],
    "ledgerSettings": {
      "objectOwnsALedger": true,
      "configuration": {
        "ledgerName": "stock",
        "unit": { "name": "unit", "scale": 1 },
        "consumptionPolicy": "fefo",
        "entrySource": { "referenceProperty": "receiptRef", "unique": true },
        "expiry": {
          "enabled": true,
          "cronExpression": "30 3 * * *",
          "batchSize": 500
        },
        "reservation": {
          "enabled": true,
          "referenceProperty": "cartRef",
          "kindProperty": "holdKind",
          "staleAfterSeconds": 1800,
          "sweepCron": "*/10 * * * *",
          "commitPolicy": "partial"
        },
        "events": { "prefix": "stock" }
      }
    }
  },
  "properties": [
    { "basicSettings": { "name": "storeId", "type": "ID", "isRequired": true },
      "indexSettings": { "indexedInDb": true },
      "relationSettings": { "relationTargetObject": "store" } },
    { "basicSettings": { "name": "productId", "type": "ID", "isRequired": true },
      "indexSettings": { "indexedInDb": true },
      "relationSettings": { "relationTargetObject": "product" } }
  ]
}
```

Without the unique composite index, two rows could exist for the same
(store, product), each carrying half the stock, each answering its
own balance. The validator warns
(`LEDGER_OWNER_IDENTITY_UNINDEXED`); declare the index and the
hazard is structural, not procedural.

Note what is ABSENT: no `entryMaturity` block. Stock is on hand the
moment it is received. That also means: **never pass a future
`availableAt` to this ledger's `earn`**: with no maturity block
there is no cron to flip a pending lot to available, so a
future-dated receipt would sit pending forever. The validator warns
about this exact combination
(`LEDGER_MATURITY_OVERRIDE_WITHOUT_CRON`); if you want "arrives
Monday, sellable Wednesday", declare `entryMaturity` and the cron
comes with it.

## Step 2: goods receipt, one lot per batch, with ITS expiry

Session note: a wrapper (or a hook) that has a caller session and
addresses a tenant-scoped stock object passes `{ session: this.session }`
as the internal call's optional second argument, where the compiler
supports it, to carry the caller's tenant. The sessionless calls below
keep a null session and their existing as-the-system behaviour; no
session is implicitly inherited. The stock owner and every operation
input remain explicit. See
[Session never enters the ledger core](../capabilities/ledger.md#session-never-enters-the-ledger-core).

Each received batch becomes one lot, carrying the batch's own expiry
(there is no config `ttl` here: the per-call override is the point):

```js
const item = await getStoreStockItemByQuery({
  storeId: receipt.storeId, productId: receipt.productId,
});
const r = await API.earnStock({
  ownerId: item.id,
  amount: receipt.quantity,
  idempotencyKey: `grn:${receipt.id}`,          // one credit per receipt line
  expiresAt: receipt.bestBefore,                // THIS batch's date
  sourceId: receipt.id, sourceType: 'goods-receipt',
});
if (r.errorCode) throw new Error(`receipt refused: ${r.errorCode}`);
```

`entrySource.unique` adds the coarse second line: (item,
`receiptRef`) unique, so the same receipt line cannot credit twice
even under a fresh idempotency key.

## Step 3: FEFO picking

`consumptionPolicy: "fefo"` orders eligible lots by `expiresAt`
ascending (non-expiring lots last), ties broken by `(createdAt, id)`.
Eligibility is filtered in the query: status `available`, unexpired,
positive unreserved remainder. A direct sale is one call:

```js
const r = await API.consumeStock({
  ownerId: item.id, amount: 3,
  idempotencyKey: `sale:${orderId}:${lineNo}`,
  targetId: orderId, targetType: 'order',
});
// r.allocations: [{ entryId, amount }, …] — which batches were drained,
// soonest-expiring first. Feed it back to the picker UI.
```

Insufficient stock answers a typed 409
(`LEDGER_INSUFFICIENT_BALANCE`) with nothing written: no partial
drain, no negative stock (`allowNegative` defaults to false).

## Step 4: cart holds are reservations

A cart line places a two-phase hold keyed by the cart, so checkout
can never oversell and an abandoned cart self-heals:

```js
// add to cart — one OPEN hold per (item, cartRef): re-adding the same
// cart line replays / 409s instead of stacking holds
const hold = await API.reserveStock({
  ownerId: item.id, amount: qty,
  idempotencyKey: `cart:${cartId}:${item.id}:reserve`,
  reference: cartId, kind: 'cart',
});

// checkout paid → commit (partial commitPolicy: committing fewer than
// held releases the rest — the shopper dropped one unit at checkout)
await API.commitStockReservation({
  ownerId: item.id, reservationId: hold.reservation.id,
  amount: paidQty,
  idempotencyKey: `cart:${cartId}:${item.id}:commit`,
});

// cart abandoned → the sweep cron (every 10 min, holds older than 30 min)
// releases the units back to available. An explicit "remove from cart"
// calls releaseStockReservation with its own key instead of waiting.
```

The allocation plan is computed at reserve time and persisted on the
hold; commit replays THAT plan: the batches quoted to the shopper
are the batches that ship. Exactly one of commit / release / sweep
wins a hold (CAS transitions); the losers get a typed
already-resolved 409, so a race between checkout and the sweep can
never restore units twice.

**Expiry meets holds:** the nightly expire cron writes off due lots'
UNRESERVED remainder only: a held claim survives until its hold
resolves. A batch expiring mid-checkout does not yank units out of a
quoted cart.

## The emitted flow

```
goods receipt        → earnStock(expiresAt: batch date)   → lot per batch
storefront add-to-cart → reserveStock(reference: cartId)  → available → reserved
checkout paid        → commitStockReservation             → persisted plan drains
cart abandoned 30min → sweep cron                          → reserved → available
nightly 03:30        → expire cron                         → unreserved remainder → expired
                       events: stock.movement.*, stock.reservation.*, stock.entry.expired
```

## Ops views

`listStockEntries` (REST) pages a store item's lots: remaining per
batch with expiry dates, the replenishment screen for free. The
three-number balance reads as: `available` = sellable now,
`reserved` = in carts, `pending` = unused here (no maturity).
`getStockBalance` rides `GET /ledger/stock/:ownerId/balance`.
