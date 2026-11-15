# LedgerSettings

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerSettings in Part 2](../spec/LedgerSettings.md)

Append-only-ledger activation for a DataObject. When enabled, each ROW of the decorated object OWNS a ledger: the framework generates the satellite objects (sys_<X>LedgerEntry lots, sys_<X>LedgerMovement append-only log, sys_<X>LedgerReservation when reservations are enabled) and the earn/consume/reserve/commitReservation/releaseReservation/getBalance/listEntries/adjust API roster, all bound to the owner row by a single FK.

OWNERSHIP IS THE ROW. There is no divider machinery inside the ledger — dividers are owner-IDENTITY columns on the decorated object itself. Multi-store stock is a `storeStockItem` object (storeId + productId with a unique composite index — without it, two ledger rows can exist for the same (store, product) and each carries half the truth); a multi-asset wallet is a `walletAccount` object (userId + assetCode), where 50+ crypto assets are 50+ rows and listing a new asset is an INSERT, never a schema change; the tenant divider comes free via `objectDataIsInTenantLevel`. Polymorphic owners (a payee that may be a user or an organization) declare a thin owner object rather than a polymorphic FK. Per-asset scales use `unit.scaleProperty` (an owner-row column seeded from an app-declared asset catalog — BTC rows carry 1e8, USD rows carry 100) instead of a global `unit.scale`; exactly one of the two is declared.

SESSION NEVER ENTERS THE LEDGER CORE. Mutating ledger APIs are fully parametric internal-call APIs: ownerId and operation inputs stay explicit, with no session-injected columns or ownership checks. User-facing spends are thin WRAPPER APIs the designer declares — e.g. `spendMyPoints` (REST, session-injected) resolves the caller's wallet row, then on nodejs, python, rust, java or dotnet calls `await API.consumeWalletLedger({ ownerId, amount, target, idempotencyKey }, { session: this.session })`. For a tenant-scoped owner object the second argument is required so the generated manager resolves the caller's tenant. A nodejs hook that has a caller session passes it in the same way. Omitting it leaves the session null and preserves the existing asSystem behavior, with no implicit inheritance through AsyncLocalStorage or the running manager. Language targets without explicit-session support retain the sessionless signature. Teach the wrapper, never session-inject the core.

Requires a RELATIONAL dbType on the owning service — every balance mutation is a multi-row compare-and-set in one transaction, which has no document-store emulation; mongodb is refused at design time (LEDGER_REQUIRES_RELATIONAL_DB).

OUT OF SCOPE in v1, stated so the boundary is designed rather than inferred: atomic cross-ledger conversion/swap (a two-legged consume+earn wrapper is TWO transactions; `transfer()` is the named v2 candidate); aggregate/portfolio reads (a DataView/list over owner rows, never materialized ledger state); and retry/attempt semantics (attempt counters, MAX_ATTEMPTS, retry crons are OUTBOX/delivery machinery about external providers, not ledger arithmetic — the outbox/delivery pattern is their future home). Integration recipes: earn-on-capture, clawback-on-refund, payout-via-reservation (see the pattern docs). Java supports the qualified relational ledger owner and its outbound response, stream, replay and event read boundary. Raw database reads and mutation amounts stay minor-unit integers. Projected outward Integer/Short columns use major-unit Double documentation; scale-one, CAS and non-ledger columns retain storage types, and per-asset satellites remain raw.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `ledgerSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings.ledgerSettings`
- `services.dataObjects.objectSettings.ledgerSettings`

## Contains

- `configuration`: [LedgerConfig](./LedgerConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
