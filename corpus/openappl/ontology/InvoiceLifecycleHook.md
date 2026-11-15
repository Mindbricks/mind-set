# InvoiceLifecycleHook

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InvoiceLifecycleHook in Part 2](../spec/InvoiceLifecycleHook.md)

A designer-authored MScript handler fired by the invoice dispatcher when the invoice state machine advances. Mirrors the payment LifecycleHook shape (name / trigger / condition / script) but carries its OWN trigger vocabulary — the payment PaymentLifecycleTrigger enum is reconciled 1:1 with the payment lifecycle machines and deliberately stays untouched by the invoice family. Hooks run after the FSM transition is persisted; a failure inside a hook does not roll back the transition. The hook context is the NORMALIZED document, not a ledger row: `invoice` is a NormalizedInvoiceDetail on every trigger, `allocation` (NormalizedPaymentApplication) and `creditNote` (NormalizedCreditNote) are set only on their own triggers - see `script` for every field and for where the source row id lives. A member read those shapes do not carry is reported at design time (INVOICE_LIFECYCLE_HOOK_UNKNOWN_FIELD_SILENT, WARNING), as is a read on a root the trigger never supplies (INVOICE_LIFECYCLE_HOOK_ROOT_NULL_ON_TRIGGER, WARNING).

## Contained in

- [InvoicingConfig](./InvoicingConfig.md) as `lifecycleHooks` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
