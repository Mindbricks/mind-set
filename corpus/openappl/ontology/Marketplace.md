# Marketplace

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [Marketplace in Part 2](../spec/Marketplace.md)

Provider-neutral marketplace activation for a DataObject. When enabled, the framework auto-generates sys_<X>ConnectedAccount and sys_<X>Payout records and wires the connected-account KYC, transfer, and payout APIs through the bound provider. Requires the bound PaymentProvider to have capabilities.supportsMarketplace=true. In a multi-tenant project, the object carrying this marketplace block must declare objectSettings.authorization.objectDataIsInTenantLevel: true. Blueprint validation refuses non-tenant sellers with MARKETPLACE_SELLER_NOT_TENANT_LEVEL before code generation or PSP account creation; hosted onboarding, manual binding and sellerOnboarding provisioning share this rule. The connected-account ledger and charge lookup require the tenant persisted on the seller row. Single-tenant shapes are unchanged.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `marketplace`

Blueprint paths:

- `authentication.dataObjects.objectSettings.marketplace`
- `services.dataObjects.objectSettings.marketplace`

## Contains

- `configuration`: [MarketplaceConfig](./MarketplaceConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
