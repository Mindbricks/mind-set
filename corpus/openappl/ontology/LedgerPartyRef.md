# LedgerPartyRef

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerPartyRef in Part 2](../spec/LedgerPartyRef.md)

Column names for one party side of a movement. Pure metadata: the ledger stores and returns these values but never resolves, validates, or joins them — no FK is created (declare a real relation under additionalProperties when referential integrity is wanted).

## Contained in

- [LedgerParties](./LedgerParties.md) as `source`
- [LedgerParties](./LedgerParties.md) as `target`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
