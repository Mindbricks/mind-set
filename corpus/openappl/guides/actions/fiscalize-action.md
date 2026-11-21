# FiscalizeAction

Submit a finalized invoice snapshot, cancel a fiscal document, query its status or resubmit it. Submit can take the current persisted row as its source. The other operations need `fiscalDocumentIdProperty`. Validation rejects an object without fiscalization (`FISCALIZATION_NOT_CONFIGURED`) or an action that names a different provider from its owning object.

See the [pattern reference](../../spec/FiscalizeAction.md) and the [invoice and fiscalization chain guide](../capabilities/invoice-fiscalization-chain.md).
