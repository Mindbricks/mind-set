# LedgerConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerConfig in Part 2](../spec/LedgerConfig.md)

Configuration for the append-only ledger owned by each row of the decorated DataObject. Property bindings (`ownerKeyProperty`, `balance.*Property`, `unit.scaleProperty`) are PropRefer paths into the OWNER object's declared properties. Column-name fields on the satellite blocks (`parties`, `entrySource`, `entryMaturity`, `reservation`) NAME generated columns on the satellite tables and must not collide with the framework-owned generated fields (LEDGER_RESERVED_FIELD_COLLISION). Every balance mutation is a compare-and-set on the owner row's generated version column inside ONE transaction with the lot writes and the movement row; consumption applies each allocation with compare-and-set on `remaining = previousRemaining`.

## Contained in

- [LedgerSettings](./LedgerSettings.md) as `configuration`

## Contains

- `unit`: [LedgerUnit](./LedgerUnit.md)
- `balance`: [LedgerBalance](./LedgerBalance.md)
- `parties`: [LedgerParties](./LedgerParties.md)
- `entrySource`: [LedgerEntrySource](./LedgerEntrySource.md)
- `entryMaturity`: [LedgerEntryMaturity](./LedgerEntryMaturity.md)
- `expiry`: [LedgerExpiry](./LedgerExpiry.md)
- `reservation`: [LedgerReservation](./LedgerReservation.md)
- `additionalProperties`: [LedgerAdditionalProperties](./LedgerAdditionalProperties.md)
- `events`: [LedgerEvents](./LedgerEvents.md)
- `generatedApis`: [LedgerGeneratedApis](./LedgerGeneratedApis.md)

## References

- `ownerKeyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
