# SettlementReleaseConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [SettlementReleaseConfig in Part 2](../spec/SettlementReleaseConfig.md)

When a providerSplit marketplace sale's seller share is released (MarketplaceConfig.settlementRelease). The framework books one payout row per captured sale (payment.captured) carrying the provider's settlement item ids of that sale, holds it until the condition below holds, and the payout-scheduler releases it exactly once (its claim / fence path), re-checking the condition on every tick. Bindings are PropRefers naming properties of the SAME data object that carries the marketplace block (the sale row read back from the database, never a request body). Composes with payoutGate: a gated release still waits for the matching inbound invoice.

## Contained in

- [MarketplaceConfig](./MarketplaceConfig.md) as `settlementRelease`

## Contains

No other pattern: every property is a value or a reference.

## References

- `releaseAtProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `statusProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
