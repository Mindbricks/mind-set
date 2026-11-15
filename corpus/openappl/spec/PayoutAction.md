# PayoutAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [PayoutAction in Part 1](../ontology/PayoutAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Triggers a marketplace payout to a connected sub-merchant account via the bound PaymentProvider. Provider must have capabilities.supportsMarketplace=true. The action writes a sys_<X>Payout record and the payout's progress is then tracked via webhook events that advance through scheduled → in_transit → paid | failed | returned.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.paymentProvidersSettings.paymentProviders[].name. When null/omitted, the framework reads providerName from the parent DataObject's MarketplaceConfig. |
| `connectedAccountProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the connected sub-merchant account id. Resolves at runtime against the request context. |
| `amountProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the payout amount. Required: the action refuses a payout whose amount does not resolve. On a sourceOrderProperty payout that releases a settlementRelease row, the value is not used and not compared: the payout sends the amount booked for that sale at capture (for a partially refunded sale, the pro-rata remainder the payout scheduler recomputes under its claim). See docs-site/integrations/payment/iyzico-field-notes.md (Refunds and disputes while held). |
| `currencyProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the currency. Defaults to the parent MarketplaceConfig's currency when omitted. |
| `transferGroupProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding a transfer group identifier for provider-side reporting (Stripe). |
| `metadataProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property (or context value) holding an OBJECT passed to the provider as the payout's `metadata`, e.g. iyzico `{ paymentId }` / `{ paymentId, paymentTransactionIds }` (named transaction ids travel with the paymentId of their charge). A value that is not a plain object is ignored. Null/absent: no metadata is sent. |
| `scheduledForProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding the date-time the payout is scheduled for (`scheduledFor`). On a scheduled cadence (or a reserve) the booked row is not sent before it. Null/absent: the cadence decides, as before. |
| `sourceOrderProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding the id of the marketplace SALE row this payout settles, sent as `metadata.orderId`. On a marketplace owner that declares `settlementRelease`, the payout then RELEASES the payout row the framework booked for that sale at capture - with the provider item ids persisted on it (iyzico paymentTransactionIds) - instead of booking a second payout: `manual` releases it, `onDate` / `onStatus` release it only once the condition holds (it stays held otherwise). A sale with no booked row is refused 409 SETTLEMENT_RELEASE_NOT_BOOKED. Null/absent: an ordinary payout, as before. |

## Constraints

Property rules:

- `connectedAccountProperty`, `amountProperty` must be present. (`REQUIRED_FIELD_MISSING`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `connectedAccountProperty`, `amountProperty`, `currencyProperty`, `transferGroupProperty`, `metadataProperty`, `scheduledForProperty`, `sourceOrderProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PAYOUT_ACTION_MISSING_AMOUNT` | error | PayoutAction requires amountProperty — points to the property holding the payout amount. |
| `PAYOUT_ACTION_MISSING_CONNECTED_ACCOUNT` | error | PayoutAction requires connectedAccountProperty — points to the property holding the connected sub-merchant account id. |
| `PAYOUT_ACTION_NO_PAYOUT_MODEL` | warning | PayoutAction has no marketplace payout model to book through: no DataObject of this service carries `objectSettings.marketplace.objectIsMarketplaceObject: true`, so the generated action pays synchronously through … |

## Example

Use to pay out marketplace earnings to a connected sub-merchant account via a provider that supports marketplace; the payout's progress is then tracked through webhook events.

```json
{
  "name": "payoutSeller",
  "description": "Transfer the seller's settled earnings to their connected account.",
  "providerName": "stripeMain",
  "connectedAccountProperty": "sellerAccountId",
  "amountProperty": "payoutAmount",
  "currencyProperty": "payoutCurrency",
  "transferGroupProperty": "orderGroupId",
  "contextPropertyName": "payout"
}
```
