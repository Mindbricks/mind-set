# LedgerParties

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerParties in Part 1](../ontology/LedgerParties.md)

Names of the generated party-reference columns on the movement rows: earn carries a SOURCE ref (what granted the value), consume/reserve carry a TARGET ref (what the value was spent on). Party refs are movement METADATA — the lot stores its source, movement rows store both sides, and the values arrive as explicit API parameters. They are NEVER FK-resolved by the ledger: cross-service values are legal (an order id from another service, a promotion code, a support-ticket ref). When a real FK relation is wanted, declare it under additionalProperties instead. When this block or a side is omitted, the columns default to sourceId/sourceType and targetId/targetType.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `source` | [`LedgerPartyRef`](./LedgerPartyRef.md) | no |  |  |  | Column names for the SOURCE side (set by earn; also stored on the lot). Defaults to sourceId/sourceType. |
| `target` | [`LedgerPartyRef`](./LedgerPartyRef.md) | no |  |  |  | Column names for the TARGET side (set by consume/reserve). Defaults to targetId/targetType. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
