# FiscalProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [FiscalProvidersSettings in Part 1](../ontology/FiscalProvidersSettings.md)

Container for fiscal provider configurations - the integrators that submit documents into a government's fiscal infrastructure (e-invoice, e-archive, real-time reporting). They serve the project's fiscalization-enabled data objects: each entry is a named provider that can be referenced by DataObject `fiscalization` opt-ins (`fiscalization.configuration.fiscalProviderName`). Fiscalization is a SEPARATE axis from both payment and invoicing: a PaymentProvider moves money, an InvoiceProvider produces the commercial billing document, and a FiscalProvider is the regulatory transport - one object can bind checkout to Stripe, invoicing to a local ERP and fiscalization to a Turkish special integrator at the same time. There is NO internal brand: fiscalization always goes through an integrator or the credential-free `mock` adapter, and a null `fiscalProviderName` binds implicitly ONLY when exactly one entry is declared. Every brand is NATIVE - fiscal integrators are SaaS APIs, so there is no bridge family and no `integrationName` on an entry - and the generator emits FISCAL_PROVIDER_<NAME>_* environment variables per provider so service code can construct an adapter at runtime. Mirrors the invoiceProvidersSettings shape - a named array; multiple entries can share the same provider type (e.g. two Foriba accounts for two seller companies).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fiscalProviders` | [`FiscalProvider`](./FiscalProvider.md)[] | no |  |  |  | List of configured fiscal providers. Add one entry per fiscalization backend / account the project can submit documents through. Multiple entries can share the same provider type (e.g. two Foriba accounts for two seller companies). Unlike invoice providers there is NO built-in internal brand: fiscalization always talks to a government fiscal infrastructure through an integrator (or the mock adapter in non-production environments), so a data object's `fiscalProviderName` binds implicitly only when exactly one entry is declared. |

## Constraints

Property rules:

- The items of `fiscalProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
