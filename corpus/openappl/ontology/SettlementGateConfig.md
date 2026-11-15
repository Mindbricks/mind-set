# SettlementGateConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [SettlementGateConfig in Part 2](../spec/SettlementGateConfig.md)

Invoice gate on the approve step of platformSettled settlement instructions (MarketplaceConfig.settlementGate). The platform approves a payment instruction to a seller only against the seller's matching incoming invoice. Same shape and matching rule as PayoutGateConfig, consulted on POST /v1/payments/settlement/instructions/:id/approve instead of on a PSP payout.

## Contained in

- [MarketplaceConfig](./MarketplaceConfig.md) as `settlementGate`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
