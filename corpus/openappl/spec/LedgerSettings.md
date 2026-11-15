# LedgerSettings

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerSettings in Part 1](../ontology/LedgerSettings.md)

**Activation:** the pattern is switched on by `objectOwnsALedger`.

Append-only-ledger activation for a DataObject. When enabled, each ROW of the decorated object OWNS a ledger: the framework generates the satellite objects (sys_<X>LedgerEntry lots, sys_<X>LedgerMovement append-only log, sys_<X>LedgerReservation when reservations are enabled) and the earn/consume/reserve/commitReservation/releaseReservation/getBalance/listEntries/adjust API roster, all bound to the owner row by a single FK.

OWNERSHIP IS THE ROW. There is no divider machinery inside the ledger — dividers are owner-IDENTITY columns on the decorated object itself. Multi-store stock is a `storeStockItem` object (storeId + productId with a unique composite index — without it, two ledger rows can exist for the same (store, product) and each carries half the truth); a multi-asset wallet is a `walletAccount` object (userId + assetCode), where 50+ crypto assets are 50+ rows and listing a new asset is an INSERT, never a schema change; the tenant divider comes free via `objectDataIsInTenantLevel`. Polymorphic owners (a payee that may be a user or an organization) declare a thin owner object rather than a polymorphic FK. Per-asset scales use `unit.scaleProperty` (an owner-row column seeded from an app-declared asset catalog — BTC rows carry 1e8, USD rows carry 100) instead of a global `unit.scale`; exactly one of the two is declared.

SESSION NEVER ENTERS THE LEDGER CORE. Mutating ledger APIs are fully parametric internal-call APIs: ownerId and operation inputs stay explicit, with no session-injected columns or ownership checks. User-facing spends are thin WRAPPER APIs the designer declares — e.g. `spendMyPoints` (REST, session-injected) resolves the caller's wallet row, then on nodejs, python, rust, java or dotnet calls `await API.consumeWalletLedger({ ownerId, amount, target, idempotencyKey }, { session: this.session })`. For a tenant-scoped owner object the second argument is required so the generated manager resolves the caller's tenant. A nodejs hook that has a caller session passes it in the same way. Omitting it leaves the session null and preserves the existing asSystem behavior, with no implicit inheritance through AsyncLocalStorage or the running manager. Language targets without explicit-session support retain the sessionless signature. Teach the wrapper, never session-inject the core.

Requires a RELATIONAL dbType on the owning service — every balance mutation is a multi-row compare-and-set in one transaction, which has no document-store emulation; mongodb is refused at design time (LEDGER_REQUIRES_RELATIONAL_DB).

OUT OF SCOPE in v1, stated so the boundary is designed rather than inferred: atomic cross-ledger conversion/swap (a two-legged consume+earn wrapper is TWO transactions; `transfer()` is the named v2 candidate); aggregate/portfolio reads (a DataView/list over owner rows, never materialized ledger state); and retry/attempt semantics (attempt counters, MAX_ATTEMPTS, retry crons are OUTBOX/delivery machinery about external providers, not ledger arithmetic — the outbox/delivery pattern is their future home). Integration recipes: earn-on-capture, clawback-on-refund, payout-via-reservation (see the pattern docs). Java supports the qualified relational ledger owner and its outbound response, stream, replay and event read boundary. Raw database reads and mutation amounts stay minor-unit integers. Projected outward Integer/Short columns use major-unit Double documentation; scale-one, CAS and non-ledger columns retain storage types, and per-asset satellites remain raw.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectOwnsALedger` | `Boolean` | no | `false` |  |  | Enables the append-only ledger for this object. When true, every row of this object owns a ledger and the framework generates the satellite lot/movement(/reservation) objects, the configured API roster, and the configured cron jobs. |
| `configuration` | [`LedgerConfig`](./LedgerConfig.md) | no |  |  |  | The LedgerConfig describing the ledger's unit, balance contract, consumption policy, parties, source refs, maturity, expiry, reservations, extra columns, events, and generated APIs. Auto-initialized to an empty config when objectOwnsALedger flips true; leave it null if objectOwnsALedger is false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.

## Example

Decorate a wallet-style object so every row owns an append-only points ledger: integer amounts at a fixed scale, FIFO consumption, a one-year expiry with a 30-day reminder window, and two-phase holds keyed by a business reference. The framework generates the lot/movement/reservation satellites, the earn/consume/reserve/commit/release/getBalance/listEntries roster (mutating APIs internal-call only — user-facing spends go through a designer wrapper API that resolves the caller's row from the session and calls `await API.consumePoints({ ownerId, amount, idempotencyKey, ... })`), and the expire/remind/sweep crons.

```json
{
  "objectOwnsALedger": true,
  "configuration": {
    "ledgerName": "points",
    "unit": {
      "name": "point",
      "scale": 1
    },
    "consumptionPolicy": "fifo",
    "entrySource": {
      "referenceProperty": "sourceRef",
      "unique": true
    },
    "expiry": {
      "enabled": true,
      "ttl": "P365D",
      "reminderLeadDays": 30
    },
    "reservation": {
      "enabled": true,
      "referenceProperty": "checkoutRef",
      "commitPolicy": "exact"
    },
    "events": {
      "prefix": "points"
    }
  }
}
```
