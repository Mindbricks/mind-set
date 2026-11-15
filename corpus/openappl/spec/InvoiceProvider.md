# InvoiceProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [InvoiceProvider in Part 1](../ontology/InvoiceProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [invoiceProvider](./providers/invoiceProvider.md).

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

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from DataObject `invoicing` opt-ins and as the env-var prefix. Must be a valid codeName. |
| `provider` | `InvoiceProviderType` | no | `"internal"` | 10 values, see [InvoiceProviderType](#invoiceprovidertype) |  | The backend provider implementation. Selects which keys are expected in `configuration` (native brands), or that the entry is a BRIDGE onto an enterprise integration (sap, dynamics365, netsuite, logoTiger — these require `integrationName` and take no configuration keys). Defaults to `internal`, the framework-native invoicing that needs no credentials at all. A bridge brand also pins WHICH enterprise platform the named integration may run on (sap accepts sapS4Hana or sapEcc; dynamics365 and netsuite pair one-to-one; logoTiger has no platform yet and cannot be completed at all). Brands differ in shipped state: internal and stripe have adapters today, every other brand except the bring-your-own `custom` is declarable-but-unshipped and answers a typed 501 when bound - read the `brandStatus` block of the provider config catalog for the machine-readable state. |
| `integrationName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | BRIDGE brands only (sap, dynamics365, netsuite, logoTiger): the name of the `projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[]` entry whose platform this provider issues invoices on. The mcpbff bridge owns the connectivity and the credentials — this entry adds none of its own. MUST be null for native brands (internal, stripe, logoIsbasi, mikro, parasut, custom), whose credentials live in `configuration` here. |
| `capabilities` | [`InvoiceCapabilities`](./InvoiceCapabilities.md) | no |  |  |  | Per-entry capability flags. Defaults are derived from `provider` at codegen time so designers don't fill them; advanced users can narrow them per-entry (e.g. disable collection on a stripe entry used only for record-keeping invoices). Designers should leave this null unless intentionally restricting features the provider would otherwise support. |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of provider-specific credentials and settings — NATIVE brands only. The required keys depend on `provider` — see the InvoiceProvider doc string for the per-provider key list. The UI enforces the right form fields per provider; agents emit only keys that match. Bridge brands (sap, dynamics365, netsuite, logoTiger) take no keys here — their credentials live on the named enterprise integration. Sensitive keys (secretKey, clientSecret, apiKey, password, webhookSecret) are masked in API responses and emitted to environment variables at codegen time. |

## Allowed values

### InvoiceProviderType

`internal`, `stripe`, `sap`, `dynamics365`, `netsuite`, `logoTiger`, `logoIsbasi`, `mikro`, `parasut`, `custom`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name`, `integrationName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNIQUE_INVOICE_PROVIDER_NAME` | error | Invoice provider name "…" is used by … entries in projectSettings.invoiceProvidersSettings.invoiceProviders[]. |
