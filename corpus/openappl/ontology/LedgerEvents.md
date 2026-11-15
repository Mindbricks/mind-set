# LedgerEvents

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerEvents in Part 2](../spec/LedgerEvents.md)

Event emission for the ledger. Topics are prefixed with `prefix` (default: the ledger name) — e.g. `<prefix>.entry.matured`, `<prefix>.entry.expired`, `<prefix>.reservation.released`. `publishBalanceChanged` opts into a balance-changed event on EVERY mutation (default false — high volume; prefer the specific lifecycle events). `secure` requires the project's Ed25519 signature on the ledger's events for cross-trust-boundary consumers (same mechanism as serviceOptions.secureEvents).

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `events`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
