---
title: ArrowFunctionAction
---

# ArrowFunctionAction

Defines an inline arrow function and stores it on the workflow context under `contextPropertyName`. Later MScript expressions in the same Business API can invoke it directly.

Use this when a transformation is needed in more than one MScript expression inside the same API and you don't want to lift it to the service library. For library-level reuse across APIs, use [`FunctionCallAction`](./function-call-action.md) instead.

## Target support

The JavaScript examples and strict typing behaviour below describe a compiler whose service language is JavaScript / TypeScript. A compiler for another language implements only the subset of function bodies it can translate faithfully, and refuses the rest. For example, a Java-targeting compiler supports a non-empty body only with at least one named parameter and a single return of a supported literal, parameter or string concatenation, such as `{ return 'Tier ' + tier; }`. It refuses callbacks, object/array literals, accumulators and general JavaScript statements with `JAVA_ARROW_FUNCTION_BODY_UNPORTABLE`, naming `actions.arrowFunctionActions[<name>].functionBody`. An empty body is a noop. See the [ArrowFunctionAction schema](../../spec/ArrowFunctionAction.md) for the target qualification.

## When to use it

- A small mapping (`tax => price * (1 + tax)`) used by two or more later actions in the same workflow.
- Pre-build a sort comparator, filter predicate, or array reducer once.
- Encapsulate a calculation that would be unwieldy as repeated MScript.
- For a function the **whole service** should be able to call, use the service library and [`FunctionCallAction`](./function-call-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md). The function is stored on `this.<contextPropertyName>`; that field is effectively required for this action.

| Property | Type | Req | Description |
|---|---|---|---|
| `parameterNames` | `String[]` | yes | Parameter names, in order. They are the arrow's own parameters, bound from the arguments of each call `this.<contextPropertyName>(...)`. Empty array means a zero-arg function. |
| `functionBody` | `Text` | yes | JavaScript function body wrapped in `{ ... }`. Use `return` to return a value. |

## Behaviour

The action is compiled to an asynchronous step whose return value is an arrow function with the declared `parameterNames` and the `functionBody`.

The action's result is the arrow FUNCTION, not a value it computed: `this.<contextPropertyName>` holds the function, and later MScript gets a value out of it only by CALLING it, `this.<contextPropertyName>(...)`. The call's arguments bind to `parameterNames` in order (`parameterNames: ["a", "b"]` and `this.byCreatedAt(x, y)` run the body with `a = x`, `b = y`); an argument the caller omits is `undefined` inside the body.

Two ways of using the function are correct: call it (`this.formatTier(this.tier)`), or hand it to code that calls it, as the comparator in the example below is handed to `sort`. Reading it as a VALUE is not: `this.formatTier` with no call, as an `addToResponseActions` `contextValue`, a `dataClauseItems` value, a `loopFor`, a `condition`, or inside an object/array literal that becomes one, puts a function where data was meant. A response silently loses the key (a JSON response drops a function-valued key), a loop throws, a condition is always true. Validation refuses that shape with `ARROW_FUNCTION_RESULT_NOT_CALLED` (ERROR; WARNING in an `addToContextActions` value, where copying the function under a second name is fine if the copy is itself called later), and the same code refuses `writeToResponse: true` on the arrow action itself. Put the CALL's result in the response instead.

A guard in front of the call is fine: in `this.formatTier && this.formatTier(this.tier)` the left operand is only tested (a function is never falsy), so the expression is the call's result. `this.formatTier || 'n/a'` is not: there the function itself is the value. If another action also writes the same context name (its own `contextPropertyName`, or an `addToContextActions` entry of that name), a reader sees whichever write ran last before it: when the workflow schedule proves that other action wrote after the arrow, the read is not reported; when the order cannot be proven (no workflow block, a loop/parallel member, the same stage position, or a rewrite in `afterMissingInstance`, which runs only when the record is missing), it is a WARNING. A second arrow action with the same context name is not such a rewrite: it stores a function too. A rewrite gated by a `condition` proves nothing either, because the workflow skips the action when the condition is false: with the literal `false` it never writes, and with any other condition the read stays reported (a WARNING when the rewrite might run); only no condition or the literal `true` counts as a proven rewrite. Giving the arrow its own context name avoids the question.

Because the arrow is defined inside an `async` method on the API manager, its `this` binds lexically to that manager. Inside `functionBody` you can read context, session, and prior action outputs (`this.session.userId`, `this.<earlierContextPropertyName>`, ...) directly: no need to pass them in as arguments. Reserve arguments for the per-call inputs that genuinely differ between invocations. See [MScript step context: Inside an ArrowFunctionAction](../mscript/step-context.md#inside-an-arrowfunctionaction) for the canonical statement of this binding.

### Strict typing

A compiler that emits strictly typed code (no implicit `any`, no emit on error) splices `functionBody` into that code as source. Ordinary JavaScript that the type checker infers too narrowly is repaired at compile time by the same chain every other embedded-JS splice runs: unannotated callback parameters get an `any` annotation, an object literal indexed by a computed key gets widened, a bare `[]` that is later pushed into gets widened. Every one of those edits is an annotation or a cast that is erased at emit, so the arrow's runtime behaviour is identical to what you wrote.

Two consequences worth knowing:

- You do **not** need to write TypeScript here. `rows.forEach(s => ...)`, `const acc = {}`, `const ids = []` are all fine.
- A body the repair passes cannot make compile **fails the build** with `StrictTsRepairError` naming `actions.arrowFunctionActions[<name>].functionBody`, before the service is built and pushed, rather than failing at run time with the failing line inside generated code.

Two shapes are refused at design time instead of repaired, because no rewrite of them is provably semantics-preserving:

- `MSCRIPT_TS_HOSTILE_CONCAT`: concatenating onto a **non-empty** array literal whose inferred element type does not admit the new element, e.g. `[{ term: ... }].concat([{ range: ... }])`. Build the list in one literal instead (`[cond ? a : null, b].filter(Boolean)`). An **empty** seed (`[].concat(...)`) is *not* refused: that one the compiler's widening handles, and the emitted code compiles.
- `MSCRIPT_TS_HOSTILE_ARGUMENTS`: calling a zero-parameter function that reads `arguments` with arguments. Declare the parameters instead: `function (...values) { ... }`.

## Example

```json
{
  "name": "defineComparator",
  "writeToResponse": false,
  "contextPropertyName": "byCreatedAt",
  "parameterNames": ["a", "b"],
  "functionBody": "{ return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); }"
}
```

A later action can use it:

```json
{
  "name": "sortReports",
  "_kind": "AddToContextAction",
  "writeToResponse": true,
  "context": [
    { "contextName": "reportsByDate", "contextValue": { "js": "[...this.reports].sort(this.byCreatedAt)" } }
  ]
}
```

## See also

- [`FunctionCallAction`](./function-call-action.md): invoke a service-library function
- [`ListMapAction`](./list-map-action.md): sugar for `Array.prototype.map` over a context array
- [`BusinessApiAction`](../../spec/BusinessApiAction.md), [MScript overview](../mscript/overview.md)
