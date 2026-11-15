# LedgerAdditionalProperties

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerAdditionalProperties in Part 2](../spec/LedgerAdditionalProperties.md)

Designer-declared extra columns on the generated satellite objects — full DataProperty declarations, relations included. This is where REAL FKs live, in contrast to the metadata-only party refs. Names must not collide with the framework-owned generated fields of each satellite table (LEDGER_RESERVED_FIELD_COLLISION) nor with the column names configured on parties/entrySource/entryMaturity/reservation.

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `additionalProperties`

## Contains

- `entry`: [DataProperty](./DataProperty.md), a list
- `movement`: [DataProperty](./DataProperty.md), a list
- `reservation`: [DataProperty](./DataProperty.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
