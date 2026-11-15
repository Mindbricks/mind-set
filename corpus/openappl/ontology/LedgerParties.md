# LedgerParties

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerParties in Part 2](../spec/LedgerParties.md)

Names of the generated party-reference columns on the movement rows: earn carries a SOURCE ref (what granted the value), consume/reserve carry a TARGET ref (what the value was spent on). Party refs are movement METADATA — the lot stores its source, movement rows store both sides, and the values arrive as explicit API parameters. They are NEVER FK-resolved by the ledger: cross-service values are legal (an order id from another service, a promotion code, a support-ticket ref). When a real FK relation is wanted, declare it under additionalProperties instead. When this block or a side is omitted, the columns default to sourceId/sourceType and targetId/targetType.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `parties`

## Contains

- `source`: [LedgerPartyRef](./LedgerPartyRef.md)
- `target`: [LedgerPartyRef](./LedgerPartyRef.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
