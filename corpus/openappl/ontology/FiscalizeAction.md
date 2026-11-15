# FiscalizeAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FiscalizeAction in Part 2](../spec/FiscalizeAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Drives the regulatory fiscalization lifecycle for a fiscalization-enabled DataObject through the generated per-object FiscalizationManager. `operation` picks the step: submit (serialize the finalized invoice snapshot and submit it through the jurisdiction policy pipeline), cancel (the network's cancellation flow for an accepted document), or queryStatus (a one-shot provider poll dispatched through the same event path the status cron uses). The InvoiceAction family's fiscal twin (ADR-invoice-fiscalization sec. 7.5) and the imperative escape hatch for `submitPolicy: manual` designs - the declarative submitPolicy trigger (onInvoiceFinalized) runs without any action. The effective provider binding is the owning DataObject's FiscalizationConfig (fiscalProviderName -> the project's single declared fiscal provider); there is NO framework-internal fiscal provider. resubmit retries a rejected or failed fiscal document through the existing correction pipeline using fiscalDocumentIdProperty; the operator route remains available.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fiscalizeActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fiscalizeActions`
- `services.businessLogic.actions.fiscalizeActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `sourceIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `fiscalDocumentIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `reasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
