# PaymentResultMap

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [PaymentResultMap in Part 2](../spec/PaymentResultMap.md)

Defines how normalized payment outcomes (started, success, failed, canceled) map to internal order status values using MScript expressions. The four buckets are provider-neutral — the framework normalizes provider-specific statuses into them. The mapping is declarative: the generated payment layer does not evaluate it or write the order row; a checkout lifecycle hook performs that write. The type was originally Stripe-specific but is now used by `CheckoutConfig.mapPaymentResultToOrderStatus` across all providers; the name is kept to avoid disrupting existing references.

## Contained in

- [CheckoutConfig](./CheckoutConfig.md) as `mapPaymentResultToOrderStatus`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
