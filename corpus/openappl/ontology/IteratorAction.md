# IteratorAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [IteratorAction in Part 2](../spec/IteratorAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

A generic streaming action whose method returns an async iterable. The sourceScript MScript expression must evaluate to an object with Symbol.asyncIterator (async generator, readable stream, etc.). Designed for custom streaming logic that isn't covered by AiCallAction.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `iteratorActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.iteratorActions`
- `services.businessLogic.actions.iteratorActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
