# EmitSseEventAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [EmitSseEventAction in Part 2](../spec/EmitSseEventAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Emits a custom SSE event during the workflow. The event name and payload are declaratively configured. When the API is called via REST (no SSE context), this action is a silent no-op.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `emitSseEventActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.emitSseEventActions`
- `services.businessLogic.actions.emitSseEventActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
