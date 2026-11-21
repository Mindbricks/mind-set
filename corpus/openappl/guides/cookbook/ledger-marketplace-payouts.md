---
title: Marketplace payouts via reservation
---

# Marketplace payouts via reservation

The canonical seller-balance recipe: earnings accrue on payment
capture behind a refund-window maturity, and a payout drains the
balance through the two-phase reservation: reserve at initiation,
commit on `afterPayoutPaid`, release on `afterPayoutFailed`. The
provider's retry chaos stays on the payout side; the ledger sees only
reserve / commit / release, so "retried AND already-executed" is
structurally impossible.

> **Audience.** AI agent or human author paying sellers from a
> marketplace service (a marketplace-enabled payment provider +
> connected accounts already configured). Read
> [the ledger pattern page](../capabilities/ledger.md) first.

> **Scope.** This recipe shapes seller balances around **PSP payouts**:
> the intermediary / `providerSplit` money path. Under
> `settlementMode: "platformSettled"` (the reseller model) PSP payouts
> are refused with a typed 409 and settlement rides the injected
> earnings-entry / settlement-instruction machine instead; see
> [Intermediation vs reseller billing](../capabilities/intermediation-vs-reseller-billing.md).

## Step 1: the seller balance owner

```json
{
  "objectSettings": {
    "basicSettings": { "name": "sellerBalance",
                       "description": "Payout ledger owner: one row per seller" },
    "ledgerSettings": {
      "objectOwnsALedger": true,
      "configuration": {
        "ledgerName": "earnings",
        "unit": { "name": "cent", "scale": 100 },
        "consumptionPolicy": "fifo",
        "entryMaturity": {
          "defaultDelay": "P30D",
          "cronExpression": "0 * * * *"
        },
        "reservation": {
          "enabled": true,
          "referenceProperty": "payoutItemRef",
          "staleAfterSeconds": 604800,
          "sweepCron": "0 4 * * *",
          "commitPolicy": "exact"
        },
        "balance": { "invariantCheckCron": "0 5 * * *" },
        "events": { "prefix": "earnings", "secure": true }
      }
    }
  },
  "properties": [
    { "basicSettings": { "name": "sellerId", "type": "ID", "isRequired": true },
      "indexSettings": { "unique": true, "indexedInDb": true } }
  ]
}
```

- **`entryMaturity.defaultDelay: "P30D"`**: every capture credit is
  PENDING for the refund window; the hourly maturity cron flips due
  lots to available. Pending earnings are visible to the seller but
  cannot be paid out, with no config beyond this line.
- **`reservation.referenceProperty: "payoutItemRef"`**: one OPEN
  hold per (seller, payout item): initiating the same payout twice is
  a typed 409, never a double hold.
- **`staleAfterSeconds: 604800`**: a payout stuck longer than 7 days
  without a paid/failed verdict releases back; tune to your
  provider's settlement worst case.
- Money-grade posture: `secure` events and a nightly invariant sweep
  that recomputes each seller's truth from the lots and emits
  `earnings.invariant.violated` on drift.

Generated stem: `Earnings`: `earnEarnings`, `reserveEarnings`,
`commitEarningsReservation`, `releaseEarningsReservation`,
`getEarningsBalance`, `listEarningsEntries`.

## Step 2: earn on capture (with clawback on refund)

The order object's checkout hooks credit the seller's share. Hook
scripts use bare identifiers and reach the injected internal APIs as
`await API.<name>(...)`; the result is the API's OUTPUT (the problem
envelope on failure), so check `errorCode`.

Session note: a wrapper (or a hook) that has a caller session and
addresses a tenant-scoped balance object passes `{ session: this.session }`
as the internal call's optional second argument, where the compiler
supports it, to carry the caller's tenant. Provider webhook hooks with
no session keep the explicit-param system calls shown below. Omitting
the second argument leaves the session null, with no implicit
inheritance; ledger operation inputs remain explicit. See
[Session never enters the ledger core](../capabilities/ledger.md#session-never-enters-the-ledger-core).

```json
"lifecycleHooks": [
  {
    "name": "earnOnCapture",
    "trigger": "afterPaymentCaptured",
    "description": "Credit the seller's share, pending for the refund window.",
    "script": { "js": "await (async () => { if (!payment) return; const balance = await getSellerBalanceByQuery({ sellerId: payment.sellerId }); if (!balance) throw new Error('Seller balance missing; provision it before processing this event'); const r = await API.earnEarnings({ ownerId: balance.id, amount: payment.sellerShareMinor, idempotencyKey: `pay:${resource.providerIntentId}`, sourceId: payment.orderId, sourceType: 'order' }); if (r.errorCode) { throw new Error(`seller credit refused: ${r.errorCode}`); } })()" }
  },
  {
    "name": "clawbackOnRefund",
    "trigger": "afterPaymentRefunded",
    "description": "Refund inside the window claws the pending credit back.",
    "script": { "js": "await (async () => { if (!payment) return; const balance = await getSellerBalanceByQuery({ sellerId: payment.sellerId }); if (!balance) throw new Error('Seller balance missing; provision it before processing this event'); const r = await API.consumeEarnings({ ownerId: balance.id, amount: resource.amount, idempotencyKey: `refund:${resource.providerRefundId}`, targetId: payment.orderId, targetType: 'refund' }); if (r.errorCode) { throw new Error(`clawback refused: ${r.errorCode}`); } })()" }
  }
]
```

The idempotency keys ARE the provider facts (`pay:<intentId>`,
`refund:<refundId>`): webhook redelivery replays to the original
movement with `alreadyProcessed: true`. Never suffix an attempt
counter: the key identifies the operation, not the attempt.

> **Clawback caveat.** `consume` draws on AVAILABLE lots; the freshly
> earned refund-window lot is still pending. For strict "claw back
> that exact credit" semantics, set `allowNegative: true` so a
> clawback can overdraw a seller mid-window; otherwise the default
> refuses an overdraft with a 409: state your policy. (The roster's
> `adjust` correction API would be the third option, but it is
> **planned, not yet emitted**; see
> [the roster note](../capabilities/ledger.md#the-api-roster).)

## Step 3: payout initiation = reserve

When the payout batch builder decides to pay a seller, it does NOT
consume: it reserves, keyed by the payout item. Whatever code builds
your payout (a cron-driven API, an operator action) makes one call:

```js
const r = await API.reserveEarnings({
  ownerId: balance.id,
  amount: payoutItem.amountMinor,
  idempotencyKey: `po:${payoutItem.id}:reserve`,
  reference: payoutItem.id,          // one OPEN hold per payout item
  kind: 'payout',
  targetId: payoutItem.id, targetType: 'payout',
});
if (r.errorCode === 'LEDGER_INSUFFICIENT_BALANCE') {
  // seller's available (mature, unheld) balance is short — skip this cycle
} else if (r.errorCode === 'LEDGER_RESERVATION_REFERENCE_HELD') {
  // this payout item already holds funds — an earlier initiation won
} else if (r.errorCode) {
  throw new Error(`payout hold refused: ${r.errorCode}`);
}
```

Only mature (post-refund-window), unreserved funds are reservable:
the maturity filter lives in the allocation query, not in your code.

## Step 4: the provider verdict resolves the hold

The marketplace lifecycle hooks receive the normalized `payout` row:
the `sys_<X>Payout` ticket, whose designer-visible slots are
`connectedAccountId`, `providerPayoutId` and a free-form `metadata`
object. Stamp your own refs into `metadata` when the payout is
created (`{ payoutItemId, sellerId }`), and the verdict hooks have
everything they need.

Exactly one of commit / release / sweep wins the hold; the losers get
`LEDGER_RESERVATION_ALREADY_RESOLVED` (409), which is precisely what
you want when a provider redelivers verdicts out of order:

```json
"lifecycleHooks": [
  {
    "name": "settleOnPaid",
    "trigger": "afterPayoutPaid",
    "description": "Money left: commit the hold — the persisted plan drains.",
    "script": { "js": "await (async () => { if (!payout || !payout.metadata) return; const balance = await getSellerBalanceByQuery({ sellerId: payout.metadata.sellerId }); if (!balance) throw new Error('Seller balance missing; provision it before processing this event'); const r = await API.commitEarningsReservation({ ownerId: balance.id, reservationId: payout.metadata.payoutItemId, idempotencyKey: `po:${payout.metadata.payoutItemId}:commit` }); if (r.errorCode && r.errorCode !== 'LEDGER_RESERVATION_ALREADY_RESOLVED') { throw new Error(`commit refused: ${r.errorCode}`); } })()" }
  },
  {
    "name": "restoreOnFailed",
    "trigger": "afterPayoutFailed",
    "description": "Bank rejected: release the hold — funds return untouched.",
    "script": { "js": "await (async () => { if (!payout || !payout.metadata) return; const balance = await getSellerBalanceByQuery({ sellerId: payout.metadata.sellerId }); if (!balance) throw new Error('Seller balance missing; provision it before processing this event'); const r = await API.releaseEarningsReservation({ ownerId: balance.id, reservationId: payout.metadata.payoutItemId, idempotencyKey: `po:${payout.metadata.payoutItemId}:release` }); if (r.errorCode && r.errorCode !== 'LEDGER_RESERVATION_ALREADY_RESOLVED') { throw new Error(`release refused: ${r.errorCode}`); } })()" }
  }
]
```

(`reservationId` accepts the hold's row id or, because
`referenceProperty` is bound, its business reference; the payout
item id addressed the hold at reserve, so it addresses it here too.)

## Why this shape is the recipe

The historical defect this closes: a payout marked `in_transit` that
is BOTH retryable and already-executed: the retry cron re-sends
money the ledger already released. Here that state cannot be
expressed:

- **Retry/attempt chaos lives on the payout side** (your outbox, your
  provider's webhooks). The ledger's whole vocabulary is
  reserve / commit / release, each idempotent under its own key.
- A redelivered `afterPayoutPaid` replays the commit
  (`alreadyProcessed`) or answers already-resolved. Either way funds
  move at most once.
- A crashed batch run leaves a hold, not a limbo debit: the sweep
  releases it after `staleAfterSeconds`, and the next cycle
  re-reserves cleanly.
- The commit drains the PERSISTED allocation plan quoted at reserve
  time: earnings that arrived mid-flight are untouched.

## The seller's screen

`getEarningsBalance` returns
`{ available, pending, reserved, spendable }`, which reads directly
as **paid-out-able / in refund window / payout in flight**. Ride a
session wrapper (`getMyEarnings`: resolve `sellerBalance` by
`session.userId`, call the internal API); `listEarningsEntries`
pages the lot detail for statements.
