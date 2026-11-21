---
title: PayoutAction
---

# PayoutAction

`PayoutAction` triggers a marketplace payout to a connected sub-merchant account via the bound `PaymentProvider`. It is the platform's way of moving funds out to sellers / vendors / creators after a marketplace settlement window has closed.

`BusinessApiActionStore` carries a dedicated `payoutActions[]` slot, `PayoutAction` is a first-class action type, not a payment-subsystem-only construct.

## When to use it

- Disburse a settled balance to a connected sub-merchant after a payout cadence rolls.
- Issue an ad-hoc payout for a specific transfer group (provider-side reporting).
- Trigger a manual payout from an admin business API.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` |   | Lookup key into `projectSettings.paymentProvidersSettings.paymentProviders[].name`. When omitted, the runtime reads `providerName` from the parent data object's `MarketplaceConfig`. |
| `connectedAccountProperty` | `PropRefer` | ✓ | Property holding the connected sub-merchant account id. Resolved at runtime against the request context. |
| `amountProperty` | `PropRefer` | ✓ | Property holding the payout amount (in the smallest currency unit, per the provider's convention). |
| `currencyProperty` | `PropRefer` |   | Property holding the currency code. When omitted, the runtime falls back to the parent data object's `marketplace.configuration.currencyProperty`, and then to the parent [`CheckoutConfig`](../../spec/CheckoutConfig.md)'s `currencyStaticValue`. If none of the three resolves, the action throws. |
| `transferGroupProperty` | `PropRefer` |   | Optional property holding a transfer-group identifier for provider-side reporting (Stripe). |
| `metadataProperty` | `PropRefer` |   | Optional property (or context value) holding an OBJECT sent as the payout's `metadata`, e.g. iyzico `{ "paymentId": ... }` or `{ "paymentId": ..., "paymentTransactionIds": [...] }` (named transaction ids travel with the paymentId of their charge). A value that is not a plain object is ignored. |
| `scheduledForProperty` | `PropRefer` |   | Optional property holding the date-time the payout is scheduled for (`scheduledFor`). A booked row is not sent before it. |
| `sourceOrderProperty` | `PropRefer` |   | Optional property holding the id of the marketplace SALE this payout settles, sent as `metadata.orderId`. On an owner that declares [`settlementRelease`](../../spec/SettlementReleaseConfig.md) the payout releases the row the runtime booked for that sale at capture (with the provider item ids stored on it) instead of booking a second payout; a sale with no booked row is refused `409 SETTLEMENT_RELEASE_NOT_BOOKED`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The bound provider must declare `capabilities.supportsMarketplace = true`. The action checks it before any payout is booked or sent.

At runtime the action:

1. Resolves `providerName` from the action config or, when omitted, from the parent DataObject's `marketplace.providerName`.
2. Looks up the bound `PaymentProvider` and guards `supportsMarketplace`.
3. Resolves `connectedAccountProperty`, `amountProperty`, optional `currencyProperty`, optional `transferGroupProperty` and the optional `metadataProperty` / `scheduledForProperty` / `sourceOrderProperty` (each used only when declared) against, in order, the loop item (inside a [`LoopAction`](./loop-action.md)), the request parameters, the persisted parent row, then the manager scope. Dotted paths (`"settlement.amount"`) are walked one segment at a time, so a missing intermediate segment falls through instead of raising. With no `currencyProperty` on the action, the currency comes from the parent data object's `marketplace.configuration.currencyProperty` (resolved through the same chain), then from the parent checkout block's `currencyStaticValue`.
4. Books the payout through the marketplace owner's payment-layer payout manager (it books the payout), the same contract as the `POST /v1/payments/payouts` route: the bound provider's `payoutCadence` decides whether the payout is sent now (`on_demand`) or booked for the payout scheduler (`scheduled`, or any `reserveDays` above 0, the row is stamped `availableForPayoutAt` and nothing is sent before it), a blank destination is refused, an invoice-gated owner (`payoutGate`) holds a payout with no matching inbound invoice, a sent row is stamped `dispatchedAt`, and in a multi-tenant service the row is filed under the connected account's (else the caller's) tenant; a destination that is a connected account of ANOTHER tenant (archived ones included) is refused `404 NOT_FOUND` before any row is written or any provider is called. An `on_demand` send writes its `sys_<X>Payout` row as `attempting` BEFORE the provider call and sends it with that row's `payout-<row id>` idempotency key; a definite provider refusal leaves the row `failed`, and an ambiguous failure (timeout, transport error, 5xx, an answer without a real payout id) leaves it `outcome_unknown` and answers `502 PAYOUT_OUTCOME_UNKNOWN` naming the row, which is never re-sent automatically. On a `provider_driven` cadence (the Stripe / iyzico / Adyen default when the provider's `payoutCadence.mode` is not set), where that route refuses with `409`, the action instead sends the payout to the provider directly and writes the `sys_<X>Payout` row stamped as sent (`dispatchedAt`, `availableForPayoutAt`) and, in a multi-tenant service, filed under the same tenant anchor (resolved before the provider is called); that row, too, is journalled `attempting` before the call and keyed `payout-<row id>`, with the same `failed` / `outcome_unknown` outcomes. That arm sends the payout at once: it applies no `reserveDays` and does not consult a `payoutGate`. So a PayoutAction whose owner's provider resolves to `provider_driven` while `payoutCadence.reserveDays` is above 0 or `payoutGate.requiresIncomingInvoice` is on is refused at design time with the ERROR `PAYOUT_ACTION_PROVIDER_DRIVEN_RESERVE_OR_GATE`, on validate and on build, for every project. Fix it by setting an explicit scheduled cadence on that provider (`payoutCadence.mode: "scheduled"` with a `schedule`; `on_demand` also books through the manager), or by removing the reserve (`reserveDays: 0`) or the gate. The provider the check reads is the one the owner's marketplace block is bound to (its `providerName`, else the provider of the owner's `checkout` block, else the single configured provider), not the action's own `providerName`. On a `platformSettled` owner there is no PSP payout at all: the action is refused with that route's `409`, whatever the cadence. With no marketplace object in the service at all there is no ledger: the action falls back to sending the payout with nothing persisted, and the validator warns `PAYOUT_ACTION_NO_PAYOUT_MODEL`.
5. Returns the persisted `sys_<X>Payout` row (its local `id`, `statusLiteral` `scheduled` / `held` when booked, `availableForPayoutAt`, `dispatchedAt`) merged over the normalized payout (`NormalizedPayout`, provider id, status, amount, currency, `destinationAccountId`), and stores it on `this.<contextPropertyName>` when set. The row `id` is the key the single-payout read routes take.

The provider's webhook then advances the `sys_<X>Payout` record through:

```
scheduled → in_transit → paid | failed | returned
scheduled → paid | returned     (a provider that reports a sent payout as scheduled: Stripe pending, PayPal PENDING, Mangopay CREATED)
```

See the [payment workflow](../capabilities/payment-workflow.md) for how webhook receipt and state-machine transitions are wired.

## Example

```json
{
  "name": "payoutVendorBalance",
  "connectedAccountProperty": "vendor.stripeAccountId",
  "amountProperty": "settlement.amount",
  "currencyProperty": "settlement.currency",
  "transferGroupProperty": "settlement.code",
  "contextPropertyName": "payout",
  "writeToResponse": true
}
```

## Errors

- `PAYOUT_ACTION_PROVIDER_DRIVEN_RESERVE_OR_GATE` (validation ERROR), the marketplace owner's provider resolves to a `provider_driven` payout cadence while a reserve (`payoutCadence.reserveDays > 0`) or an invoice gate (`payoutGate.requiresIncomingInvoice: true`) is configured; the action would pay at once past both. Set `payoutCadence.mode: "scheduled"` (with a schedule) on the provider, or remove the reserve / the gate.
- `providerName` cannot be resolved (no action-level value and `MarketplaceConfig` absent), the action throws a clear error.
- Provider lacks `supportsMarketplace`, the action throws before any payout is booked or sent.
- No destination (`PAYOUT_DESTINATION_REQUIRED`, `400`), or, multi-tenant, a caller session with no tenant (`401`): refused by the payout manager before any row is written or any provider is called.
- Multi-tenant: a destination that is another tenant's connected account (`NOT_FOUND`, `404`): refused by the payout manager before any row is written or any provider is called.
- `PAYOUT_OUTCOME_UNKNOWN` (`502`): the provider call failed ambiguously (a timeout, a transport error, a 5xx, a 408 / 409 / 425 / 429, or a duplicate / in-progress answer such as Adyen `422` errorCode `704` - the same classification the payout scheduler applies; only a definite refusal marks the row `failed`); the journalled row (named in the detail) is `outcome_unknown` and is never sent again automatically. Reconcile it with the provider before creating another payout.
- `connectedAccountProperty` / `amountProperty` / `currencyProperty` fail to resolve at runtime, the action throws.
- Insufficient connected-account balance, provider returns a domain error, surfaced via the action's `onActionError` policy.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PaymentAction`](./payment-action.md), [`RefundAction`](./refund-action.md), [`SubscriptionAction`](./subscription-action.md): sibling payment-domain actions.
- [`PaymentProvider`](../../spec/PaymentProvider.md), [`PaymentCapabilities`](../../spec/PaymentCapabilities.md).
- [Payment workflow](../capabilities/payment-workflow.md).
