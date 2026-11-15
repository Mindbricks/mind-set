# SettlementGateConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [SettlementGateConfig in Part 1](../ontology/SettlementGateConfig.md)

Invoice gate on the approve step of platformSettled settlement instructions (MarketplaceConfig.settlementGate). The platform approves a payment instruction to a seller only against the seller's matching incoming invoice. Same shape and matching rule as PayoutGateConfig, consulted on POST /v1/payments/settlement/instructions/:id/approve instead of on a PSP payout.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `requiresIncomingInvoice` | `Boolean` | no |  |  |  | The gate switch. True = an instruction is approved only after a matching inbound fiscal invoice from its seller arrives; absent/false = the block is inert and the emitted instruction machine is byte-identical to an ungated project. |
| `matchTolerance` | `Double` | no |  |  |  | Absolute amount tolerance (major units) for the invoice-total vs instruction-amount comparison. Null takes the framework default (0.01, the float-noise floor). Must be >= 0. |
| `onMismatch` | `PayoutMismatchAction` | no |  | `hold`, `notify` |  | What happens when an inbound invoice FROM THE RIGHT SELLER is present but mismatches (amount outside tolerance, or currency differs). `hold` (the default when null): approve stays refused with the typed mismatch reason. `notify`: the mismatch is logged and recorded on the instruction's metadata.settlementGate, the approve succeeds without consuming the invoice and invoiceRef stays operator-filled. A missing invoice ALWAYS refuses the approve. |

## Constraints

Property rules:

- `onMismatch` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
