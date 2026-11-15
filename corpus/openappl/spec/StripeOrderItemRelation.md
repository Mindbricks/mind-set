# StripeOrderItemRelation

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [StripeOrderItemRelation in Part 1](../ontology/StripeOrderItemRelation.md)

Declares the local join between an order and its order items: item[orderItemLocalKey] matches order[orderForeignKey]. Current nodejs payment generation does not fetch or consume rows through this relation. A concrete item-consuming operation, trigger and payload contract remain undecided. The type is referenced by CheckoutConfig.orderItemRelation and legacy StripeOrderConfig.orderItemRelation; its retained name does not imply a Stripe-specific basket payload.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasOrderItemRelation` | `Boolean` | yes |  |  |  | Declared order-item relation switch, default false. Current nodejs payment generation does not consume this switch or the relation, including when true. The relation alone performs no read or fulfillment; an item-consuming operation, trigger and payload contract remain undecided. |
| `orderItemObject` | [`LocalDataObjectName`](./LocalDataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | Order item data object name. This should be a local data object in the same service. Current nodejs payment generation does not fetch or consume items through this relation. The join declaration alone does not enable an item-consuming operation. |
| `orderForeignKey` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Property of the current order object that provides the value used to match order items. Commonly `id`. Current nodejs payment generation does not fetch or consume items through this relation. The join declaration alone does not enable an item-consuming operation. |
| `orderItemLocalKey` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `orderItemObject` | Property of the order item object that stores the relation value to the order. Commonly `orderId`. Current nodejs payment generation does not fetch or consume items through this relation. The join declaration alone does not enable an item-consuming operation. |
| `quantityProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `orderItemObject` | Property of the order item object that stores item quantity for perOrderItemQuantity operations. Commonly `quantity` or `qty`. |

## Constraints

Property rules:

- `hasOrderItemRelation` must be present. (`REQUIRED_FIELD_MISSING`)
- `orderItemObject` must be a well-formed [`LocalDataObjectName`](./LocalDataObjectName.md) (a data object of the same service). (`INVALID_LOCAL_DATA_OBJECT_NAME_FORMAT`)
- `orderForeignKey`, `orderItemLocalKey`, `quantityProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
