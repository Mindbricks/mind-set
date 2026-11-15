# FiscalLifecycleHook

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [FiscalLifecycleHook in Part 2](../spec/FiscalLifecycleHook.md)

A designer-authored MScript handler fired by the fiscal dispatcher when the fiscal document state machine advances. Mirrors the InvoiceLifecycleHook shape (name / trigger / condition / script) but carries its OWN trigger vocabulary — the payment PaymentLifecycleTrigger enum is reconciled 1:1 with the payment lifecycle machines and the invoice family's InvoiceLifecycleTrigger is invoice-only; both deliberately stay untouched. Hooks run after the FSM transition is persisted; a failure inside a hook does not roll back the transition. The runtime dispatcher, the normalized resource surface and the per-trigger resource-field checks ship with the fiscal runtime slice.

## Contained in

- [FiscalizationConfig](./FiscalizationConfig.md) as `lifecycleHooks` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
