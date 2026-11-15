# SubscriptionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SubscriptionAction in Part 2](../spec/SubscriptionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Creates, updates, cancels, or refreshes a recurring subscription against the bound PaymentProvider. The `stage` field picks the operation: `subscribe` creates a new subscription, `cancelSubscription` cancels an existing one, `refresh` pulls the latest provider state. Provider must have capabilities.supportsSubscriptions=true. The action writes / updates a sys_<X>Subscription record. A `subscribe` can need the buyer: on Stripe a first payment that needs 3-D Secure answers `statusLiteral: 'past_due'` with `nextAction` for Stripe.js; on iyzico every subscribe answers `pending_provider` with `checkoutForm`, iyzico's hosted subscription form. The Business API must return that answer to the frontend. A PROVIDER REFUSAL AFTER THE MAIN WRITE never leaves a silent half-commit: a `subscribe` placed after the main operation of a CREATE api with onActionError `throwError` deletes the row that create just wrote and answers the refusal (502, no row stands, an event already queued about the row is cancelled); in every other post-write placement (a `cancelSubscription` or `refresh` after an update, or `completeApi`) the row the main write committed stands, the api answers 2xx with that row and the refusal in `actionFailures` (action name, errorCode such as SUBSCRIPTION_PROVIDER_REFUSED, detail) and its route event is still published - check `actionFailures` before treating the change as done at the provider.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `subscriptionActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.subscriptionActions`
- `services.businessLogic.actions.subscriptionActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `planProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `subscriptionIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `cancelAtPeriodEndProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
