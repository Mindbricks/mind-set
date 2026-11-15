# SubscriptionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SubscriptionAction in Part 1](../ontology/SubscriptionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Creates, updates, cancels, or refreshes a recurring subscription against the bound PaymentProvider. The `stage` field picks the operation: `subscribe` creates a new subscription, `cancelSubscription` cancels an existing one, `refresh` pulls the latest provider state. Provider must have capabilities.supportsSubscriptions=true. The action writes / updates a sys_<X>Subscription record. A `subscribe` can need the buyer: on Stripe a first payment that needs 3-D Secure answers `statusLiteral: 'past_due'` with `nextAction` for Stripe.js; on iyzico every subscribe answers `pending_provider` with `checkoutForm`, iyzico's hosted subscription form. The Business API must return that answer to the frontend. A PROVIDER REFUSAL AFTER THE MAIN WRITE never leaves a silent half-commit: a `subscribe` placed after the main operation of a CREATE api with onActionError `throwError` deletes the row that create just wrote and answers the refusal (502, no row stands, an event already queued about the row is cancelled); in every other post-write placement (a `cancelSubscription` or `refresh` after an update, or `completeApi`) the row the main write committed stands, the api answers 2xx with that row and the refusal in `actionFailures` (action name, errorCode such as SUBSCRIPTION_PROVIDER_REFUSED, detail) and its route event is still published - check `actionFailures` before treating the change as done at the provider.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.paymentProvidersSettings.paymentProviders[].name. When null/omitted, the framework reads providerName from the parent DataObject's SubscriptionConfig. |
| `stage` | `PaymentStage` | no | `"subscribe"` | 10 values, see [PaymentStage](#paymentstage) |  | Operation to perform. One of `subscribe`, `cancelSubscription`, `refresh`. |
| `planProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the SubscriptionPlan reference (plan code or plan id). Required when stage=subscribe UNLESS the DataObject this api targets sets objectSettings.subscription.configuration.planProperty, which a subscribe-stage action falls back to when it declares none of its own. Design-time validation accepts either one and reports SUBSCRIPTION_ACTION_MISSING_PLAN_PROPERTY only when NEITHER is set. Setting it here overrides the DataObject-level property for this action. Inheriting it raises the design-time WARNING SUBSCRIPTION_ACTION_PLAN_PROPERTY_INHERITED, because the fallback is implemented by the nodejs, python and dotnet generators ONLY: on java, rust, golang and php the emitted subscribe stage has no fallback path, so java fails every call with a 500 naming the missing planProperty and rust refuses every call with 400 SUBSCRIPTION_PLAN_REQUIRED before reaching the provider. Set it on the action itself when any of those four is a generation target. |
| `subscriptionIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the subscription id to operate on. Required when stage=cancelSubscription or stage=refresh. |
| `cancelAtPeriodEndProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding a boolean. When stage=cancelSubscription and this resolves true, cancellation is scheduled at period end; otherwise immediate. |

## Allowed values

### PaymentStage

`simple`, `start`, `complete`, `refresh`, `callback`, `refund`, `dispute`, `subscribe`, `cancelSubscription`, `payout`

## Constraints

Property rules:

- `stage` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `planProperty`, `subscriptionIdProperty`, `cancelAtPeriodEndProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SUBSCRIPTION_ACTION_MISSING_PLAN_PROPERTY` | error | SubscriptionAction with stage="subscribe" requires a SubscriptionPlan reference - set planProperty on the action, or set objectSettings.subscription.configuration.planProperty on the DataObject this api targets, which … |
| `SUBSCRIPTION_ACTION_MISSING_SUBSCRIPTION_ID` | error | SubscriptionAction with stage="…" requires subscriptionIdProperty to be set — points to the property holding the subscription id to operate on. |
| `SUBSCRIPTION_ACTION_PLAN_PROPERTY_INHERITED` | warning | SubscriptionAction with stage="subscribe" declares no planProperty and will inherit "…" from the DataObject's objectSettings.subscription.configuration.planProperty. |

## Example

Use to manage a recurring subscription against the bound provider — stage=subscribe to start a plan (planProperty required on the action, or inherited from the DataObject subscription config), cancelSubscription or refresh on an existing subscription.

```json
{
  "name": "subscribeToPlan",
  "description": "Subscribe the customer to the selected plan.",
  "providerName": "stripeMain",
  "stage": "subscribe",
  "planProperty": "planCode",
  "contextPropertyName": "subscription",
  "writeToResponse": true
}
```
