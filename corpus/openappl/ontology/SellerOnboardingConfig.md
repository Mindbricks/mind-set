# SellerOnboardingConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [SellerOnboardingConfig in Part 2](../spec/SellerOnboardingConfig.md)

Role-to-property map that lets the FRAMEWORK PROVISION a seller's connected sub-merchant account (level 2), instead of a designer hand-pasting a provider-side key into `sellerAccountProperty`. `sellerAccountProperty` says where the minted account id LIVES; this block says where the facts it is minted FROM come from. Every entry is a PropRefer naming a property OF THE OWNING DATA OBJECT - the same object `sellerAccountProperty` resolves against, exactly like FiscalPartyConfig's party bindings - so the SELLER-BEARING object is the object that carries the marketplace block; a separate seller/profile object carries its OWN marketplace block rather than being reached through a relation (PropRefer has no cross-object resolution, and inventing one here would make the money bindings and the identity bindings resolve against different rows), and the order objects that charge to it name it in their own marketplace block's sellerAccountObject instead of declaring this block. The blueprint speaks ROLES; the payment adapters speak provider WIRE FIELDS (iyzico subMerchantType / legalCompanyTitle / gsmNumber, Stripe business_type, ...) and translate at the edge - no provider-specific field name may ever appear in this block. WHEN THE DATA IS COLLECTED: the PRODUCT owns the form and the FRAMEWORK owns the requirements. A seller signup screen, an admin back-office edit or an import writes these properties through the object's ordinary CRUD, long before any provisioning call; provisioning reads them off the persisted row. WHEN NOT TO DECLARE THIS BLOCK AT ALL: a HOSTED-onboarding provider (kycOnboarding mode hosted-url / partner-referrals - Stripe Connect onboarding, PayPal partner referrals) collects the seller's legal identity on ITS OWN pages, so the platform never holds these facts and the block stays null; declare it for the API-onboarding brands (iyzico sub-merchant, Mangopay document-api) whose account is minted from a payload the platform assembles. Absent/null = no provisioning declaration: no finding is raised and emitted code is byte-identical to a blueprint without this block.

## Contained in

- [MarketplaceConfig](./MarketplaceConfig.md) as `sellerOnboarding`

## Contains

No other pattern: every property is a value or a reference.

## References

- `legalNameProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `taxIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `taxOfficeProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `addressProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `ibanProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `identityNumberProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `contactNameProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `contactSurnameProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `sellerTypeProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `emailProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `gsmProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
