# Subscription

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [Subscription in Part 2](../spec/Subscription.md)

Provider-neutral subscription activation for a DataObject. When enabled, the framework auto-generates a sys_<X>Subscription table (or treats the parent DataObject as the subscription record if so configured) and emits subscribe/cancel/update APIs that route through the bound provider's subscriptions surface. Requires the bound PaymentProvider to have capabilities.supportsSubscriptions=true.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `subscription`

Blueprint paths:

- `authentication.dataObjects.objectSettings.subscription`
- `services.dataObjects.objectSettings.subscription`

## Contains

- `configuration`: [SubscriptionConfig](./SubscriptionConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
