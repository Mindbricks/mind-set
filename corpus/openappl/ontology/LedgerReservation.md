# LedgerReservation

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerReservation in Part 2](../spec/LedgerReservation.md)

Two-phase holds: reserve places a hold (available → reserved), commitReservation consumes it, releaseReservation returns it. This is the payout recipe — payout initiation → reserve (referenceProperty = the payout item's ref, so double-reserve is structurally impossible); afterPayoutPaid → commitReservation; afterPayoutFailed → releaseReservation — and it keeps the retry/attempt boundary clean: attempt chaos stays on the payout/outbox side while the ledger sees only reserve/commit/release. The sweep releases holds stale past `staleAfterSeconds`, restoring BOTH sides — the lots and the balance — in one transaction.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `reservation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
