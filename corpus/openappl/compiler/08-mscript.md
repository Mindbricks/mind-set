---
title: MScript
---

# 8. MScript

Wherever a blueprint needs a **value** rather than a structure (a condition, a mapping, a
where clause, a computed field), the property is typed [`MScript`](../spec/MScript.md).
MScript is not a language of its own. A slot holds an expression **of the target
language**, keyed by that language, and the compiler emits it into the generated code.
The name stands for the slot and its documented environment, not for a syntax.

This chapter specifies how a compiler treats these slots: which source it uses, what the
expression can see, how it is evaluated and how its failures surface.

## 8.1 Slot values

An MScript value is a JSON object that maps a language key to an expression string:

```json
{ "js": "this.session.userId === this.order.ownerId" }
```

| Key | Language | Aliases accepted |
|---|---|---|
| `js` | JavaScript (the portable reference source) | |
| `ts` | TypeScript | |
| `python` | Python | `py` |
| `go` | Go | `golang` |
| `java` | Java | |
| `csharp` | C# | `cs`, `dotnet` |
| `rust` | Rust | `rs` |

- A slot is **empty** when no key carries a non-blank string. An empty required slot is a
  validation error.
- A bare string instead of an object is a validation error.
- An unknown key is a validation error.

> **To verify:** the reference also accepts the key `php` for archived projects; it is
> not a compile target. Whether OpenAPPL lists it is an owner decision.

## 8.2 Choosing the source

For a service compiled to language `L`:

1. If the slot has a source for `L`, the compiler **MUST** use it verbatim.
2. Otherwise, if the slot has a `js` source and the compiler has a converter from
   JavaScript to `L` (8.7), it **MAY** convert it.
3. Otherwise the compiler **MUST** refuse the blueprint at compile time, naming the path
   of the slot. It **MUST NOT** emit a constant, a stub or nothing in place of the
   expression.

Rationale: an expression is a business rule. A compiler that drops one silently changes
the system the reviewer approved.

## 8.3 Form

An MScript source is **one expression** of its language, as it could stand on the right
side of an assignment.

- In JavaScript: literals, the bound names of 8.4, member access, optional chaining (`?.`),
  nullish coalescing (`??`), operators, conditional expressions, object, array and
  template literals, calls, arrow functions, and an arrow-function call as the escape for
  several statements. Statements, `import`, `require` and reading the process environment
  are not allowed.
- An expression **MAY** use `await`. The compiler **MUST** then evaluate the slot
  asynchronously.
- Logic too large for one expression belongs in a library function
  ([`ServiceLibrary`](../spec/ServiceLibrary.md)), called from the expression through
  `LIB`.

A compiler **MUST** parse every source with its language's parser at compile time and
refuse sources that do not parse. It **MUST NOT** evaluate a source at compile time.

> **To verify:** one reference page says a top-level `await` is not allowed; the reference
> compiler accepts it and makes the slot asynchronous. This chapter follows the compiler.

## 8.4 The environment

Every slot has a documented set of names it may read. The set depends on the **slot
family**; Part 2 states the family of each MScript property. A name outside the family's
set is a validation error.

The common names, in their JavaScript spelling:

| Name | Meaning |
|---|---|
| `this` | the request context of the business API: its parameters (`this.<param>`), its session (`this.session`), the record being worked on (`this.<objectName>`, `this.instance` before the change), results of earlier actions (`this.<contextPropertyName>`), the main result (`this.dbResult`) |
| `LIB` | the service library: `LIB.<functionName>(…)` for authored functions, plus `LIB.common`, `LIB.dataViews` and `LIB.serviceFiles` ([12.4](12-derived-surface.md#124-library-surface)) |
| `API` | in-process calls to the service's own APIs that allow it: `API.<apiName>(params)` |

Main families:

| Slot family | Names |
|---|---|
| Business API actions, parameters, where clauses, data clause items | `this`, `LIB`, `API` (inside loops also the loop item name and the step context) |
| Select-join conditions | the above plus `data` (the parent record) |
| Realtime hub and video room scripts | `room`, `user`, `record`, `session`, `message`, `data`, `LIB`, `API`; no `this` |
| Event notifications | `this` (the event: `payload`, `old`, `actor`), `data`, `LIB`, `API` |
| Event subscription scripts | `session`, `topicName`, `dataObjectName`, `data`, `event`; no `this`, `LIB` or `API` |
| Attribute rules (ABAC) | `subject`, `object`, `env`, `LIB`, `API` |
| Bucket access scripts | `this`, `session`, `userId`, `role`, `params`, `query`, `body`, `data`, `LIB`, `API` |

The language's own built-ins (in JavaScript: `Math`, `JSON`, `Date`, `Object`, array and
string methods) are always available. No third-party helper library is bound.

**Per-language spelling.** The standard fixes how each language spells the common
environment, so that an expression means the same thing in every language. The
reference spells the context root `this` in JavaScript, Java, Go and Rust, and `self` in
Python, and reads members through the target's dynamic access helpers where the language
is statically typed.

> Generated table goes here (S9): the full slot-family table, per MScript property, and
> the per-language spelling of every common name.

## 8.5 Evaluation

- An expression **MUST** have the semantics of its own language. In particular, a `js`
  source keeps JavaScript truthiness, `null`/`undefined` distinction and `===` equality,
  also when converted (8.7).
- Slots of most families are compiled into the service. Slots of realtime hubs, video
  rooms and event subscriptions are kept as source and evaluated per event at run time;
  their observable result **MUST** be the same.
- A failure inside an expression **MUST** be handled as follows:

| The expression throws | The API answers |
|---|---|
| an error that carries an HTTP status 400–499 | that status and message, unchanged |
| an error explicitly marked as a retryable 503 | 503 |
| anything else | 500; the logged error names the blueprint path of the slot |

Rationale: an author can raise a typed refusal from an expression, and every other runtime
failure points back to the place in the blueprint that caused it.

- In an event-subscription script, a failure **MUST** fail closed: the topic is refused or
  the event is dropped, never delivered.

Rule example:

```json
{ "condition": { "js": "this.order.total > 1000" } }
```

on a validation action of `approveOrder`: when `total` is 1500 the condition is true and the
action runs. If `this.order` is missing because an earlier action failed, the API answers
500 and the log names `…actions.validationActions[0].condition`.

## 8.6 Trust model

- MScript is **not sandboxed**. It runs inside the generated service with the service's
  privileges. The security boundary is who may author and deploy a blueprint.
- A compiler **MUST NOT** generate code that evaluates an expression taken from run-time
  input (a request body, a database row written by users, a tenant setting). Values that
  users can change at run time are data: field paths and pick maps, never expressions.
- A compiler **MAY** add isolation or time limits. They are not required, and they
  **MUST NOT** change the result of an expression that completes.
- A compiler **SHOULD** warn at compile time about patterns that are likely to hang, such
  as regular expressions with catastrophic backtracking.

## 8.7 Conversion between languages

A compiler **MAY** ship a converter that turns a `js` source into its target language.
The converter is a compiler feature, not part of the standard.

- A converted expression **MUST** have the same result as the `js` source under the
  environment correspondence of 8.4, for every input.
- A construct the converter cannot translate exactly **MUST** be reported at compile
  time with the blueprint path. The compiler **MUST** either refuse the slot or emit an
  approximation together with that warning; it **SHOULD** let the author turn such
  warnings into refusals.
- A native source for the target always wins over conversion (8.2).

The reference converts JavaScript to Java, Python, C#, Go and Rust, keeps JavaScript
truthiness and equality through runtime helpers, and writes the converted corpus next to
each generated service for audit.

> **To verify:** that the reference's Python and Rust conversions keep JavaScript
> truthiness for empty arrays and objects. Also open: whether a library function written
> in JavaScript is callable from a service in another language (one reference page says it
> is bridged, another that it becomes a failing stub).

## 8.8 Query expressions

Where clauses and list filters are MScript slots whose value is a **query object** in a
small, document-style filter language (MQuery): field names mapped to values or to
operators such as `$eq`, `$ne`, `$in`, `$gt`, `$lt`, `$isNull`, combined with `$and`,
`$or`, `$not`.

```json
{ "fullWhereClause": { "js": "({ status: { $eq: 'open' }, ownerId: this.session.userId })" } }
```

- The compiler **MUST** translate a query object to the engine of the service (and to the
  search engine for projection reads) with the same meaning on every engine.
- An empty `$in` list matches nothing; it is a filter, not an omission.
- Unknown operators are validation errors.

> Generated table goes here (S9): the operator catalogue with its cross-engine semantics.
