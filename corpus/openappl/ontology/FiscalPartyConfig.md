# FiscalPartyConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [FiscalPartyConfig in Part 2](../spec/FiscalPartyConfig.md)

Identity of one party (seller or buyer) on a fiscal document. Each of the three identity slots (tax id, legal name, address) binds EITHER a property of the owning DataObject (PropRefer — per-row identity) OR a static value (fixed identity); when both are set the property wins and the static value is the row-level fallback. The tax id is the load-bearing slot: it keys buyer-lookup routing and appears verbatim on the document; name and address are document content. Kept deliberately lean — structured address breakdowns, registration numbers and scheme ids are jurisdiction concerns the policy module derives, not blueprint fields.

## Contained in

- [FiscalizationConfig](./FiscalizationConfig.md) as `sellerParty`
- [FiscalizationConfig](./FiscalizationConfig.md) as `buyerParty`

## Contains

No other pattern: every property is a value or a reference.

## References

- `taxIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `nameProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `addressProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
