# FiscalProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [FiscalProvidersSettings in Part 2](../spec/FiscalProvidersSettings.md)

Container for fiscal provider configurations - the integrators that submit documents into a government's fiscal infrastructure (e-invoice, e-archive, real-time reporting). They serve the project's fiscalization-enabled data objects: each entry is a named provider that can be referenced by DataObject `fiscalization` opt-ins (`fiscalization.configuration.fiscalProviderName`). Fiscalization is a SEPARATE axis from both payment and invoicing: a PaymentProvider moves money, an InvoiceProvider produces the commercial billing document, and a FiscalProvider is the regulatory transport - one object can bind checkout to Stripe, invoicing to a local ERP and fiscalization to a Turkish special integrator at the same time. There is NO internal brand: fiscalization always goes through an integrator or the credential-free `mock` adapter, and a null `fiscalProviderName` binds implicitly ONLY when exactly one entry is declared. Every brand is NATIVE - fiscal integrators are SaaS APIs, so there is no bridge family and no `integrationName` on an entry - and the generator emits FISCAL_PROVIDER_<NAME>_* environment variables per provider so service code can construct an adapter at runtime. Mirrors the invoiceProvidersSettings shape - a named array; multiple entries can share the same provider type (e.g. two Foriba accounts for two seller companies).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `fiscalProvidersSettings`

Blueprint paths:

- `projectSettings.fiscalProvidersSettings`

## Contains

- `fiscalProviders`: [FiscalProvider](./FiscalProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
