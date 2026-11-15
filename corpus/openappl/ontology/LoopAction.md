# LoopAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [LoopAction in Part 2](../spec/LoopAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a repeated execution block within a Business API workflow. It loops over the result of an MScript expression and executes a list of actions for each item. The current item is exposed as a local variable named by `loopItemName`, directly accessible in MScript, and also as the aliases `loopItem` and `crudItem`. Every action executed under a loop additionally receives the loop-step context as ordinary bindings: `stepIndex`, the zero-based index of the current iteration, and `stepResults`, an accumulator carrying the results of this loop level's earlier steps keyed `<innerActionName>_<stepIndex>`. Referencing `stepIndex` in a dataValue is the canonical way to persist an order derived from the input list. Loop actions can be nested to support multi-level iteration: each level gets its OWN fresh counter and accumulator, so an inner level can never advance or overwrite its parent's. Inside a nested loop `stepIndex` and `stepResults` always name the INNERMOST enclosing loop — the outer level's index and results are shadowed and unreachable by name — while every enclosing level's `loopItemName` stays reachable, so a grid-like write addresses its rows and columns through the item names rather than through two indexes. An inner action that declares a `contextPropertyName` publishes its result in TWO places: on the manager as `this.<contextPropertyName>`, the access path that property documents, and — when the loop item is an object — back onto the item itself as `<loopItemName>.<contextPropertyName>`. The `this` slot names the last step in which that inner action RAN: normally the CURRENT step, exactly like `loopItemName` and `stepIndex`, so once the loop has finished it holds the LAST step's value — but an inner action carrying a `condition` writes nothing on a step it skips, so the slot then still holds the PREVIOUS iteration's value. Read the per-item copy whenever you need a specific iteration's value, or to tell a skipped step from a stale one.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `loopActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.loopActions`
- `services.businessLogic.actions.loopActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
