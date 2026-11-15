# LedgerEntrySource

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [LedgerEntrySource in Part 2](../spec/LedgerEntrySource.md)

Configures the source-reference column and optional owner/source uniqueness of credited lots. The coarse source-reference line on the LOTS: `referenceProperty` names a generated lot column storing the originating business ref of each credited lot, and with `unique: true` (the default) the framework adds a unique (owner, sourceRef) index — the optional COARSE second idempotency line behind the movement-level idempotencyKey (one credit per business source, e.g. one earn per order).

## Contained in

- [LedgerConfig](./LedgerConfig.md) as `entrySource`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
