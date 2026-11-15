# PayoutGateConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [PayoutGateConfig in Part 1](../ontology/PayoutGateConfig.md)

Invoice-gated payout release (the TR marketplace MERCHANT model's mutabakat step). The platform invoices the end customer in its own name (outbound fiscalization); the SHOP invoices the PLATFORM for its receivable; the payout to the shop is conditional on that incoming invoice arriving and matching the computed amount. The generated payout gate consults this block before ANY release: PayoutManager.createPayout parks a gated payout as `held` instead of touching the provider, the payout-scheduler re-evaluates held rows each tick and fires released ones through the unchanged payout path, and the fiscal-inbound-cron supplies the inbound ledger the matching rule reads. The matching rule (fixed, declarative): the inbound invoice's issuer tax id must equal the connected account's tax id binding (the `taxId` column or `metadata.taxId` on sys_<X>ConnectedAccount); when the payout carries a transferGroup and an invoice references it (note or document number), that invoice is judged alone; currency must agree; |invoice total − payout amount| must be within `matchTolerance`. A payout held by the gate carries a typed reason (awaiting_inbound_invoice / seller_tax_id_unbound / amount_mismatch / currency_mismatch) on its row metadata and is visible on the payout list surfaces filtered by status=held.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `requiresIncomingInvoice` | `Boolean` | no |  |  |  | The gate switch. True = a payout to a connected seller is released only after a matching inbound fiscal invoice from that seller arrives; absent/false = the block is inert and emitted payout code is byte-identical to an ungated project. The gate is consulted only where the owner's PayoutManager books the payout (on_demand / scheduled cadence): a PayoutAction on an owner whose provider resolves to a provider_driven cadence (the stripe / iyzico / adyen default when payoutCadence.mode is not set) pays synchronously and never consults it, so that design is a validation ERROR (PAYOUT_ACTION_PROVIDER_DRIVEN_RESERVE_OR_GATE) - set the provider's payoutCadence.mode to scheduled (or on_demand) or switch the gate off. |
| `matchTolerance` | `Double` | no |  |  |  | Absolute amount tolerance (major units) for the invoice-total vs payout-amount comparison. Null takes the framework default (0.01 — the float-noise floor). Turkey rounds line VAT per line, so a small tolerance absorbs legitimate kurus-level drift; a larger one is a business decision, not a rounding aid. |
| `onMismatch` | `PayoutMismatchAction` | no |  | `hold`, `notify` |  | What happens when an inbound invoice FROM THE RIGHT SELLER is present but mismatches (amount outside tolerance, or currency differs). `hold` (the default when null): the payout stays held with the typed mismatch reason until the operator resolves it. `notify`: the mismatch fires the afterPayoutHeld lifecycle hook and is logged, but the payout releases anyway — for platforms that reconcile out-of-band and refuse to block seller cash flow. A missing invoice ALWAYS holds regardless of this setting — that is what requiresIncomingInvoice means. |

## Constraints

Property rules:

- `onMismatch` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
