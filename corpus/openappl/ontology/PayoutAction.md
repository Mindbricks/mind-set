# PayoutAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [PayoutAction in Part 2](../spec/PayoutAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Triggers a marketplace payout to a connected sub-merchant account via the bound PaymentProvider. Provider must have capabilities.supportsMarketplace=true. The action writes a sys_<X>Payout record and the payout's progress is then tracked via webhook events that advance through scheduled → in_transit → paid | failed | returned.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `payoutActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.payoutActions`
- `services.businessLogic.actions.payoutActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `connectedAccountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `amountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `currencyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `transferGroupProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `metadataProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `scheduledForProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `sourceOrderProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
