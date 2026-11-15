# FiscalInternetSaleConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [FiscalInternetSaleConfig in Part 2](../spec/FiscalInternetSaleConfig.md)

Bindings sourcing the internet-sales content of a fiscal document from the owning DataObject. Some reporting regimes demand extra content for e-commerce sales (Turkey, VUK General Communique 509: an e-archive invoice for an internet sale must state the website, the payment method and date, the shipment date and a complete carrier party). Each slot binds a property of the owning object (PropRefer — per-row values) and, where the value is fixed per project, a static fallback; the website is static-only, since the sales channel does not vary per row. The carrier is declared by carrierMode: carrierCompany reads the carrier's legal title and VKN/TCKN from the designer's carrier data object (the carrier-company settings; OpenAPPL has no carrier system table) or from static values for a single-carrier shop, plus the tracking number; selfDelivery names the seller as the carrier; noShipment declares that nothing physical is shipped. An empty carrierMode reads as noShipment when no shipment slot (carrier source, legacy carrier name, shipment date, tracking number) is bound - a digital or service sale, with a WARNING - and as carrierCompany otherwise (maintainer ruling 2026-10-03). Never a name-only or empty carrier: a TR configuration without a carrier source is refused at design time and a carrier whose tax id does not resolve is refused before the integrator call. Slots left null are simply omitted from the document. The block is object-level (maintainer ruling 2026-10-03): once it binds anything, every row of the owning object is an internet sale - the phrase, the carrier per carrierMode, the ELEKTRONIK sending type - whatever that row's own slot values; an object that sells both in store and online is split into two objects or two fiscalization configurations. Kept deliberately lean per the FiscalPartyConfig doctrine — WHERE the values land on the document is the jurisdiction policy module's concern, not blueprint fields.

## Contained in

- [FiscalizationConfig](./FiscalizationConfig.md) as `internetSale`

## Contains

No other pattern: every property is a value or a reference.

## References

- `paymentMethodProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `paymentDateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `shipmentCarrierProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `shipmentDateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `carrierDataObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))
- `carrierRefProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `carrierTitleProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `carrierDataObject`)
- `carrierTaxIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `carrierDataObject`)
- `carrierAddressProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `carrierDataObject`)
- `carrierDistrictProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `carrierDataObject`)
- `carrierCityProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `carrierDataObject`)
- `trackingNumberProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
