# Fiscalization

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [Fiscalization in Part 2](../spec/Fiscalization.md)

Regulatory fiscalization activation for a DataObject. Mark a DataObject as fiscalized by enabling `objectIsFiscalized` and pointing `configuration.fiscalProviderName` at a configured FiscalProvider. The framework generates the sys_<X>FiscalDocument ledger around this object and routes each document through the jurisdiction's fiscal policy module (classify → prepare → validate → sign → submit → track → distribute → archive; which steps run is decided per document by the policy plus the provider's capabilities). Fiscalization is deliberately independent of `invoicing`: an invoicing-enabled object typically fiscalizes its finalized invoices, but a reporting-style regime may fiscalize transaction data on an object with no invoicing block at all — both shapes are supported. In a marketplace project the BILLING MODEL decides where this block goes: a reseller (merchant-model) platform fiscalizes the sale object itself, while an intermediary platform NEVER fiscalizes the sale — it fiscalizes only its commission object, whose buyerParty binds the seller's tax identity columns. The models, their legal pairing rules and the full commission composition are in the docs-site guide [Intermediation vs reseller billing](../guides/capabilities/intermediation-vs-reseller-billing.md).

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `fiscalization`

Blueprint paths:

- `authentication.dataObjects.objectSettings.fiscalization`
- `services.dataObjects.objectSettings.fiscalization`

## Contains

- `configuration`: [FiscalizationConfig](./FiscalizationConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
