# LedgerUnit

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerUnit in Part 2](../spec/LedgerUnit.md)

The ledger's unit of account. `name` labels the unit (points, credits, cents, stock units); amounts are integers at a fixed-point scale. EXACTLY ONE of `scale` or `scaleProperty` must be declared (validator-enforced): `scale` is a single global scale for the whole ledger; `scaleProperty` names an owner-row column carrying the per-asset scale — the multi-asset divider form, where the scale is seeded from an app-declared asset catalog (BTC rows carry 100000000, USD rows carry 100).

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `unit`

## Contains

No other pattern: every property is a value or a reference.

## References

- `scaleProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
