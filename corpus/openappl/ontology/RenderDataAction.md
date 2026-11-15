# RenderDataAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [RenderDataAction in Part 2](../spec/RenderDataAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Renders a literal string with flat ${key} substitutions from inputData on nodejs. The inputData expression is evaluated as MScript; the template itself is literal text. Placeholders use word-character top-level keys. Missing or undefined values become empty text; present values use String(), including null as 'null'. There is no file lookup, EJS, Mustache, expression evaluation, nested-key lookup or HTML escaping. The rendered result is saved into context with contextPropertyName and can be reused by later actions.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `renderDataActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.renderDataActions`
- `services.businessLogic.actions.renderDataActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
