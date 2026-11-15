# LedgerBalance

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerBalance in Part 2](../spec/LedgerBalance.md)

Defines the available, pending and reserved balances returned by getBalance. The THREE-NUMBER balance contract: getBalance returns `available` (mature + unreserved), `pending` (unmatured), and `reserved` (held by open reservations) — and maturity is filtered IN THE QUERY, never post-query in application code. In materialized mode the named owner-row columns carry the running numbers and every mutation compare-and-sets them atomically with the lot and movement writes; `invariantCheckCron` schedules the verifyInvariants job that re-derives the numbers from the lots and reports drift.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `balance`

## Contains

No other pattern: every property is a value or a reference.

## References

- `availableProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `pendingProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `reservedProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `lifetimeCreditedProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `lifetimeConsumedProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
