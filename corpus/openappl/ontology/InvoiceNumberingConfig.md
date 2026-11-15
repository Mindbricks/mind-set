# InvoiceNumberingConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InvoiceNumberingConfig in Part 2](../spec/InvoiceNumberingConfig.md)

Invoice numbering configuration for an invoicing-enabled DataObject. Effective when the framework owns the sequence — always for the internal provider, and for any provider entry with capabilities.supportsNumbering=false; a provider that owns the legal number (e.g. stripe) ignores it. Numbers come from the atomic sys_invoiceSequence counter, keyed by (series, period). NUMBERING IS PER SERVICE (the twin of the fiscal series rule). sys_invoiceSequence is injected once per service and every generated service has its own database, so its (series, year) unique constrains nothing ACROSS services: two services numbering under one series each keep a private counter and both mint the same invoice number, with no vendor to refuse the duplicate and no burn-and-retry to recover it. Two services of one project numbering through the framework under the same series is therefore REFUSED at design time (INVOICE_SERIES_SHARED_ACROSS_SERVICES, ERROR). Give each invoicing service its own numbering.series.

## Contained in

- [InvoicingConfig](./InvoicingConfig.md) as `numbering`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
