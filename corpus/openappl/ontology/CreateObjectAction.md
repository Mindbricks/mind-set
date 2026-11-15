# CreateObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CreateObjectAction in Part 2](../spec/CreateObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Constructs an in-memory JavaScript object from key-value pairs and writes it to the context. This action does not persist data to the database. It is typically used to prepare structured data for use in other actions such as sending emails, rendering templates, API calls, or forming response objects.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `createObjectActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.createObjectActions`
- `services.businessLogic.actions.createObjectActions`

## Contains

- `payload`: [ObjectData](./ObjectData.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
