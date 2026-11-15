# Invoicing

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [Invoicing in Part 2](../spec/Invoicing.md)

Provider-neutral accounts-receivable invoicing activation for a DataObject. Mark a DataObject as invoice-bearing by enabling `objectIsAnInvoiceObject` and (optionally) pointing `configuration.providerName` at a configured InvoiceProvider — when it is null, the framework-internal provider is the system of record (storage and lifecycle fully in the generated application; provider absence is not a special case but the `internal` adapter chosen implicitly). The framework generates the immutable invoice ledger (sys_<X>Invoice, sys_<X>InvoiceLine, sys_<X>CreditNote, sys_<X>InvoicePayment) and the issue/finalize/void/apply-payment surface around this object. The object itself stays the DOMAIN SURFACE: its schema is free, CRUD/UX/MScript live here, and it receives results through the PropRefer mirrors (statusProperty, ...) — it is never the financial record.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `invoicing`

Blueprint paths:

- `authentication.dataObjects.objectSettings.invoicing`
- `services.dataObjects.objectSettings.invoicing`

## Contains

- `configuration`: [InvoicingConfig](./InvoicingConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
