# LoopAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [LoopAction in Part 1](../ontology/LoopAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a repeated execution block within a Business API workflow. It loops over the result of an MScript expression and executes a list of actions for each item. The current item is exposed as a local variable named by `loopItemName`, directly accessible in MScript, and also as the aliases `loopItem` and `crudItem`. Every action executed under a loop additionally receives the loop-step context as ordinary bindings: `stepIndex`, the zero-based index of the current iteration, and `stepResults`, an accumulator carrying the results of this loop level's earlier steps keyed `<innerActionName>_<stepIndex>`. Referencing `stepIndex` in a dataValue is the canonical way to persist an order derived from the input list. Loop actions can be nested to support multi-level iteration: each level gets its OWN fresh counter and accumulator, so an inner level can never advance or overwrite its parent's. Inside a nested loop `stepIndex` and `stepResults` always name the INNERMOST enclosing loop — the outer level's index and results are shadowed and unreachable by name — while every enclosing level's `loopItemName` stays reachable, so a grid-like write addresses its rows and columns through the item names rather than through two indexes. An inner action that declares a `contextPropertyName` publishes its result in TWO places: on the manager as `this.<contextPropertyName>`, the access path that property documents, and — when the loop item is an object — back onto the item itself as `<loopItemName>.<contextPropertyName>`. The `this` slot names the last step in which that inner action RAN: normally the CURRENT step, exactly like `loopItemName` and `stepIndex`, so once the loop has finished it holds the LAST step's value — but an inner action carrying a `condition` writes nothing on a step it skips, so the slot then still holds the PREVIOUS iteration's value. Read the per-item copy whenever you need a specific iteration's value, or to tell a skipped step from a stale one.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `loopFor` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to an iterable (such as an array). Each element of the result will be bound to the variable defined by `loopItemName` and processed through the listed actions. |
| `loopItemName` | `String` | yes |  |  |  | The name of the variable representing the current item in each loop iteration. This variable is directly accessible in MScript without `this.`. For example, if `loopItemName` is `customerItem`, you can reference `customerItem.id` or `customerItem.status` inside any action executed in the loop.  The loop's step binder publishes `this.<loopItemName>` plus the aliases `this.crudItem`, `this.loopItem`, `this.stepIndex` and `this.stepResults` BEFORE EVERY action inside the loop. Two consequences the validator now reports as WARNINGS:  - An action whose `contextPropertyName` spells one of those names writes its result into the same slot and the next step overwrites it, on every iteration, with no error anywhere (`LOOP_STEP_BINDING_SHADOWED`). Pick a name of your own, e.g. `<name>Result`. A `contextPropertyName` that collides with an inherited ApiManager member is a separate, blocking error (`RESERVED_CONTEXT_PROPERTY`). - A loop nested inside another loop that spells the SAME `loopItemName` shadows its parent's item for the whole inner body, so an action inside the inner loop cannot reach the outer item under any spelling (`NESTED_LOOP_ITEM_NAME_SHADOWED`). Give each nesting level its own name.  Defaults to `item` when unset, which participates in both checks. |
| `isParallel` | `Boolean` | no | `false` |  |  | A boolean value to control the non-blocking behaviour of the loop steps. If `isParallel` is true, all loop steps are scheduled asynchronously and awaited as a group. If false, steps are awaited and executed one by one. Warning: parallel mode can cause race conditions when actions write to shared context (`this.*`) or perform conflicting read-modify-write updates on the same record. Prefer item-local writes, `stepResults`, or database concurrency controls when enabling parallel mode. |
| `actions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | An array of action names (as strings) to execute during each loop iteration. These actions must be previously defined in the Business API's action store. |

## Constraints

Property rules:

- `loopFor`, `loopItemName` must be present. (`REQUIRED_FIELD_MISSING`)
- `actions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ACTION_NOT_FOUND` | error | Action "…" not found in this BusinessApi. |

## Example

Use to run a set of previously-defined actions once per item of an iterable, exposing the current item under loopItemName — set isParallel only when iterations don't write shared context or contend on the same records.

```json
{
  "name": "notifyEachParticipant",
  "description": "Send a confirmation email to every participant of the booking, sequentially.",
  "loopFor": { "js": "this.booking.participants" },
  "loopItemName": "participant",
  "isParallel": false,
  "actions": [
    "renderParticipantEmail",
    "sendParticipantEmail"
  ]
}
```
