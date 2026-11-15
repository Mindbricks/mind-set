# MarketplaceConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [MarketplaceConfig in Part 2](../spec/MarketplaceConfig.md)

Configuration for marketplace payouts on a DataObject. Provider-binding via `providerName`. Requires the bound provider to have capabilities.supportsMarketplace=true. In a multi-tenant project the seller-bearing object must be tenant-level (objectSettings.authorization.objectDataIsInTenantLevel: true); non-tenant sellers are refused at blueprint validation with MARKETPLACE_SELLER_NOT_TENANT_LEVEL before any PSP create call, whether onboarding is hosted or manual. Maps the object's seller-account / amount / fee properties onto the provider's marketplace primitives (Stripe Connect transfers, PayPal Hyperwallet, iyzico sub-merchant, Adyen MarketPay, Mangopay wallets).

## Contained in

- [Marketplace](./Marketplace.md) as `configuration`

## Contains

- `payoutGate`: [PayoutGateConfig](./PayoutGateConfig.md)
- `lifecycleHooks`: [LifecycleHook](./LifecycleHook.md), a list
- `sellerOnboarding`: [SellerOnboardingConfig](./SellerOnboardingConfig.md)
- `settlementRelease`: [SettlementReleaseConfig](./SettlementReleaseConfig.md)
- `settlementGate`: [SettlementGateConfig](./SettlementGateConfig.md)

## References

- `sellerAccountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `amountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `applicationFeeProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `currencyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `transferGroupProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `sellerAccountObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))
- `settlementGroupProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `settlementEligibleAfterProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
