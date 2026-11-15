# LedgerEntryMaturity

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerEntryMaturity in Part 2](../spec/LedgerEntryMaturity.md)

Lot maturity. There is NO separate pending-lot concept — 'pending points with an abandonment sweep' is exactly 'unmatured lot + maturity deadline', one concept. Each lot carries a nullable availableAt: set from `defaultDelay` at credit time (or supplied per earn call); until it passes, the lot counts toward the balance's PENDING number and cannot be consumed or reserved — and consume/getBalance filter maturity IN THE QUERY, never post-query in application code. The maturity cron matures due lots (pending → available) and publishes `<prefix>.entry.matured`.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `entryMaturity`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
