# InvoiceProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [InvoiceProvidersSettings in Part 2](../spec/InvoiceProvidersSettings.md)

Container for invoice provider configurations — the backends that issue, number, finalize and collect legal/commercial invoices for the project's invoicing-enabled data objects. Each entry is a named provider that can be referenced by DataObject `invoicing` opt-ins (`invoicing.configuration.providerName`) and, in later slices, by invoice-related business-API actions. Invoicing is a SEPARATE axis from payment: a PaymentProvider moves money, an InvoiceProvider produces the billing document — one object can bind checkout to Stripe payments and invoicing to a local ERP at the same time. The generator emits INVOICE_PROVIDER_<NAME>_* environment variables per NATIVE provider so service code can construct an adapter at runtime; BRIDGE brands (sap, dynamics365, netsuite, logoTiger) carry no credentials of their own — they name an `enterpriseIntegrationsSettings` entry via `integrationName` and reach the platform through the mcpbff bridge. Mirrors the paymentProvidersSettings / aiProvidersSettings shape — a named array; multiple entries can share the same provider type (e.g. two Parasut companies, or one internal series for drafts + one stripe for customer-facing invoices).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `invoiceProvidersSettings`

Blueprint paths:

- `projectSettings.invoiceProvidersSettings`

## Contains

- `invoiceProviders`: [InvoiceProvider](./InvoiceProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
