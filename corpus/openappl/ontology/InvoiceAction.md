# InvoiceAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [InvoiceAction in Part 2](../spec/InvoiceAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Drives the accounts-receivable invoice lifecycle for an invoicing-enabled DataObject through the generated per-object InvoiceManager. `operation` picks the step: create (draft from the source row, line snapshot through invoiceLineRelation), finalize (number assignment, draft → open), void, or applyPayment (allocation + the partially_paid/paid transition). The PaymentAction family's invoicing twin (ADR-invoice-fiscalization §7.5) and the imperative escape hatch for `issuePolicy: manual` designs — the declarative issuePolicy triggers (onPaymentCaptured) run without any action. The framework-internal ledger and an external system of record are one code path; the effective provider binding is the owning DataObject's InvoicingConfig (providerName → the project's single declared provider → the implicit internal adapter). RESULT: `contextPropertyName` receives the provider's NORMALIZED result, not a sys_<X>Invoice row - create, finalize and void store a NormalizedInvoiceDetail (providerInvoiceId, invoiceNumber, series, statusLiteral, currency, subtotal, vatTotal, total, amountPaid, amountRemaining, dueDate, issuedAt, buyer, seller, lines, vatExemptionReasonCode, vatExemptionReason, metadata), applyPayment stores a NormalizedPaymentApplication (providerAllocationId, providerInvoiceId, amount, currency, appliedAt, paymentRef, invoiceStatus, amountPaid, amountRemaining, metadata). There is no `id`: the invoice id is `providerInvoiceId`, and the source row id travels on `metadata.sourceObjectId`. Chaining a create into a finalize: `{ name: cutInvoice, operation: create, contextPropertyName: inv }` then `{ name: finalizeIt, operation: finalize, invoiceIdProperty: inv.providerInvoiceId }`, scheduled in that order. A read of a member the result type does not declare (`this.inv.id`, `invoiceIdProperty: inv.id`) is reported as INVOICE_ACTION_RESULT_UNKNOWN_FIELD (WARNING). creditNote issues a NormalizedCreditNote (providerCreditNoteId, providerInvoiceId, amount, currency, reason, issuedAt, metadata) through CreditNoteManager, with optional idempotencyKeyProperty. For refunds reuse `refund-<providerRefundId>`. Credit notes do not create a new fiscal source or submit automatically.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `invoiceActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.invoiceActions`
- `services.businessLogic.actions.invoiceActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `sourceIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `invoiceIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `amountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `paymentRefProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `reasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `idempotencyKeyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
