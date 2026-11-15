# Checkout

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [Checkout in Part 1](../ontology/Checkout.md)

**Activation:** the pattern is switched on by `objectIsAnOrderObject`.

Provider-neutral one-time-payment activation for a DataObject. Mark a DataObject as billable by enabling `objectIsAnOrderObject` and pointing `configuration.providerName` at a configured PaymentProvider. The framework auto-generates the sys_<X>Payment system data object, the start/refresh/callback APIs, and wires the unified webhook router to the bound provider. This is the recommended shape for new billable objects, binding to any configured PaymentProvider via `providerName`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectIsAnOrderObject` | `Boolean` | yes |  |  |  | Enables one-time-payment logic for this object. When true, the object is treated as an order and integrated with the bound payment provider's payment flow. |
| `configuration` | [`CheckoutConfig`](./CheckoutConfig.md) | no |  |  |  | The CheckoutConfig describing how this object maps onto the provider's payment intent (amount property, currency property, status mapping, lifecycle hooks). Leave it null if objectIsAnOrderObject is false. |

## Constraints

Property rules:

- `objectIsAnOrderObject` must be present. Enforced only while `objectIsAnOrderObject` is on. (`REQUIRED_FIELD_MISSING`)
