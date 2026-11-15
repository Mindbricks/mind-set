# LedgerApiBinding

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerApiBinding in Part 2](../spec/LedgerApiBinding.md)

Binding overrides for one generated ledger API. A binding on an API the ledger does not generate raises LEDGER_API_BINDING_INERT. Per-API defaults live on LedgerGeneratedApis — the five mutating APIs default to internal-call only, getBalance to rest + internal, listEntries to rest, adjust to emit: false.

## Contained in

- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `earn`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `consume`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `reserve`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `commitReservation`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `releaseReservation`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `getBalance`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `listEntries`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `adjust`
- [LedgerGeneratedApis](./LedgerGeneratedApis.md) as `voidBySource`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
