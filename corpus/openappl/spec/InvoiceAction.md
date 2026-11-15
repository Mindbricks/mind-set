# InvoiceAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [InvoiceAction in Part 1](../ontology/InvoiceAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Drives the accounts-receivable invoice lifecycle for an invoicing-enabled DataObject through the generated per-object InvoiceManager. `operation` picks the step: create (draft from the source row, line snapshot through invoiceLineRelation), finalize (number assignment, draft → open), void, or applyPayment (allocation + the partially_paid/paid transition). The PaymentAction family's invoicing twin (ADR-invoice-fiscalization §7.5) and the imperative escape hatch for `issuePolicy: manual` designs — the declarative issuePolicy triggers (onPaymentCaptured) run without any action. The framework-internal ledger and an external system of record are one code path; the effective provider binding is the owning DataObject's InvoicingConfig (providerName → the project's single declared provider → the implicit internal adapter). RESULT: `contextPropertyName` receives the provider's NORMALIZED result, not a sys_<X>Invoice row - create, finalize and void store a NormalizedInvoiceDetail (providerInvoiceId, invoiceNumber, series, statusLiteral, currency, subtotal, vatTotal, total, amountPaid, amountRemaining, dueDate, issuedAt, buyer, seller, lines, vatExemptionReasonCode, vatExemptionReason, metadata), applyPayment stores a NormalizedPaymentApplication (providerAllocationId, providerInvoiceId, amount, currency, appliedAt, paymentRef, invoiceStatus, amountPaid, amountRemaining, metadata). There is no `id`: the invoice id is `providerInvoiceId`, and the source row id travels on `metadata.sourceObjectId`. Chaining a create into a finalize: `{ name: cutInvoice, operation: create, contextPropertyName: inv }` then `{ name: finalizeIt, operation: finalize, invoiceIdProperty: inv.providerInvoiceId }`, scheduled in that order. A read of a member the result type does not declare (`this.inv.id`, `invoiceIdProperty: inv.id`) is reported as INVOICE_ACTION_RESULT_UNKNOWN_FIELD (WARNING). creditNote issues a NormalizedCreditNote (providerCreditNoteId, providerInvoiceId, amount, currency, reason, issuedAt, metadata) through CreditNoteManager, with optional idempotencyKeyProperty. For refunds reuse `refund-<providerRefundId>`. Credit notes do not create a new fiscal source or submit automatically.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `operation` | `InvoiceOperation` | no | `"create"` | `create`, `finalize`, `void`, `applyPayment`, `creditNote` |  | The invoice lifecycle operation to perform: create \| finalize \| void \| applyPayment \| creditNote. creditNote issues a credit adjustment; its result is NormalizedCreditNote. |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.invoiceProvidersSettings.invoiceProviders[].name — a design-time capability check. When null/omitted (the normal shape), the binding falls back to the owning DataObject's invoicing.configuration.providerName and ultimately the framework-internal provider. At RUNTIME the object's InvoiceManager always executes against the object-level binding; declaring a DIFFERENT provider here than the object resolves is a design error the validator reports. |
| `sourceIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=create: property holding the SOURCE row id the invoice is issued from (invoicing.configuration.sourceObjectName, or the invoicing object itself). When omitted, the api's own persisted row id is used. |
| `invoiceIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Required for finalize / void / applyPayment / creditNote: property holding the invoice id to operate on - the `providerInvoiceId` of a NormalizedInvoiceDetail (for the internal provider that IS the sys_<X>Invoice row id). Resolved params -> the api row -> the context, one dotted segment at a time, so an earlier create action's result is addressed as `<its contextPropertyName>.providerInvoiceId` (e.g. `inv.providerInvoiceId`). The create result has NO `id`: `inv.id` (or an addToContext `this.inv?.id`) resolves nothing and the action throws "invoiceIdProperty did not resolve an invoice id" at runtime, after the main write has committed; validation warns INVOICE_ACTION_RESULT_UNKNOWN_FIELD on that read. |
| `amountProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=applyPayment or creditNote: required property holding a positive amount in major units. |
| `paymentRefProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=applyPayment: optional property holding the payment reference (provider intent id, bank transfer reference, receipt no). |
| `reasonProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=void or creditNote: optional property holding the reason. |
| `idempotencyKeyProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=creditNote: optional property holding the complete idempotency key. For a refund-driven note bind `refund-<providerRefundId>`, the same key the automatic refund bridge uses. A replay returns the original note without another issuance hook. |

## Constraints

Property rules:

- `operation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `sourceIdProperty`, `invoiceIdProperty`, `amountProperty`, `paymentRefProperty`, `reasonProperty`, `idempotencyKeyProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INVOICE_ACTION_CREDIT_NOTES_UNSUPPORTED` | error | InvoiceAction creditNote requires a bound invoice provider with supportsCreditNotes. |
| `INVOICE_ACTION_MISSING_AMOUNT` | error | InvoiceAction with operation="…" requires amountProperty - an unbound amount reaches the adapter as NaN and is refused on every call. |
| `INVOICE_ACTION_MISSING_INVOICE_ID` | error | InvoiceAction with operation="…" requires invoiceIdProperty — without it the emitted action cannot address the invoice to operate on. |
| `INVOICE_ACTION_PROVIDER_MISMATCH` | error | InvoiceAction declares providerName "…", but its target object "…" resolves the invoicing binding "…" — the emitted action executes through the object's InvoiceManager, whose provider is baked from the OBJECT config, so … |
| `INVOICING_NOT_CONFIGURED` | error | Invoicing is not activated for InvoiceAction's target. |

## Example

Use inside a manual invoicing workflow — cut a draft from an order, finalize it with a legal number, record an out-of-band payment, or void a mis-issued document.

```json
{
  "name": "finalizeContractInvoice",
  "description": "Assign the legal number and open the invoice issued for this contract.",
  "operation": "finalize",
  "invoiceIdProperty": "invoiceId",
  "contextPropertyName": "invoice"
}
```
