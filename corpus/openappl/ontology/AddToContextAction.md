# AddToContextAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [AddToContextAction in Part 2](../spec/AddToContextAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Adds one or more calculated values to the runtime context (`this`) at a specific point in the Business API flow. This is typically used to prepare values that will be referenced in later actions, such as computed totals, enriched properties, or temporary flags. The values are evaluated via MScript and written under the names you specify.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `addToContextActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.addToContextActions`
- `services.businessLogic.actions.addToContextActions`

## Contains

- `context`: [ContextData](./ContextData.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
