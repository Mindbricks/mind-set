# InvoiceCollectionConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InvoiceCollectionConfig in Part 2](../spec/InvoiceCollectionConfig.md)

How finalized invoices on an invoicing-enabled DataObject are collected. `sendInvoice` (the default) issues the invoice to the customer and waits for payment within daysUntilDue; `chargeAutomatically` charges a stored payment method at finalize time and requires the bound InvoiceProvider to have capabilities.supportsCollection=true (in practice: stripe). With external accounting providers, collection typically stays on the PaymentProvider side and this block keeps its sendInvoice default.

## Contained in

- [InvoicingConfig](./InvoicingConfig.md) as `collection`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
