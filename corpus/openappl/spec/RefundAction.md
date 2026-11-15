# RefundAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [RefundAction in Part 1](../ontology/RefundAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Issues a refund against a prior captured payment via the bound PaymentProvider. Supports full refunds (omit `refundAmountProperty`) and partial refunds (set `refundAmountProperty` to a PropRefer that resolves to a numeric value at runtime). Provider must have capabilities.supportsRefundsFull=true for full refunds and supportsRefundsPartial=true for partial. The action writes a sys_<X>Refund record and advances the parent sys_<X>Payment state machine to `partially_refunded` or `refunded` accordingly. The action needs a checkout target in its own service (the api's object, a related checkout object, or the service's single one); keep the RefundAction on the service that owns the checkout object. A refund-only service that owns none sets `providerOnly: true` with an explicit `providerName`, a `paymentIntentIdProperty` and a mandatory `ownershipGuard` (403 NOT_OWNER when false, before any provider call); it then writes no local refund record.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.paymentProvidersSettings.paymentProviders[].name. When null/omitted, the framework reads the providerName from the parent DataObject's CheckoutConfig. |
| `paymentIntentIdProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property holding the payment intent / payment ticket id to refund. Resolves at runtime against the request context. When no binding resolves an intent id, the action refunds the payment recorded on the sys_<Order>Payment ticket of the order the api acts on (its own row, or the row's single relation to the order); an order without a payment ticket answers 404. |
| `refundAmountProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding the partial refund amount. When omitted, a full refund is issued. Provider must support supportsRefundsPartial when this is set. |
| `reasonProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional property holding a refund reason (one of duplicate, fraudulent, requested_by_customer, other). Passed through to the provider when supported. |
| `providerOnly` | `Boolean` | no | `false` |  |  | Opt-in (default false) for a refund-only service that owns no checkout object: the action refunds a payment another service charged, straight through the provider, with no local `sys_<Order>Payment` ticket and no `sys_<Order>Refund` ledger row. Requires an explicit `providerName` (a declared paymentProvidersSettings provider), a `paymentIntentIdProperty` and an `ownershipGuard`; validation refuses providerOnly without any of the three (REFUND_PROVIDER_ONLY_GUARD_REQUIRED, REFUND_PROVIDER_ONLY_BINDING_INCOMPLETE). With providerOnly the service's checkout objects are ignored by this action (no ticket lookup, no ownership preflight, no close-out), so the ownershipGuard is the only check that the caller may refund the intent. Unset, the action needs a checkout target in its service and a service without one is refused PAYMENT_NOT_CONFIGURED. The preferred alternative keeps the RefundAction on the service that owns the checkout object, where the ticket preflight (404 for an unknown intent, 403 NOT_OWNER for a foreign owner, 409 for a terminal or fully refunded payment) runs. nodejs, python, rust, java and dotnet: on another service language providerOnly is refused (REFUND_PROVIDER_ONLY_NOT_PORTED). |
| `ownershipGuard` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Required when `providerOnly` is true, ignored otherwise. An MScript boolean expression, evaluated at runtime BEFORE the provider is resolved or called, that answers whether this caller may refund the intent (for example `this.session.userId === this.charge.ownerId`, after an earlier action fetched the charge from the service that owns it, or `this.session.roleId === 'admin'`). A falsy result refuses the call with 403 NOT_OWNER and no provider call is made. No role bypasses it: grant operators inside the expression. |

## Constraints

Property rules:

- `paymentIntentIdProperty` must be present. (`REQUIRED_FIELD_MISSING`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `paymentIntentIdProperty`, `refundAmountProperty`, `reasonProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

## Example

Use to refund a captured payment — omit refundAmountProperty for a full refund, or point it at a numeric property for a partial refund; writes a refund record and advances the payment state machine.

```json
{
  "name": "refundOrder",
  "description": "Issue a partial refund for a returned item against the order's payment intent.",
  "providerName": "stripeMain",
  "paymentIntentIdProperty": "paymentIntentId",
  "refundAmountProperty": "refundAmount",
  "reasonProperty": "refundReason",
  "contextPropertyName": "refund"
}
```
