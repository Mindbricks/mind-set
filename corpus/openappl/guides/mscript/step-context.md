---
title: MScript step context
---

# MScript step context

When MScript runs inside an inner action of a `LoopAction`,
`IteratorAction`, or `ParallelAction`, what's reachable on `this`
differs subtly from the top-level handler. This page documents the
bindings the generated service provides.

The examples below are written as a `js` source. The context root
spelled `this` here is rewritten when a compiler translates the
expression for another target: **Python uses `self`** (so
`this.customerItem.id` becomes `self.customerItem.id`), **Java / C# / Go
keep `this`**, and **Rust indexes a JSON value** (so
`this.customerItem.id` becomes `this["customerItem"]["id"]`). The
loop-item and `crudItem` bindings, per-step writes, and parent-context
visibility described here apply the same way under every target; only the
token and member-access form change. See
[Writing MScript across languages](overview.md#writing-mscript-across-languages)
for the table.

## Inside a LoopAction

Before each inner action runs, the loop assigns the current element to two
properties on the context:

```text
this[loopItemName] = list[idx]   // declared name
this.crudItem      = list[idx]   // universal alias
```

Inner actions take no parameters; they reach the current item via
`this.<loopItemName>` (or the alias `this.crudItem`). The `crudItem`
alias is set unconditionally except when `loopItemName === 'crudItem'`
itself.

So given a loop declared with `loopItemName: "customerItem"`, any inner
MScript can write:

```js
this.customerItem.id
this.crudItem.id   // same value
```

Authored as the JS above, that loop-item read is translated per target:
`self.customerItem.id` (Python), `this.customerItem.id` (Java / C# / Go),
`this["customerItem"]["id"]` (Rust). The loop-item binding is set on the
context root by the loop, so it is reachable from whatever the root is
called in that language.

The parent context (`this.session`, `this.<paramName>`, prior action
outputs published via `contextPropertyName`) remains fully visible
inside the loop. The loop adds bindings; it does not isolate them.

### Per-step outputs

Each iteration runs its inner actions and collects their results into
a per-step record keyed by the inner action's `name`. When an inner
action declares a `contextPropertyName`, the service publishes the
step's result in **two** places:

- on the context as `this.<innerContextPropertyName>`: the access
  path `contextPropertyName` documents for every action. The slot
  names the last step in which that inner action **ran**: normally the
  **current step**, like `this.<loopItemName>` and `this.stepIndex`, so
  once the loop has finished it holds the last step's value. An inner
  action carrying a `condition` writes nothing on a step it skips, so
  on such a step the slot still holds the previous iteration's value.
- back onto the **loop item itself**, when the item is an object, so
  sibling inner actions and downstream MScript can read it as
  `this.<loopItemName>.<innerContextPropertyName>`. This is the copy
  to prefer whenever you need a specific iteration's value.

So given an inner action `calculatePrice` with
`contextPropertyName: "discountPreview"`, the service makes
`this.customerItem.discountPreview` available to any inner action
that runs later in the same iteration.

After the loop returns, the outer return value is the array of
per-iteration records: `[{ inner1: ..., inner2: ... }, ...]`. Inner actions
that omit `contextPropertyName` still execute but do not contribute
to the per-iteration record.

Each iteration owns its own per-iteration record. Iterations run one at
a time (also with `isParallel: true`, see below), so a step can read
what earlier steps produced through `this.stepResults`.

### Default-vs-explicit `loopItemName`

If you omit `loopItemName` the binding defaults to `this.item`. With
multiple nested loops, give each an explicit name to keep references
unambiguous:

```json
"loopActions": [
  {
    "name":         "perOrder",
    "loopFor":      { "js": "this.orders" },
    "loopItemName": "order",
    "actions":      ["perLine"]
  },
  {
    "name":         "perLine",
    "loopFor":      { "js": "this.order.items" },
    "loopItemName": "line",
    "actions":      ["..."]
  }
]
```

The inner loop is a second `loopActions` entry that the outer loop
names in its `actions`; only `perOrder` is referenced from the
workflow. Inside the inner body, `this.order.id` and `this.line.sku`
are both visible: the outer item is still on `this` because the alias
assignment is a plain property write, not a fresh scope.

Every loop is its own generated action, which is one more reason every
action name in the store must be unique.

### Parallel vs sequential

A loop with inner actions runs its iterations one at a time, also when
`isParallel: true` is set: every step publishes its item and step
context on the shared `this`, so concurrent steps would read each
other's item, and the generated loop does not run them concurrently.
The inner actions of one step are awaited in order. For concurrent IO
(one HTTP call per known branch) use a `ParallelAction`.

Guidelines for loop writes:

- Prefer item-local writes (`contextPropertyName` writing back onto
  the loop item, as the template does by default) over global
  `this.<name> = ...` mutations.
- For aggregates, run a follow-up aggregation action after the loop
  completes, reading the loop's returned array.
- For high-contention DB writes (two requests racing on the same rows),
  add row-level locks, optimistic
  versioning, or gate the write's `whereClause` on a precondition
  you already hold. The `$add`/`$rem` array-mutation operators are
  resolved at the application layer and written under a
  compare-and-swap that retries a bounded number of times, then
  answers 409 (see [Array mutation](array-mutation.md#concurrency)).
  A counter is the
  exception: `$inc` / `$incIf` ARE database-atomic (see [Numeric
  mutation](numeric-mutation.md)).

## Inside an IteratorAction

`IteratorAction` is not a workflow scope; it is a **stream source**.
It yields source items one at a time, with no inner actions and no
per-item `this.<name>` binding. Placed at a workflow milestone, it is
consumed there: on an API running over SSE each yielded item is written
to the stream as a `chunk` frame; otherwise the items are collected into
`this.<contextPropertyName>` (strings joined into one string, a single
item as itself, several items as an array).

Use `LoopAction` when you want "iterate an array, run inner actions,
expose `this.<item>`."

## Inside a ParallelAction

`ParallelAction` fires its named children concurrently. Each child is a
single action; there are no per-child "branches" with their own internal
flow.

Each child sees the parent context as it was when the `ParallelAction`
started. Reading `this.<otherChildContextProperty>` from inside one
child while another child is computing it is undefined; see
[Race conditions](../workflow/race-conditions.md). After
all children settle, their results are assigned to the shared `this`
under each child's `contextPropertyName` (or `name`).

## Inside an ArrowFunctionAction

`ArrowFunctionAction` is not loop-specific, but it shares the
"context is plain JS" story. Its `functionBody` is a JS
block; `this` inside the body is the same context. The result is
published under the action's `contextPropertyName`.

```json
{
  "name":       "computeDiscount",
  "parameterNames": [],
  "functionBody": "{ const sub = this.cart.subtotal; if (sub > 500) return 0.2; if (sub > 200) return 0.1; return 0; }"
}
```

For multi-statement logic, prefer `ArrowFunctionAction` over stuffing
an IIFE into an MScript expression: the action is named, reviewable,
and contributes to `contextPropertyName` resolution in the validator.

## Common pitfalls

- **Shadowing.** If you give an action `contextPropertyName: "session"`
  it will silently shadow `this.session`. The validator catches the
  most common shadowing via `MSCRIPT_UNDECLARED_REFERENCE` only when
  the *reference* is wrong; declaring a colliding name is a footgun
  by hand.
- **Cross-iteration reads.** `this.<contextPropertyName>` is a single
  slot that every iteration overwrites, so it only ever names the last
  step in which the action RAN: normally the CURRENT step (the LAST
  one, once the loop has finished), but a `condition` that skips a step
  leaves the previous iteration's value sitting in the slot. Inside a
  parallel loop it is worse than that: which iteration wins the slot is
  a race. Read the per-item copy
  (`this.<loopItemName>.<contextPropertyName>`) that the loop writes
  back onto the item itself whenever you mean a specific iteration.
- **Return shape.** A `LoopAction`'s return value is the array of
  step records, not the array of source items. To collect a derived
  list (e.g. discount previews), pick the field out of each step
  record afterward, or write each one back onto the loop item via
  `contextPropertyName`.
- **`this.dbResult` mid-loop.** The main CRUD operation runs *before*
  the post-operation actions; if a loop inside `afterMainCreateOperation`
  reads `this.dbResult.id`, it is the created record. If a loop runs
  earlier in the pipeline, the record does not exist yet.

## See also

- [Syntax](syntax.md): `this` binding basics.
- [MScript overview](overview.md#writing-mscript-across-languages): the
  per-language context-binding table.
- [Cookbook](cookbook.md): loop and per-item recipes.
- [Array mutation](array-mutation.md): write-side operators inside loops.
- Specification: [`LoopAction`](../../spec/LoopAction.md),
  [`IteratorAction`](../../spec/IteratorAction.md),
  [`ParallelAction`](../../spec/ParallelAction.md),
  [`ArrowFunctionAction`](../../spec/ArrowFunctionAction.md).

## Tabular import / export slot scopes

The tabular action family binds a few lexical names of its own around its
MScript slots, on top of the context (`this`) and any enclosing loop step:

| slot | names in scope |
|---|---|
| `FileToDataAction.columns[].value` | `row` (the parsed file row keyed by header), `rowIndex` (0-based data row), `existing` (null on parse) |
| `FileToDataAction.rowFilter`, `rowTransform` | `row` (the RAW record before binding), `rowIndex` |
| `FileToDataAction.afterParse` | `rows` (accepted typed rows), `rejected`, `total` |
| `UpsertBulkCrudAction.columnPolicies[].value` (`compute`) | `existing` (the stored row), `row` (the incoming row) |
| `DataToFileAction.columns[].value`, `rowFilter` | `item` (the row being written) |
| `DataToFileAction.beforeWrite`, `fileName`, `sheetLayout.title`, `sheetLayout.cells[].value` | `rows` (the projected rows) |

An empty `inputData` on a `list` api's `DataToFileAction` reads the api's own
list binding, `this.<pluralDataName>`, exactly as `afterMainListOperation`
sees it.
