# InvoiceAction

Create, finalize, void, apply payment to, or credit an invoice for an invoicing-enabled object. When a later action uses the result of create, bind `invoiceIdProperty` to `<contextName>.providerInvoiceId`. An unresolved id throws, and validation warns `INVOICE_ACTION_RESULT_UNKNOWN_FIELD` on a read of the nonexistent `id` field. An object without invoicing is refused as `INVOICING_NOT_CONFIGURED`.

See the [pattern reference](../../spec/InvoiceAction.md) and the [invoice and fiscalization chain guide](../capabilities/invoice-fiscalization-chain.md).
