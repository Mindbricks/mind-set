# Fiscalization

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [Fiscalization in Part 1](../ontology/Fiscalization.md)

**Activation:** the pattern is switched on by `objectIsFiscalized`.

Regulatory fiscalization activation for a DataObject. Mark a DataObject as fiscalized by enabling `objectIsFiscalized` and pointing `configuration.fiscalProviderName` at a configured FiscalProvider. The framework generates the sys_<X>FiscalDocument ledger around this object and routes each document through the jurisdiction's fiscal policy module (classify → prepare → validate → sign → submit → track → distribute → archive; which steps run is decided per document by the policy plus the provider's capabilities). Fiscalization is deliberately independent of `invoicing`: an invoicing-enabled object typically fiscalizes its finalized invoices, but a reporting-style regime may fiscalize transaction data on an object with no invoicing block at all — both shapes are supported. In a marketplace project the BILLING MODEL decides where this block goes: a reseller (merchant-model) platform fiscalizes the sale object itself, while an intermediary platform NEVER fiscalizes the sale — it fiscalizes only its commission object, whose buyerParty binds the seller's tax identity columns. The models, their legal pairing rules and the full commission composition are in the docs-site guide [Intermediation vs reseller billing](../guides/capabilities/intermediation-vs-reseller-billing.md).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectIsFiscalized` | `Boolean` | yes |  |  |  | Enables fiscalization logic for this object. When true, the object is treated as the source of fiscal documents: the framework generates the sys_<X>FiscalDocument ledger and the submit/track surface bound to the configured FiscalProvider and jurisdiction policy. |
| `configuration` | [`FiscalizationConfig`](./FiscalizationConfig.md) | no |  |  |  | The FiscalizationConfig describing how this object maps onto the fiscal pipeline (provider binding, jurisdiction, party bindings, document typing, submit policy, lifecycle hooks). Leave it null if objectIsFiscalized is false. |

## Constraints

Property rules:

- `objectIsFiscalized` must be present. Enforced only while `objectIsFiscalized` is on. (`REQUIRED_FIELD_MISSING`)
