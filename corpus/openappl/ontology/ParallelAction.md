# ParallelAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ParallelAction in Part 2](../spec/ParallelAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a non-blocking execution group in which multiple actions are executed in parallel. Each action runs independently using the same input context. Parallel actions are useful for concurrent fetches, validations, or other side-effect-free logic. Warning: avoid parallel branches that mutate the same shared fields or the same database records without concurrency controls, because final state can become non-deterministic. This action can also include nested `ParallelAction` or `LoopAction` steps, enabling concurrent or branched execution across multiple layers of the workflow.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `parallelActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.parallelActions`
- `services.businessLogic.actions.parallelActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
