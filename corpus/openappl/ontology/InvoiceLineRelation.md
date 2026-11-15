# InvoiceLineRelation

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InvoiceLineRelation in Part 2](../spec/InvoiceLineRelation.md)

How an invoicing-enabled object relates to its line item object (provider-neutral sibling of StripeOrderItemRelation). The line item object is the EDITABLE SOURCE of invoice lines; at finalize time the bound fields are snapshotted into the immutable sys_<X>InvoiceLine ledger. The per-line bindings align with the line fields the shopping-cart pricing settings produce (quantity, unitPrice, lineTotal, discountAmount, vatRate, vatAmount, finalTotal), so a cart's tax breakdown flows into the invoice losslessly. Only quantity/unitPrice/description are commonly needed — the tax-breakdown bindings are for lines that already carry computed VAT.

## Contained in

- [InvoicingConfig](./InvoicingConfig.md) as `invoiceLineRelation`

## Contains

No other pattern: every property is a value or a reference.

## References

- `lineItemObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))
- `invoiceForeignKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `lineItemLocalKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `quantityProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `unitPriceProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `descriptionProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `lineTotalProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `discountAmountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `discountReasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `vatRateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `vatExemptionCodeProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `vatExemptionReasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `vatAmountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)
- `finalTotalProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `lineItemObject`)

## Referenced by

No property of another pattern names this pattern.
