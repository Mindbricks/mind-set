# InvoiceNumberingConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [InvoiceNumberingConfig in Part 1](../ontology/InvoiceNumberingConfig.md)

Invoice numbering configuration for an invoicing-enabled DataObject. Effective when the framework owns the sequence — always for the internal provider, and for any provider entry with capabilities.supportsNumbering=false; a provider that owns the legal number (e.g. stripe) ignores it. Numbers come from the atomic sys_invoiceSequence counter, keyed by (series, period). NUMBERING IS PER SERVICE (the twin of the fiscal series rule). sys_invoiceSequence is injected once per service and every generated service has its own database, so its (series, year) unique constrains nothing ACROSS services: two services numbering under one series each keep a private counter and both mint the same invoice number, with no vendor to refuse the duplicate and no burn-and-retry to recover it. Two services of one project numbering through the framework under the same series is therefore REFUSED at design time (INVOICE_SERIES_SHARED_ACROSS_SERVICES, ERROR). Give each invoicing service its own numbering.series.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `series` | `String` | no |  |  |  | Named series key the sequence counter is scoped by (e.g. 'A'). Multiple invoicing objects OF THE SAME SERVICE may share a series - they share one counter row in one database, which is correct. Two SERVICES may never share one: sys_invoiceSequence is per service and per database, so a shared series means two private counters minting the same number, and validation refuses it (INVOICE_SERIES_SHARED_ACROSS_SERVICES). Leaving series unset does NOT avoid this - the emitted allocator falls back to the constant 'INV', so two services that both omit it collide without anyone having configured anything shared. Within one service, sharing stays fine; jurisdictional series formats are applied by the fiscal policy layer, not here. |
| `prefix` | `String` | no |  |  |  | Literal prefix prepended to the formatted number on the rendered invoice (e.g. 'INV-'). |
| `resetPeriod` | `InvoiceNumberingResetPeriod` | no | `"never"` | `never`, `yearly`, `monthly` |  | When the sequence counter resets: never (default), yearly, or monthly. Jurisdictions whose number format embeds the year typically reset yearly. |

## Constraints

Property rules:

- `resetPeriod` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
