# RefundAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [RefundAction in Part 2](../spec/RefundAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Issues a refund against a prior captured payment via the bound PaymentProvider. Supports full refunds (omit `refundAmountProperty`) and partial refunds (set `refundAmountProperty` to a PropRefer that resolves to a numeric value at runtime). Provider must have capabilities.supportsRefundsFull=true for full refunds and supportsRefundsPartial=true for partial. The action writes a sys_<X>Refund record and advances the parent sys_<X>Payment state machine to `partially_refunded` or `refunded` accordingly. The action needs a checkout target in its own service (the api's object, a related checkout object, or the service's single one); keep the RefundAction on the service that owns the checkout object. A refund-only service that owns none sets `providerOnly: true` with an explicit `providerName`, a `paymentIntentIdProperty` and a mandatory `ownershipGuard` (403 NOT_OWNER when false, before any provider call); it then writes no local refund record.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `refundActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.refundActions`
- `services.businessLogic.actions.refundActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `paymentIntentIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `refundAmountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `reasonProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
