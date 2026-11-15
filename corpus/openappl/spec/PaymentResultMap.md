# PaymentResultMap

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [PaymentResultMap in Part 1](../ontology/PaymentResultMap.md)

Defines how normalized payment outcomes (started, success, failed, canceled) map to internal order status values using MScript expressions. The four buckets are provider-neutral — the framework normalizes provider-specific statuses into them. The mapping is declarative: the generated payment layer does not evaluate it or write the order row; a checkout lifecycle hook performs that write. The type was originally Stripe-specific but is now used by `CheckoutConfig.mapPaymentResultToOrderStatus` across all providers; the name is kept to avoid disrupting existing references.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `paymentResultStarted` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Declarative MScript expression describing the intended mapping from the normalized provider-neutral 'started' payment outcome to an internal order status. The generated payment layer does not evaluate this expression or update the order row. Author the write in a checkout lifecycle hook or Business API, as described by CheckoutConfig.mapPaymentResultToOrderStatus. |
| `paymentResultCanceled` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Declarative MScript expression describing the intended mapping from the normalized provider-neutral 'canceled' payment outcome to an internal order status. The generated payment layer does not evaluate this expression or update the order row. Author the write in a checkout lifecycle hook or Business API, as described by CheckoutConfig.mapPaymentResultToOrderStatus. |
| `paymentResultFailed` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Declarative MScript expression describing the intended mapping from the normalized provider-neutral 'failed' payment outcome to an internal order status. The generated payment layer does not evaluate this expression or update the order row. Author the write in a checkout lifecycle hook or Business API, as described by CheckoutConfig.mapPaymentResultToOrderStatus. |
| `paymentResultSuccess` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Declarative MScript expression describing the intended mapping from the normalized provider-neutral 'success' payment outcome to an internal order status. The generated payment layer does not evaluate this expression or update the order row. Author the write in a checkout lifecycle hook or Business API, as described by CheckoutConfig.mapPaymentResultToOrderStatus. |

## Constraints

Property rules:

- `paymentResultStarted`, `paymentResultCanceled`, `paymentResultFailed`, `paymentResultSuccess` must be present. (`REQUIRED_FIELD_MISSING`)
