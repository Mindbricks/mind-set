# PayoutGateConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [PayoutGateConfig in Part 2](../spec/PayoutGateConfig.md)

Invoice-gated payout release (the TR marketplace MERCHANT model's mutabakat step). The platform invoices the end customer in its own name (outbound fiscalization); the SHOP invoices the PLATFORM for its receivable; the payout to the shop is conditional on that incoming invoice arriving and matching the computed amount. The generated payout gate consults this block before ANY release: PayoutManager.createPayout parks a gated payout as `held` instead of touching the provider, the payout-scheduler re-evaluates held rows each tick and fires released ones through the unchanged payout path, and the fiscal-inbound-cron supplies the inbound ledger the matching rule reads. The matching rule (fixed, declarative): the inbound invoice's issuer tax id must equal the connected account's tax id binding (the `taxId` column or `metadata.taxId` on sys_<X>ConnectedAccount); when the payout carries a transferGroup and an invoice references it (note or document number), that invoice is judged alone; currency must agree; |invoice total − payout amount| must be within `matchTolerance`. A payout held by the gate carries a typed reason (awaiting_inbound_invoice / seller_tax_id_unbound / amount_mismatch / currency_mismatch) on its row metadata and is visible on the payout list surfaces filtered by status=held.

## Contained in

- [MarketplaceConfig](./MarketplaceConfig.md) as `payoutGate`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
