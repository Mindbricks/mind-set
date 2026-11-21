---
title: Multi-asset crypto wallet
---

# Multi-asset crypto wallet

Fifty assets, one schema. The ledger's divider model makes a
multi-asset wallet a matter of owner-object design: one
`walletAccount` ROW per (user, asset), each row owning its own
ledger, with the per-asset fixed-point scale read from a column.
Listing a new asset is an INSERT, never a schema change.

> **Audience.** AI agent or human author building wallet-style
> balances (crypto, multi-currency, credits-per-workspace). Read
> [the ledger pattern page](../capabilities/ledger.md) first.

## Step 1: the asset catalog

An app-declared catalog row per supported asset. The wallet rows are
seeded from it:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "assetCatalog",
                       "description": "One row per supported asset" }
  },
  "properties": [
    { "basicSettings": { "name": "assetCode", "type": "String", "isRequired": true },
      "indexSettings": { "unique": true, "indexedInDb": true } },
    { "basicSettings": { "name": "displayName", "type": "String", "isRequired": true } },
    { "basicSettings": { "name": "scale", "type": "Integer", "isRequired": true,
        "description": "Minor units per whole unit: BTC 100000000, ETH 1000000000000000000 is TOO BIG for integer math — see the scale note — USDC 1000000" } }
  ]
}
```

> **Scale note.** Ledger amounts are integers in minor units. Pick a
> scale that keeps realistic balances inside safe integer range:
> satoshis (1e8) are fine; wei (1e18) are not. Custody-grade
> 1e18-denominated accounting needs a different representation.

## Step 2: the wallet owner with a per-asset scale

```json
{
  "objectSettings": {
    "basicSettings": { "name": "walletAccount",
                       "description": "One ledger row per (user, asset)" },
    "compositeIndexSettings": [
      { "indexFields": ["userId", "assetCode"], "onDuplicate": "throwError" }
    ],
    "ledgerSettings": {
      "objectOwnsALedger": true,
      "configuration": {
        "unit": { "name": "minorUnit", "scaleProperty": "assetScale" },
        "consumptionPolicy": "fifo",
        "reservation": {
          "enabled": true,
          "referenceProperty": "withdrawalRef",
          "staleAfterSeconds": 172800,
          "commitPolicy": "exact"
        },
        "events": { "prefix": "wallet", "secure": true }
      }
    }
  },
  "properties": [
    { "basicSettings": { "name": "userId", "type": "ID", "isRequired": true },
      "indexSettings": { "indexedInDb": true } },
    { "basicSettings": { "name": "assetCode", "type": "String", "isRequired": true },
      "indexSettings": { "indexedInDb": true } },
    { "basicSettings": { "name": "assetScale", "type": "Integer", "isRequired": true,
        "description": "Copied from assetCatalog.scale at row creation; read by unit.scaleProperty" } }
  ]
}
```

The load-bearing pieces:

- **The unique composite index** over (`userId`, `assetCode`). The
  divider IS the owner identity; without the index two rows could
  exist for the same pair, each carrying half the balance. The
  validator warns if you forget
  (`LEDGER_OWNER_IDENTITY_UNINDEXED`).
- **`unit.scaleProperty: "assetScale"`** instead of a global
  `unit.scale`: each row carries its own scale, seeded from the
  catalog. Declaring both forms (or neither) is a design-time error.
- **`events.secure: true`**: balance movements are money-shaped;
  the movement events register as signed secure events.

The stem of the generated APIs is `WalletAccountLedger` (the default
`ledgerName` collapses to `<Owner>Ledger`): `earnWalletAccountLedger`,
`getWalletAccountLedgerBalance`,
`commitWalletAccountLedgerReservation`, routes under
`/ledger/walletaccountledger/…`.

## Step 3: deposits credit, withdrawals reserve

A confirmed on-chain deposit credits the row's ledger. The deposit
watcher (however it enters the service: event subscription, kafka
controller, cron) resolves the row and calls the internal API.

Session note: a wrapper (or a hook) that has a caller session and
addresses a tenant-scoped wallet passes `{ session: this.session }` as
the internal call's optional second argument, where the compiler
supports it, to carry the caller's tenant. The sessionless examples
below remain system calls with a null session; no session is implicitly
inherited. The second argument does not change the ledger's explicit
inputs. See
[Session never enters the ledger core](../capabilities/ledger.md#session-never-enters-the-ledger-core).

```js
const account = await getWalletAccountByQuery({
  userId: deposit.userId, assetCode: deposit.assetCode,
});
const r = await API.earnWalletAccountLedger({
  ownerId: account.id,
  amount: deposit.amountMinor,               // integer, at the row's scale
  idempotencyKey: `dep:${deposit.txHash}:${deposit.outputIndex}`,
  sourceId: deposit.txHash, sourceType: 'chain-deposit',
});
if (r.errorCode) throw new Error(`deposit credit refused: ${r.errorCode}`);
```

A withdrawal must not double-send while the transaction is in flight:
that is the two-phase reservation, with the withdrawal request as
the hold's business reference:

```js
// initiation: hold the funds. One OPEN hold per (account, withdrawalRef)
// — a double-submitted withdrawal is a typed 409, not a double-send.
const hold = await API.reserveWalletAccountLedger({
  ownerId: account.id, amount: request.amountMinor,
  idempotencyKey: `wd:${request.id}:reserve`,
  reference: request.id, kind: 'withdrawal',
});

// broadcast confirmed → the hold commits (its own idempotency line)
await API.commitWalletAccountLedgerReservation({
  ownerId: account.id, reservationId: hold.reservation.id,
  idempotencyKey: `wd:${request.id}:commit`,
});

// broadcast failed → release; the balance returns untouched
await API.releaseWalletAccountLedgerReservation({
  ownerId: account.id, reservationId: hold.reservation.id,
  idempotencyKey: `wd:${request.id}:release`,
});
```

Every one of these resolves to the API's output: check
`r.errorCode` before trusting `r.movement` / `r.reservation`. The
sweep cron releases holds a crashed workflow abandoned (default
48 h).

## Step 4: portfolio = a list over the rows

There is deliberately NO aggregate ledger state. A user's portfolio
is their `walletAccount` rows: each row already carries its
materialized `walletAccountLedgerAvailable` / `Pending` / `Reserved`
columns. A plain list API (or a DataView joining `assetCatalog` for
display names) is the whole feature:

```json
{
  "basics": { "apiOptions": { "name": "getMyPortfolio", "crudType": "list",
              "dataObjectName": "walletAccount" },
              "authOptions": { "loginRequired": true } },
  "controllers": { "restSettings": { "hasRestController": true,
                   "routePath": "/my-portfolio" } },
  "query": { "whereClause": {
    "fullWhereClause": { "js": "{ userId: this.session.userId }" } } }
}
```

Per-asset detail screens ride a `getMyBalance`-style wrapper:
resolve the row by (session user, assetCode), then
`await API.getWalletAccountLedgerBalance({ ownerId }, { session: this.session })`
(where the compiler supports the session argument) and show the
`{ available, pending, reserved, spendable }` triple.

## Honesty: swap is TWO transactions

v1 has no atomic cross-ledger transfer. A BTC→USDC swap wrapper is
`consume` on the BTC row + `earn` on the USDC row: two transactions.
The second leg can fail after the first commits, and your wrapper
owns the compensation (an `earn` back onto the BTC row, keyed
`swap:<id>:compensate`). Derive all three idempotency keys from the
same swap id so every leg replays cleanly. `transfer()` is the named
v2 candidate; until it exists, treat swaps as a saga you author.
