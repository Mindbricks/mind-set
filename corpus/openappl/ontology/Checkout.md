# Checkout

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [Checkout in Part 2](../spec/Checkout.md)

Provider-neutral one-time-payment activation for a DataObject. Mark a DataObject as billable by enabling `objectIsAnOrderObject` and pointing `configuration.providerName` at a configured PaymentProvider. The framework auto-generates the sys_<X>Payment system data object, the start/refresh/callback APIs, and wires the unified webhook router to the bound provider. This is the recommended shape for new billable objects, binding to any configured PaymentProvider via `providerName`.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `checkout`

Blueprint paths:

- `authentication.dataObjects.objectSettings.checkout`
- `services.dataObjects.objectSettings.checkout`

## Contains

- `configuration`: [CheckoutConfig](./CheckoutConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
