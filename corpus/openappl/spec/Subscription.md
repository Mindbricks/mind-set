# Subscription

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [Subscription in Part 1](../ontology/Subscription.md)

**Activation:** the pattern is switched on by `objectIsSubscriptionObject`.

Provider-neutral subscription activation for a DataObject. When enabled, the framework auto-generates a sys_<X>Subscription table (or treats the parent DataObject as the subscription record if so configured) and emits subscribe/cancel/update APIs that route through the bound provider's subscriptions surface. Requires the bound PaymentProvider to have capabilities.supportsSubscriptions=true.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `objectIsSubscriptionObject` | `Boolean` | yes |  |  |  | Enables subscription logic for this object. When true, the framework treats this object as a recurring-billing entity bound to a SubscriptionPlan. |
| `configuration` | [`SubscriptionConfig`](./SubscriptionConfig.md) | no |  |  |  | The SubscriptionConfig binding plan/customer/lifecycle properties to the provider. Leave null if objectIsSubscriptionObject is false. |

## Constraints

Property rules:

- `objectIsSubscriptionObject` must be present. Enforced only while `objectIsSubscriptionObject` is on. (`REQUIRED_FIELD_MISSING`)
