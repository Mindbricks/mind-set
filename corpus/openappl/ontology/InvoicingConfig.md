# InvoicingConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InvoicingConfig in Part 2](../spec/InvoicingConfig.md)

Configuration for provider-neutral accounts-receivable invoicing on a DataObject. Provider-binding is explicit via `providerName` (lookup into projectSettings.invoiceProvidersSettings.invoiceProviders[]); a null providerName binds the framework-internal provider. Property bindings (customer / amount / currency / due date / status) are PropRefer paths into the parent DataObject, same style as CheckoutConfig. The invoice flow is: draft (this object, freely editable) → finalize (line snapshot + number + FSM `open`) → payment allocation (sys_<X>InvoicePayment) → status mirrored back onto this object. Triggers are DECLARATIVE (`issuePolicy` / `issueCondition`) — the designer never writes imperative glue; `issuePolicy: manual` plus invoice actions is the imperative escape hatch.

## Contained in

- [Invoicing](./Invoicing.md) as `configuration`

## Contains

- `invoiceLineRelation`: [InvoiceLineRelation](./InvoiceLineRelation.md)
- `numbering`: [InvoiceNumberingConfig](./InvoiceNumberingConfig.md)
- `collection`: [InvoiceCollectionConfig](./InvoiceCollectionConfig.md)
- `lifecycleHooks`: [InvoiceLifecycleHook](./InvoiceLifecycleHook.md), a list

## References

- `sourceObjectName` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))
- `customerProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `amountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `vatRateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `vatExemptionCodeProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `vatExemptionReasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `currencyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `dueDateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `statusProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
