# InvoiceProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [InvoiceProvidersSettings in Part 1](../ontology/InvoiceProvidersSettings.md)

Container for invoice provider configurations — the backends that issue, number, finalize and collect legal/commercial invoices for the project's invoicing-enabled data objects. Each entry is a named provider that can be referenced by DataObject `invoicing` opt-ins (`invoicing.configuration.providerName`) and, in later slices, by invoice-related business-API actions. Invoicing is a SEPARATE axis from payment: a PaymentProvider moves money, an InvoiceProvider produces the billing document — one object can bind checkout to Stripe payments and invoicing to a local ERP at the same time. The generator emits INVOICE_PROVIDER_<NAME>_* environment variables per NATIVE provider so service code can construct an adapter at runtime; BRIDGE brands (sap, dynamics365, netsuite, logoTiger) carry no credentials of their own — they name an `enterpriseIntegrationsSettings` entry via `integrationName` and reach the platform through the mcpbff bridge. Mirrors the paymentProvidersSettings / aiProvidersSettings shape — a named array; multiple entries can share the same provider type (e.g. two Parasut companies, or one internal series for drafts + one stripe for customer-facing invoices).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `invoiceProviders` | [`InvoiceProvider`](./InvoiceProvider.md)[] | no |  |  |  | List of configured invoice providers. Add one entry per invoicing backend / account you want available. Multiple entries can share the same provider type (e.g. two logoIsbasi firms, or an internal series next to a stripe account). The built-in `internal` brand needs no credentials — declare it when you want a named internal series, or simply leave a data object's `providerName` null to bind the framework-native invoicing implicitly. |

## Constraints

Property rules:

- The items of `invoiceProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
