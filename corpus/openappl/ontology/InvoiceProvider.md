# InvoiceProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [InvoiceProvider in Part 2](../spec/InvoiceProvider.md)

A named invoice provider configuration. The `name` is the lookup key used by `DataObject.invoicing.configuration.providerName` and the env-var prefix (e.g. `mainParasut` → `INVOICE_PROVIDER_MAINPARASUT_*`). The `provider` enum selects the backend adapter; brands split into two families:

- NATIVE brands (internal, stripe, logoIsbasi, mikro, parasut, custom) own their credentials here, in `configuration` — a free-form key/value list whose required keys depend on the chosen `provider` (the UI and the agent ontology doc enforce the per-provider shape). `integrationName` MUST stay null for them.
- BRIDGE brands (sap, dynamics365, netsuite, logoTiger) carry NO configuration keys of their own: they REQUIRE `integrationName` to name a `projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[]` entry, whose platform credentials the mcpbff bridge already holds. Declaring credentials twice is exactly the drift the split exists to prevent.

Expected configuration keys per NATIVE provider:
- internal: (none — the framework issues, numbers and stores invoices itself)
- stripe: secretKey, webhookSecret
- logoIsbasi: clientId, clientSecret, firmId
- mikro: baseUrl, apiKey, companyCode (optional)
- parasut: clientId, clientSecret, companyId, username (optional), password (optional)
- custom: baseUrl, apiKey (optional)

The `capabilities` block reflects what the underlying provider can do — its defaults are derived from `provider` at codegen time, advanced users can narrow them per-entry. Secret keys (secretKey, clientSecret, apiKey, password, webhookSecret) are masked in API responses and emitted to INVOICE_PROVIDER_<NAME>_<KEY> env vars at codegen time.

BRAND -> PLATFORM PAIRING (bridge brands only). A bridge brand drives ONE enterprise platform family, and the validator enforces the pairing after it resolves `integrationName`: naming an integration that exists is not enough, the resolved entry's `platform` must be one the brand can drive.
- sap: sapS4Hana or sapEcc (one invoice brand over both SAP Gateway platforms - the named integration decides which)
- dynamics365: dynamics365
- netsuite: netsuite
- logoTiger: NO platform yet - EnterprisePlatformType carries no Logo value, so no integrationName can ever satisfy this brand and declaring it is a typed error (INVOICE_PROVIDER_PLATFORM_UNAVAILABLE)
A mismatch is INVOICE_PROVIDER_PLATFORM_MISMATCH and names the allowed platforms. The pairing table is machine-readable, not prose: it is the `platforms` field of each brand's row in the provider config catalog's `__brandStatus` block.

SHIPPED STATE (honest). Only `internal` (Faz 1b) and `stripe` (Faz 2) have adapters today. `logoIsbasi`, `mikro` and `parasut` are Faz 3.5; all four bridge brands are Faz 4+ and additionally wait on the EnterpriseBridge semantic layer. Those brands are DECLARABLE - the blueprint accepts them and their credential keys are catalogued - but binding a data object to one is a typed 501 at runtime naming the phase. `custom` is the bring-your-own escape hatch: the project registers its own adapter, so the framework ships none on purpose. A settings UI must read the per-brand `status` field from GET {apiBase}/patterns/provider-config-catalog (family=invoiceProvider, `brandStatus`) rather than hardcoding this roster, and mark the roadmap brands instead of offering a form that cannot be completed.

## Contained in

- [InvoiceProvidersSettings](./InvoiceProvidersSettings.md) as `invoiceProviders` (a list)

## Contains

- `capabilities`: [InvoiceCapabilities](./InvoiceCapabilities.md)
- `configuration`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
