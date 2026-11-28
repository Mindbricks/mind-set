# ValidationAction

**Level:** `section` · **Family:** [BuiltInApiCheck](./families.md#builtinapicheck) (domain `ProjectAuthentication`)

**Specification:** [ValidationAction in Part 2](../spec/ValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a flexible business rule that performs a dynamic condition check during Business API execution. Unlike permission or membership checks, a ValidationAction is fully script-based and domain-specific, allowing complex logical conditions such as subscription status, object states, quota limits, feature flags, or compliance rules. If the validation fails, the system either throws an error (liveCheck) or stores the result in context for later decision-making (storedCheck).

## Contained in

- [BuiltInApiCheck](./BuiltInApiCheck.md) as `validation`
- [BusinessApiActionStore](./BusinessApiActionStore.md) as `validationActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.validationActions`
- `authentication.builtInApiChecks.validation`
- `services.businessLogic.actions.validationActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
