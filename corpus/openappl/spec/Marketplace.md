# Marketplace

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [Marketplace in Part 1](../ontology/Marketplace.md)

**Activation:** the pattern is switched on by `objectIsMarketplaceObject`.

Provider-neutral marketplace activation for a DataObject. When enabled, the framework auto-generates sys_<X>ConnectedAccount and sys_<X>Payout records and wires the connected-account KYC, transfer, and payout APIs through the bound provider. Requires the bound PaymentProvider to have capabilities.supportsMarketplace=true. In a multi-tenant project, the object carrying this marketplace block must declare objectSettings.authorization.objectDataIsInTenantLevel: true. Blueprint validation refuses non-tenant sellers with MARKETPLACE_SELLER_NOT_TENANT_LEVEL before code generation or PSP account creation; hosted onboarding, manual binding and sellerOnboarding provisioning share this rule. The connected-account ledger and charge lookup require the tenant persisted on the seller row. Single-tenant shapes are unchanged.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectIsMarketplaceObject` | `Boolean` | yes |  |  |  | Enables marketplace flows for this object. When true, the framework treats this object as a marketplace transaction with a connected sub-merchant account. |
| `configuration` | [`MarketplaceConfig`](./MarketplaceConfig.md) | no |  |  |  | The MarketplaceConfig binding seller-account / amount / fee properties to the provider's marketplace surface. Leave null if objectIsMarketplaceObject is false. |

## Constraints

Property rules:

- `objectIsMarketplaceObject` must be present. Enforced only while `objectIsMarketplaceObject` is on. (`REQUIRED_FIELD_MISSING`)
