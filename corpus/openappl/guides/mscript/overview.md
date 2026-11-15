---
title: MScript overview
---

# MScript overview

**MScript is an expression embedded in JSON, tagged with the language it
is written in.** Every MScript slot holds a per-language source map,
`{ "js": "<expr>" }` for the portable default, parsed and analysed at
design time, and evaluated by the generated service inside a
`runMScript()` envelope. It is the only place you write code inside a
blueprint; everything else is data.

```json
"validationScript": { "js": "this.user.age > 18" }
```

> The language descriptor is required. The validator rejects a bare
> string (`MSCRIPT_LEGACY_STRING_FORM`), and a migration step rewrites
> a bare string in an existing blueprint to `{ "js": <expr> }`.

Each source in the map must parse as an expression in its own language;
the `js` source must be a JavaScript `ExpressionStatement`: a literal,
identifier, expression, call, or a `module.exports = ...` assignment whose
right-hand side is a valid expression. Anything that fits there is
accepted; there is no narrowed grammar. It is "JavaScript with a
runtime envelope", not a custom DSL.

## Expressions and target languages

MScript is a JavaScript-flavoured expression language evaluated by the
generated service. A compiler targets one or more programming languages,
so an expression is written in a target language flavour, and a compiler
may convert it to another target: a `js` source is the portable form that
a compiler can translate for services in other languages, while a source
in the service's own language is used as written. Authors should
therefore stay within the portable subset the guides document (see
[MScript syntax](syntax.md), [Query reference](query-reference.md),
[Numeric mutation](numeric-mutation.md) and
[Array mutation](array-mutation.md)) and reach for a language-native
source only when the service's language is decided and the portable subset
is not enough. The next sections describe the source map and how a source
reaches a target language.

## Empty vs authored

A slot is **empty** when no language source carries a non-blank string.
All of these mean "nothing authored here":

```json
null
""            "   "
{}
{ "js": null, "ts": null, "python": null, "go": null,
  "java": null, "csharp": null, "php": null, "rust": null }
{ "js": "", "java": "  " }
```

The last two matter more than they look. The all-null envelope is what
an authoring tool writes for a field you have not touched, and it is a
plain **object**, so `if (slot)` is true for it. A slot declared
`required` reports `REQUIRED_FIELD_MISSING` for every shape above,
including that scaffold.

A value of a shape the slot cannot hold (a number, a boolean, an array,
or an envelope with a non-string source) is an `INVALID_FIELD_TYPE`,
not a missing value.

## The runtime envelope

Every call site in the generated service wraps an MScript expression in
`runMScript(() => expr, { path })`. The envelope is a structural
try/catch that branches on `e.status`:

- If the thrown error carries a numeric `status` in the range
  `400-499`, it is re-thrown verbatim. Typed rejections
  (`BadRequestError`, `NotAuthenticatedError`,
  `ForbiddenError`, `NotFoundError`, `ConflictError`,
  `UnprocessableEntityError`) propagate this way because their
  constructors set `status` to the matching 4xx code; the envelope
  does not inspect class names.
- Anything else (a `TypeError`, a `ReferenceError`, an error without
  `status`, or a 5xx) is rewrapped as a plain `Error`
  whose message reads `[MScript <path>] <original message>`. The path
  identifies the call site in the blueprint tree for log triage.

That's the whole runtime overhead. The envelope relabels errors only; it is
not a sandbox (see [the trust model](trust-model.md)).

## Where MScript appears

Anywhere the schema declares a property of type `MScript`. Common
sites:

| Site | What you write |
|------|----------------|
| `ValidationAction.validationScript` | Boolean expression: returns `true` if valid. |
| `AddToContextAction.context[].value` | Any value expression. |
| `BusinessApiAction.condition` | Boolean expression gating the action. |
| `CheckoutConfig.mapPaymentResultToOrderStatus.*` | Per-outcome expression that resolves to a status string. |
| `BusinessApi.query.dataClauseItems[].value` | Field-write payload at create/update time. |
| `AiCallAction.userPrompt` | Per-call user prompt expression. |

For full function bodies (multi-statement, loops, control flow), use
`ArrowFunctionAction`; see [Step context](step-context.md).

## Context access: `this.X`

The runtime context is a plain object bound as `this` inside the
expression. Common keys:

```js
this.data        // request body / parameters
this.session     // authenticated session (userId, tenantId, roles, ...)
this.<paramName>   // each entry from BusinessApi.requestParameters
this.<actionName>  // result of the named action's contextPropertyName
```

The exact shape depends on the API's request shape and which actions
populate it via their `contextPropertyName`. See
[Workflow context](../workflow/workflow-context.md) for the field
reference.

```js
this.data.amount * 0.1
this.session.userId
this.fetchedOrder.status === 'paid'
```

Don't reach for a `@`-prefixed syntax: that isn't MScript. Plain
property access against `this` is the entire surface.

## Writing MScript across languages

A service is generated in exactly one language. That language is chosen
by the compile request, not by the blueprint, and the source map decides
how each slot reaches that language:

- **A `js` source** is the portable default. A compiler translates each
  JS expression into the service's target language (the schema names
  `java`, `python`, `csharp`, `go` and `rust` as translated targets); a
  JavaScript target uses the `js` source directly. Author `js` when
  **the service's language isn't decided yet**: the same expression can
  compile to any target with no rewrite.
- **Not `ts`.** `ts` is a legal source key and is linted, but no compile
  target reads it. A `ts`-only MScript is never emitted.
- **A source in the service's own language** (add the matching key; see
  [Multi-language MScript](syntax.md#multi-language-mscript)). Once the
  language *is* chosen, this is **recommended for performance**: the
  source is used as written, with no translation step, and what you read
  matches what is generated.

An MScript that offers a service's language neither its own source nor a
`js` source is refused at design time
(`MSCRIPT_NO_SOURCE_FOR_TARGET_LANGUAGE`) rather than silently dropped
from the generated service.

### Context binding per language

`this` is the context root in a `js` source. When a compiler translates
it, the context binding is rewritten to the target language's idiomatic
form, so the *same* `js` MScript reads differently in the generated code:

| Language | Binding token | Notes |
|---|---|---|
| **JavaScript / TypeScript** | `this` | The source is used as written. |
| **python** | `self` | The only target that renames the binding. |
| **java**, **dotnet (C#)**, **golang**, **rust** | `this` | Member access is expressed with the language's own accessors (map or dictionary access, a value model). |

A language-native source must use the names, accessors and result types
available where it is spliced into the generated service. Equality
shows why a translation is more than string substitution: `===` in a
`js` source means value equality, so targets with reference equality on
boxed objects route it through a value-equality comparison. The
translators cover the common expression subset; a construct that does
not map cleanly to a target emits a best-effort approximation **and a
translation warning**. For those, author a source in the target
language. The exact translations belong to each compiler; see
[the compiler specification](../../compiler/index.md).

## What's available

Because MScript is parsed as a JavaScript expression, every standard
JS built-in works: `Math`, `String` methods, array methods (`map`,
`filter`, `reduce`, `find`, `some`, `every`), `Object`, `Number`,
`JSON`, `Date`, etc. No special "MScript built-ins" exist on top; the
service's own helpers live on `LIB.common` (below).

Conventions:

- Don't reach for `Date.now()` for the request time: there isn't a
  "request now" beyond `new Date()`. If you need a
  pinned timestamp, fetch it once via `AddToContextAction` and reuse.
- For complex logic that spans multiple statements, use
  `ArrowFunctionAction` rather than chaining MScript expressions.

## What it is NOT

- Not a separate DSL with its own grammar.
- Not a sandboxed "safe subset" with custom built-ins. The service's
  helpers are reached through `LIB.common`, its common package:
  `LIB.common.slugify(text, { locale, separator, maxLength })` turns a
  title into a URL slug (`tr` and `de` locale maps), and, on a JavaScript
  service, `LIB.common.md5(text)` hashes. Anything else (`addDays()`, a
  custom `hash()`) is a service library function you define and call as
  `LIB.<name>(...)`.
- Not gated by a static type checker: only by the host language's
  type system applied to the *generated* code. Errors surface at
  validation and at runtime via `runMScript`.

> **`LIB.fn` on a non-JavaScript service.** A `LIB.fn(...)` call is
> synchronous and in-process on a JavaScript service. If the service is
> generated in another language and the function is **authored in
> JavaScript or TypeScript**, the call may cross a language boundary and
> carry the latency of a network round-trip; functions authored in the
> service's own language run natively. See
> [the compiler specification](../../compiler/index.md).

## When to write more than one expression

If you find yourself stuffing multi-line logic into an MScript string,
stop and reach for `ArrowFunctionAction`. Same envelope, multi-line
body, more reviewable.

```json
{
  "name":       "computeDiscount",
  "parameterNames": [],
  "functionBody": "{ const sub = this.cart.subtotal; return sub > 100 ? sub * 0.1 : 0; }"
}
```

Note: this is a real `ArrowFunctionAction` with the actual `parameterNames`
+ `functionBody` fields.

## Where to next

- [Syntax](syntax.md): what's allowed in an MScript expression, plus
  the multi-language source form.
- [Step context](step-context.md): how `this` is shaped inside
  loops and parallels (and what the binding is called per language).
- [Trust model](trust-model.md): what an MScript expression can reach.
- Specification: [`MScript`](../../spec/MScript.md),
  [`ArrowFunctionAction`](../../spec/ArrowFunctionAction.md),
  [`AddToContextAction`](../../spec/AddToContextAction.md),
  [`ValidationAction`](../../spec/ValidationAction.md).
