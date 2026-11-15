# StripeOrderItemRelation

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [StripeOrderItemRelation in Part 2](../spec/StripeOrderItemRelation.md)

Declares the local join between an order and its order items: item[orderItemLocalKey] matches order[orderForeignKey]. Current nodejs payment generation does not fetch or consume rows through this relation. A concrete item-consuming operation, trigger and payload contract remain undecided. The type is referenced by CheckoutConfig.orderItemRelation and legacy StripeOrderConfig.orderItemRelation; its retained name does not imply a Stripe-specific basket payload.

## Contained in

- [CheckoutConfig](./CheckoutConfig.md) as `orderItemRelation`

## Contains

No other pattern: every property is a value or a reference.

## References

- `orderItemObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))
- `orderForeignKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `orderItemLocalKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `orderItemObject`)
- `quantityProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `orderItemObject`)

## Referenced by

No property of another pattern names this pattern.
