# Provider catalog: invoiceProvider

Entries of this family are written with [`InvoiceProvider`](../InvoiceProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

**Behaviour rules:** what every compiler must do for this family beyond the keys (webhook signatures, field rules, documented quirks) is in [invoiceProvider behaviour](../../guides/providers/invoice.md).

NATIVE brands only. Bridge brands (sap, dynamics365, netsuite, logoTiger) deliberately have NO entry here — their credentials live ONCE on the enterpriseIntegration entry named by the provider's integrationName (ENTERPRISE_<NAME>_*), and the InvoiceProvider validator resolves that reference instead of reading configuration keys.

## Environment names

| Prefix | Key style |
|---|---|
| `INVOICE_PROVIDER` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`internal`](#internal) | 0 | 0 | 0 |
| [`stripe`](#stripe) | 2 | 2 | 2 |
| [`logoIsbasi`](#logoisbasi) | 3 | 3 | 1 |
| [`mikro`](#mikro) | 3 | 2 | 1 |
| [`parasut`](#parasut) | 5 | 3 | 3 |
| [`custom`](#custom) | 2 | 1 | 1 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | invoice |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live"] |
| `mockCredentialMode` | refused |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |

## Brand status

Per-brand SHIPPED STATE + transport, for the settings UI and any agent that offers the brand roster. `status` is the machine-readable field: `shipped` = a framework adapter exists today; `roadmap` = the enum and this catalog accept the brand but NO adapter has shipped, so binding it is a typed 501 at runtime and the UI should mark it roadmap rather than offering an uncompletable form; `bringYourOwn` = the escape hatch, the project registers its own adapter. `transport` repeats the ADR sec. 3.5 split (native carries its own credentials here, bridge names an enterpriseIntegrations[] entry). `platforms` is present ONLY on bridge brands and is the SINGLE SOURCE OF TRUTH for the brand -> EnterprisePlatformType pairing the InvoiceProvider validator enforces: an empty array means no platform connector exists yet, so the brand cannot be completed at all.

| Entry | status | transport | phase | note | platforms |
|---|---|---|---|---|---|
| `internal` | shipped | native | Faz 1b | Framework-native invoicing - issues, numbers and stores invoices itself, no credentials. |  |
| `stripe` | shipped | native | Faz 2 | Stripe Invoicing as an external system of record, mirrored into the local ledger. |  |
| `logoIsbasi` | roadmap | native | Faz 3.5 - TR cloud accounting adapters | Catalogued credential keys are final; the adapter has not shipped. |  |
| `mikro` | roadmap | native | Faz 3.5 - TR cloud accounting adapters | The CLOUD product. An on-prem Mikro lands as a bridge brand when a Mikro connector reaches EnterprisePlatformType. |  |
| `parasut` | roadmap | native | Faz 3.5 - TR cloud accounting adapters | Catalogued credential keys are final; the adapter has not shipped. |  |
| `custom` | bringYourOwn | native | n/a | The escape hatch: the project registers its own adapter factory for this brand, so the framework ships none on purpose. |  |
| `sap` | roadmap | bridge | Faz 4+ - bridge brands, a semantic layer on the EnterpriseBridge seams (ADR sec. 9) | One invoice brand, two SAP Gateway platforms - the named enterprise integration decides which. | ["sapS4Hana","sapEcc"] |
| `dynamics365` | roadmap | bridge | Faz 4+ - bridge brands, a semantic layer on the EnterpriseBridge seams (ADR sec. 9) | Pairs one-to-one with the dynamics365 enterprise platform. | ["dynamics365"] |
| `netsuite` | roadmap | bridge | Faz 4+ - bridge brands, a semantic layer on the EnterpriseBridge seams (ADR sec. 9) | Pairs one-to-one with the netsuite enterprise platform, itself an anticipated brand whose connector has not shipped. | ["netsuite"] |
| `logoTiger` | roadmap | bridge | Faz 4+ - a Logo connector must reach EnterprisePlatformType first | NO EnterprisePlatformType value exists for Logo yet, so no integrationName can ever satisfy this brand. Use logoIsbasi (native, Logo cloud) when its adapter lands, or keep the accounting system of record local. | [] |

## Webhook provisioning

Per-brand WEBHOOK PROVISIONING origin, same vocabulary as the paymentProvider block. The invoice family has its own stripe adapter with its own webhookSecret, so it carries the same fact and the same follow-up. UNLIKE the payment family (whose stripe webhookSecret key was removed from this catalog when the provisioning sweep shipped), this family's stripe brand still catalogues `webhookSecret` as an authored, requiredFor:'webhook' key — its adapter implements no capture yet (`shipped: false`), so a human still supplies the secret until the follow-up lands.

| Entry | provisioning | shipped | verifiesWith | note |
|---|---|---|---|---|
| `stripe` | api-returns-secret | false | webhookSecret | Same Stripe API and the same create-response-only secret as the payment family, but invoice-providers/stripe.ts implements no endpoint-creation call and its advisory still sends the operator to the dashboard. The webhook-provisioning follow-up for this family. |

## internal

This brand takes no configuration keys.

## stripe

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `secretKey` | string | yes | yes |  |  |  | Stripe secret key (sk_...). A SEPARATE entry from any paymentProvider stripe account — invoice env vars are emitted under INVOICE_PROVIDER_<NAME>_*, never shared. |
| `webhookSecret` | string | yes | yes |  |  | required for webhook | Stripe webhook signing secret (whsec_...). Required to VERIFY inbound invoice webhooks, not to construct the adapter — it is registered through the webhook API after deploy, so a project without it still creates, finalizes and reads invoices against the real Stripe account. |

## logoIsbasi

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Logo Isbasi API client id. |
| `clientSecret` | string | yes | yes |  |  |  | Logo Isbasi API client secret. |
| `firmId` | string |  | yes |  |  |  | Logo Isbasi firm id the invoices are issued under. |

## mikro

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | Mikro API base URL. |
| `apiKey` | string | yes | yes |  |  |  | Mikro API key. |
| `companyCode` | string |  |  |  |  |  | Optional company code for multi-company Mikro accounts. |

## parasut

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Parasut OAuth2 client id. |
| `clientSecret` | string | yes | yes |  |  |  | Parasut OAuth2 client secret. |
| `companyId` | string |  | yes |  |  |  | Parasut company id the invoices are issued under. |
| `username` | string | yes |  |  |  |  | Parasut account username — only for the OAuth2 password grant. |
| `password` | string | yes |  |  |  |  | Parasut account password — only for the OAuth2 password grant. |

## custom

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | Custom invoicing service base URL. |
| `apiKey` | string | yes |  |  |  |  | Optional API key. |
