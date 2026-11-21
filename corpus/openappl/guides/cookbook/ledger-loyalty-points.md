---
title: Loyalty points on a ledger
---

# Loyalty points on a ledger

Earn points when an order is paid, spend them from the storefront,
expire them after a year with a reminder mail, without writing a
points engine. One `LedgerSettings` block generates the lots, the
movement log, the APIs and the crons.

> **Audience.** AI agent or human author adding loyalty points to a
> service that already has a checkout-enabled order object. Read
> [the ledger pattern page](../capabilities/ledger.md) first.

## Step 1: declare the wallet owner

One row per customer. The ledger's unit of ownership is the ROW, so
the wallet object carries the customer identity:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "loyaltyWallet",
                       "description": "One points wallet per customer" },
    "ledgerSettings": {
      "objectOwnsALedger": true,
      "configuration": {
        "ledgerName": "points",
        "unit": { "name": "point", "scale": 1 },
        "consumptionPolicy": "fifo",
        "entrySource": { "referenceProperty": "sourceRef", "unique": true },
        "expiry": {
          "enabled": true,
          "ttl": "P365D",
          "cronExpression": "15 2 * * *",
          "reminderLeadDays": 30
        },
        "events": { "prefix": "points" }
      }
    }
  },
  "properties": [
    { "basicSettings": { "name": "userId", "type": "ID", "isRequired": true },
      "indexSettings": { "unique": true, "indexedInDb": true } }
  ]
}
```

What this generates in the owning service:

- `sys_loyaltyWalletPointsEntry` / `sys_loyaltyWalletPointsMovement`
  satellites, plus `pointsVersion` / `pointsAvailable` /
  `pointsPending` / `pointsReserved` columns on `loyaltyWallet`.
- APIs `earnPoints`, `consumePoints` (internal-only),
  `getPointsBalance` (internal + `GET /ledger/points/:ownerId/balance`),
  `listPointsEntries` (REST).
- The expire cron (`15 2 * * *`) and a daily expiry reminder that
  emits `points.entry.expiring` for lots inside the 30-day window.

`expiry.ttl: "P365D"` stamps every credit with an expiry instant;
FIFO consumption means the oldest (soonest-expiring) points are spent
first, so expiry writes off only what genuinely went unused.

## Step 2: earn on the order event

The order object's checkout already fires lifecycle hooks. Credit
points from `afterPaymentCaptured`: hooks run in the same service,
so the injected internal API is one `await` away. Hook scripts use
bare identifiers (`payment`, not `this.payment`):

```json
"lifecycleHooks": [
  {
    "name": "earnPointsOnCapture",
    "trigger": "afterPaymentCaptured",
    "description": "1 point per currency unit of the captured amount.",
    "script": { "js": "await (async () => { if (!payment) return; const wallet = await getLoyaltyWalletByQuery({ userId: payment.userId }); if (!wallet) return; const r = await API.earnPoints({ ownerId: wallet.id, amount: Math.floor(resource.amount / 100), idempotencyKey: `pay:${resource.providerIntentId}`, sourceId: payment.orderId, sourceType: 'order' }); if (r.errorCode) { throw new Error(`points earn refused: ${r.errorCode}`); } })()" }
  }
]
```

Three deliberate choices to copy:

1. **`idempotencyKey: 'pay:' + resource.providerIntentId`**: the key
   identifies the OPERATION (this payment's points credit), so the
   provider's webhook retries replay to the same movement
   (`alreadyProcessed: true`) instead of double-crediting. Never
   suffix an attempt counter.
2. **`sourceId` / `sourceType`**: movement metadata tying the credit
   to its order. With `entrySource.unique`, (wallet, `sourceRef`) is
   a coarse second uniqueness line.
3. **Check `errorCode`.** `await API.earnPoints(...)` resolves to the
   API's output; on failure that output is the problem envelope
   (`{ errorCode, status, detail }`), not a thrown exception.

## Step 3: spend via a wrapper API

The generated `consumePoints` is fully parametric and internal-only:
session identity never enters the ledger core. The storefront spend
is a thin designer wrapper that owns the session:

For a tenant-scoped `loyaltyWallet`, the wrapper passes
`{ session: this.session }` as the internal call's optional second
argument, where the compiler supports it, so the caller's tenant is
resolved. Omitting it leaves the session null and preserves the
existing as-the-system behaviour; there is no implicit inheritance. The
ledger core still takes explicit `ownerId` and operation inputs. A
compiler whose target has no explicit-session support keeps the
sessionless signature. See
[Session never enters the ledger core](../capabilities/ledger.md#session-never-enters-the-ledger-core).

```json
{
  "basics": {
    "apiOptions": { "name": "spendMyPoints", "crudType": "get",
                    "dataObjectName": "loyaltyWallet",
                    "apiDescription": "Spend points from the caller's own wallet." },
    "authOptions": { "loginRequired": true }
  },
  "controllers": { "restSettings": { "hasRestController": true,
                   "routePath": "/my-points/spend", "forcePOSTMethod": true } },
  "parameters": { "requestParameters": [
    { "name": "amount", "type": "Integer", "required": true, "httpLocation": "body" },
    { "name": "orderId", "type": "String", "required": true, "httpLocation": "body" }
  ] },
  "query": { "whereClause": {
    "fullWhereClause": { "js": "{ userId: this.session.userId }" } } },
  "actions": {
    "functionCallActions": [ {
      "name": "spendViaLedger",
      "onActionError": "throwError",
      "callScript": { "js": "await (async () => { const r = await API.consumePoints({ ownerId: this.loyaltyWallet.id, amount: this.amount, idempotencyKey: `spend:${this.orderId}`, targetId: this.orderId, targetType: 'order' }, { session: this.session }); if (r.errorCode) { throw Object.assign(new Error(r.detail ?? 'spend refused'), { statusCode: r.status ?? 409, errorCode: r.errorCode }); } this.spent = this.ledgerMajorUnits(r).movement; })()" }
    } ],
    "addToResponseActions": [ {
      "name": "surfaceSpend", "writeToResponse": true,
      "context": [ { "contextName": "movement",
                     "contextValue": { "js": "this.spent" } } ]
    } ]
  },
  "workflow": { "get": { "afterMainGetOperation": ["spendViaLedger"],
                         "afterBuildOutput": ["surfaceSpend"] } }
}
```

`getMyBalance` is the same wrapper one size smaller: resolve the row
by session, `await API.getPointsBalance({ ownerId }, { session: this.session })`, surface the
triple. The display contract for user screens is
`{ available, pending, reserved, spendable }`: show `spendable`.

## Step 4: the reminder mail

`points.entry.expiring` fires once per wallet as lots enter the
30-day window (deduped by a stamp column). Wire a notification to it
like any other event: the payload carries the owner id and the
expiring lots, so "you have 240 points expiring on March 1" is a
template away.

## The emitted flow

```
order paid (provider webhook)
  └─ afterPaymentCaptured hook
       └─ API.earnPoints({ownerId, amount, idempotencyKey:'pay:pi_9x…'})
            → lot credited, pointsAvailable += amount, movement 'earn'
            → event points.movement.earn

storefront spend
  └─ POST /my-points/spend  { amount, orderId }        (session)
       └─ wrapper resolves wallet row → API.consumePoints({…})
            → FIFO allocation over mature, unexpired lots (in the query)
            → movement 'consume' + allocationDetail
            → 409 LEDGER_INSUFFICIENT_BALANCE when spendable < amount

nightly 02:15
  └─ expire cron writes off due unused remainders
       → movement 'expire', event points.entry.expired
daily
  └─ reminder cron → event points.entry.expiring (30-day window)
```

## Retries you no longer think about

- The provider redelivers the capture webhook → the earn replays:
  same movement, `alreadyProcessed: true`, no double credit.
- The user double-clicks spend for the same order → same
  `spend:<orderId>` key, one movement.
- Two spends race the same balance → the version CAS retries one of
  them against the fresh balance; overdraft is impossible.
