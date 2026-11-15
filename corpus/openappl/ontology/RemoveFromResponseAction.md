# RemoveFromResponseAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [RemoveFromResponseAction in Part 2](../spec/RemoveFromResponseAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Removes one or more properties from the final API response before it is returned to the client. This is useful for eliminating internal, sensitive, or unnecessary fields that were added by earlier actions or populated from context. Commonly used to enforce privacy, avoid leaking implementation details, or to conform to specific output schemas. On a `list` api set `applyToListRows: true` — this is THE supported way to redact fields from every row of a list response, and the only construct that can do it conditionally (an `isSecret` property is hidden from the owner and the admin too, and `contextPropertyName` never replaces the response). Place the action in the `afterBuildOutput` workflow stage: the response object it edits does not exist before `buildOutput` composes it.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `removeFromResponseActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.removeFromResponseActions`
- `services.businessLogic.actions.removeFromResponseActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
