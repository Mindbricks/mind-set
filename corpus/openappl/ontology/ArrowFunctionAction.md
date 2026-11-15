# ArrowFunctionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ArrowFunctionAction in Part 2](../spec/ArrowFunctionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

This action defines a reusable function and sets it to the context with the contextPropertyName name. Java supports a non-empty authored body only when it has at least one named parameter and exactly one return of a supported literal, parameter, or string concatenation; for example, parameterNames: ["tier"] with functionBody: "{ return 'Tier ' + tier; }". Callbacks, object/array literals, accumulators, and general JavaScript statements refuse generation with JAVA_ARROW_FUNCTION_BODY_UNPORTABLE and the actions.arrowFunctionActions[<name>].functionBody slot. An empty body remains a noop. The Intl currency formatter use-case is for Node.js; Java designers should use the supported formatter subset.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `arrowFunctionActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.arrowFunctionActions`
- `services.businessLogic.actions.arrowFunctionActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
