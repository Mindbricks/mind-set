---
title: MScript cookbook
---

# MScript cookbook

A cheat sheet of MScript expressions for the situations that come up
on every project: reading context, building filters and queries,
shaping validations, deriving fields, and composing inside loops or
parallels. Copy, adjust, ship. Each recipe is a goal, an MScript
snippet, and a one-line explanation. All snippets are valid JavaScript
that pass the MScript validator. Read [Syntax](syntax.md) and
[Query reference](query-reference.md) first for the underlying rules.

> **How to author a recipe.** Each snippet below is the MScript
> *source*. An MScript slot holds a per-language source map, so the
> snippet goes under its language key:
>
> ```json
> "validationScript": { "js": "this.order.status === 'draft'" }
> ```
>
> The validator rejects a bare string (`MSCRIPT_LEGACY_STRING_FORM`).

> **Languages.** The recipes here are JavaScript, the portable default.
> If your service targets another language, these expressions still work
> unchanged: a compiler translates each one into the target (Python, Java,
> C#, Go, or Rust) and wraps it in that language's `runMScript` envelope.
> A few constructs (optional chaining, `??`, template literals) translate
> into more verbose code in some targets; where that matters, author a
> native source for the target, see
> [Multi-language MScript](syntax.md#multi-language-mscript). For the
> binding rules see
> [Writing MScript across languages](overview.md#writing-mscript-across-languages).

## What `this` binds to
Every recipe below that reads `this.<name>` assumes the *business-API*
binding: `this` is the API context (request parameters, `this.session`,
action results, the main CRUD record). A few slots are not evaluated
against that context, and the same spelling silently reads `undefined` or
does not build there:

| Slot family | What `this` is | Read fields through | Validator code |
|---|---|---|---|
| Business-API MScript (`validationScript`, `whereClause`, `dataClauseItems`, `AddToResponseAction`, ...) | the API context | `this.<param>`, `this.session.*`, `this.<actionName>`, `this.<dataObject>` | `SESSION_FIELD_UNKNOWN`, `PARAM_NAMED_SESSION` |
| `issueCondition` (invoicing) | a fresh context object with only the keys `order` and `source` (both the source row) and `payment` | `source.<field>` or `this.order.<field>` | `CONDITION_THIS_NOT_IN_CONTEXT` (error) |
| `submitCondition` (fiscalization) | a fresh context object with only the keys `invoice` and `source` | `source.<field>` or `this.invoice.<field>` | `CONDITION_THIS_NOT_IN_CONTEXT` (error) |
| Lifecycle-hook `condition` and `script` (payment, invoice, fiscal) | the hook context shared by all hooks of one dispatch; its keys depend on the trigger (invoice hooks: `invoice`, `allocation`, `creditNote`; fiscal hooks: `fiscalDocument`) | the bare binding name, e.g. `invoice.total` | `LIFECYCLE_HOOK_THIS_NOT_IN_CONTEXT` (warning) |
| Cart-to-order `transform` (`checkoutSettings.propertyMappings[].transform`) | the cart manager, not the cart or the order; only `this.userId`, `this.sessionId`, `this.clientId`, `this.requestId` are meaningful | the free variable `value` | `CART_TRANSFORM_THIS_READ` (warning) |

The condition slots are rejected at validation; the hook and cart-transform
slots only warn, so a green validation there does not prove the read works.
Details: [Invoice fiscalization chain](../capabilities/invoice-fiscalization-chain.md),
[`CartToOrderPropertyMapping`](../../spec/CartToOrderPropertyMapping.md),
[`InvoiceLifecycleHook`](../../spec/InvoiceLifecycleHook.md).

## Reading context

### Read a request parameter

```js
this.productId
```

Each entry in `requestParameters[]` is bound to `this.<name>`.

### Read a session field

```js
this.session.userId
this.session.workspaceId    // <tenantName>Id -- see the note below
this.session.tenantCodename
```

The session is populated by the auth layer. `userId` is guaranteed on any
authenticated API. `this.session` is always the caller's session: a request
parameter, or a data column an api binds as one, may not be named `session`
(validation refuses it, `PARAM_NAMED_SESSION`).

The tenant id rides the session under the name the PROJECT gave its tenant:
a project whose `tenantName` is `workspace` carries `session.workspaceId`,
one whose tenant is a `company` carries `session.companyId`. There is no
generic `this.session.tenantId` -- nothing stamps it, it reads `undefined`
on every request, and the validator reports it as `SESSION_FIELD_UNKNOWN`
naming the field you meant. The tenant CODENAME is the exception: it is
stamped under the generic `session.tenantCodename`, and ONLY under that
spelling. `this.session.workspaceCodename` is reported for exactly the reason
there is no `this.session.tenantId`: nothing writes it. (The project-named
codename does exist one level up, as the context slot
`this.workspaceCodename`, derived from the session's generic field.) Every
example below that says `workspaceId` means "your own `<tenantName>Id`".

### Read an action result

```js
this.fetchCompany.name
```

A `FetchObjectAction` with `contextPropertyName: "fetchCompany"`
publishes its result under that name on `this`.

### Read the main CRUD record

```js
this.customer.email      // by data-object name
this.data.email          // generic alias
this.dbResult.email      // raw DB result
this.result.email        // alias for dbResult
```

For list APIs, replace with the plural name (`this.customers`).

### Read an inbound Kafka event

```js
this.subjectId           // requestParameter with dataPath "id"      (record scope)
this.eventTime           // requestParameter with httpLocation "request",
                         //   dataPath "time"                        (envelope scope)
this.request.body.email  // fallback: the unwrapped record
this.request.event.old   // fallback: the raw event envelope
```

`this.<objectName>` above is a CRUD binding and is NOT how you reach an
event record, and there is no `this.event`: it is not a bound name, so a path
rooted there dereferences `undefined` and throws on every message (logged
once as `ErrorInKafkaMessage`, then dropped). Declare a `requestParameter`
with a **bare** `dataPath` instead. See
[Kafka controllers](../business-apis/kafka-controllers.md) for the
consumer-side declaration of an event-triggered business API.

### Read the pre-operation instance (Update / Delete)

```js
this.instance.status     // value in DB before the operation
```

Available in any pre-operation action (`validation`,
`afterFetchInstance`, `afterCheckInstance`).

### Use a library function

```js
LIB.dateUtils.daysBetween(this.order.createdAt, new Date().toISOString())
```

Library functions are exposed under the `LIB` global; no `this`
prefix.

## Filtering and queries

### Owner-only list

```js
({ userId: { $eq: this.session.userId } })
```

In a `fullWhereClause`. Top-level shorthand `({ userId: this.session.userId })`
is equivalent.

### Tenant-scoped list

```js
({ workspaceId: { $eq: this.session.workspaceId } })
```

Both halves are the project's own tenant name: the column the object carries
and the session field the auth layer stamps.

### Case-insensitive name search

```js
({ name: { $ilike: `%${this.searchKeyword}%` } })
```

Template literals work because MScript is JavaScript.

### Date range

```js
({ createdAt: { $between: [this.startDate, this.endDate] } })
```

### Status whitelist

```js
({ status: { $in: ['draft', 'published'] } })
```

### Compose AND / OR

```js
({ $and: [
    { workspaceId: { $eq: this.session.workspaceId } },
    { $or: [
        { status:  { $eq: 'published' } },
        { ownerId: { $eq: this.session.userId } }
    ] }
] })
```

### Build the query in a library function

```js
LIB.buildProductSearchQuery(this.searchKeyword, this.session.workspaceId)
```

Use when the query is non-trivial or reused across APIs. Library
functions are easier to unit-test than inline MScript.

### Conditional clause via extended clause

```json
{
  "condition":   { "js": "!!this.session.workspaceId" },
  "whereClause": { "js": "({ workspaceId: { \"$eq\": this.session.workspaceId } })" }
}
```

Apply only when the condition is true. Use the extended-clause shape
instead of branching inside the MScript itself.

## Validation

### Bool predicate

```js
this.customer.userId === this.session.userId
```

A `ValidationAction.validationScript` returns truthy to pass.

### Owner-or-admin

```js
(this.customer.userId === this.session.userId) ||
  [].concat(this.session?.roleId ?? []).includes('admin')
```

### Subscription tier gate

```js
['Pro', 'Enterprise'].includes(this.tenant.subscriptionLevel)
```

Use with `checkType: "liveCheck"` to hard-fail.

### Throw a typed 4xx

```js
(() => {
  if (this.data.amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }
  return true;
})()
```

`BadRequestError`, `NotAuthenticatedError`, `ForbiddenError`,
`NotFoundError`, `ConflictError`, and `UnprocessableEntityError` carry
a `status` in the 4xx range; `runMScript` re-throws them verbatim so
the status reaches the response. Anything else gets rewrapped as 500.
The error classes resolve at the call site without any manual import.

### Cross-field rule

```js
this.data.startDate < this.data.endDate
```

### Stats-based limit

```js
this.orderStats.count < 5
```

Pair with a `FetchStatsAction` that publishes the count as
`orderStats`.

## Permission checks

### Ownership

```js
this.target.createdBy === this.session.userId
```

### Role test

```js
[].concat(this.session?.roleId ?? []).includes('admin')
```

The validated session field is **`roleId`**: a string for a single-role
session and an ARRAY when the project sets `usersHaveMultipleRoles` (the
validator rejects `this.session.roles` with `SESSION_FIELD_UNKNOWN`). The
`[].concat(... ?? [])` idiom normalizes string, array and anonymous (no
session) alike, so one form covers every case. See
[Session-aware logic](../composition/session-aware-logic.md).

### Tenant membership

```js
this.target.workspaceId === this.session.workspaceId
```

### ABAC composite

```js
this.target.createdBy === this.session.userId ||
  [].concat(this.session?.roleId ?? []).includes('admin')
```

## Transformations

The examples in this section use the business-API binding: `this.data` is
the main CRUD record and `this.cart` is an action result published by a
fetch action with `contextPropertyName: "cart"`. They are **not** valid in a
cart-to-order `transform`, an `issueCondition` / `submitCondition`, or a
lifecycle hook, where `this` binds differently (see
[What `this` binds to](#what-this-binds-to)).

### Optional-chain default

```js
this.session.user?.profile?.preferredLanguage ?? 'en'
```

`??` over `||` to preserve falsy-but-valid values (`0`, `false`, `""`).

### Conditional default value

```js
this.data.kind === 'trial'
  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  : null
```

### Discount tier (nested ternary)

```js
this.cart.subtotal > 500 ? 0.20
  : this.cart.subtotal > 200 ? 0.10
  : 0
```

Acceptable up to ~4 branches; beyond that, prefer
`ArrowFunctionAction` or a service-library function. Here `this.cart` is a
fetched cart in a business API. In a cart-to-order transform the same idea
reads the mapped cart property as `value`, never `this.cart`:

```json
{
  "cartProperty": "subtotal",
  "orderProperty": "amountCents",
  "transform": { "js": "Math.round(Number(value) * 100)" }
}
```

`this.cart.subtotal` there reads the cart manager, not the cart, and is
reported as `CART_TRANSFORM_THIS_READ`.

### Derived field via `dataClauseItems`

```json
{ "name": "lineTotal", "value": { "js": "this.unitPrice * this.quantity" } }
```

Computed at write time on every create / update of the parent data
object.

### Guard an automatic trigger (condition and hook slots)

```json
{ "issueCondition": { "js": "source.buyerType === 'B2B'" } }
```

```json
{ "submitCondition": { "js": "source.country === 'TR'" } }
```

The first is a fragment of [`InvoicingConfig`](../../spec/InvoicingConfig.md),
the second of [`FiscalizationConfig`](../../spec/FiscalizationConfig.md).

The guard's `this` has only the keys listed in the binding table, so
`this.buyerType` reads `undefined` and every event is skipped. The
validator refuses it as `CONDITION_THIS_NOT_IN_CONTEXT`; write
`source.buyerType` (or `this.source.buyerType`). A lifecycle-hook
`condition` / `script` follows the same rule with its own binding names
(`invoice.total`, not `this.total`), reported as
`LIFECYCLE_HOOK_THIS_NOT_IN_CONTEXT`.

### Net amount with floor (multi-step IIFE)

```js
(() => {
  const net = this.grossAmount - this.discountAmount;
  return Math.max(net, 0);
})()
```

### Tax via library

```js
LIB.calcVat(this.netAmount, this.vatRate)
```

## Lists and aggregates

### Sum line totals

```js
this.cart.items.map(i => i.qty * i.price).reduce((a, b) => a + b, 0)
```

### Pick the first matching item

```js
this.order.items.find(i => i.sku === 'PROMO-2025')
```

### Filter then map

```js
this.users.filter(u => u.isActive).map(u => ({ id: u.id, name: u.name }))
```

### Cursor from a list

```js
this.items.length === 0 ? null : this.items[this.items.length - 1].id
```

### Shape a response with `AddToResponseAction`

```js
({
  id:    this.loadOrder.id,
  total: this.loadOrder.total,
  items: this.loadItems.map(i => ({ id: i.id, title: i.title, qty: i.qty }))
})
```

## Loop and parallel context

### Reference the current loop item

```js
this.item.id
```

`item` is the default; if the loop sets `loopItemName: "customerItem"`,
use `this.customerItem.id`. `this.crudItem` is always available as an
alias, regardless of the configured name.

### Reach into a parent-scope action result from inside a loop

```js
this.item.total > this.cartLimit.max
```

Parent context (request parameters, session, prior action outputs) is
fully visible inside loop iterations.

### Read an inner-action result from a sibling step

Inside a `LoopAction`, each inner action with a `contextPropertyName`
writes its result back onto the loop item itself. Sibling inner actions
later in the same iteration read the value off the item, not off a
global step register:

```js
this.item.calculatePrice
```

If you declared `loopItemName: "customerItem"`, use
`this.customerItem.calculatePrice`; `this.crudItem.calculatePrice` is
the universal alias. See [Step context](step-context.md) for the full
mechanics and the parallel-loop caveats.

## Across languages

The recipes above are JS. A compiler translates each one for the other
targets: the binding root is `this` in JS/Java/C#/Go, `self` in Python,
and indexed JSON-value access in Rust; equality (`===`) becomes a value
comparison in every target, and template literals become the target's own
string formatting. Recipes that lean on optional chaining or `??` (for
example the [optional-chain default](#optional-chain-default)) translate,
but the output for some targets is verbose (nested null-guards or an
IIFE). For those, prefer authoring a native source for the target; see
[Multi-language MScript](syntax.md#multi-language-mscript). The exact
translations belong to each compiler; see
[the compiler specification](../../compiler/index.md).

## See also

- [Syntax](syntax.md): what's allowed in an MScript expression.
- [MScript overview](overview.md#writing-mscript-across-languages): the
  per-language context-binding table.
- [Query reference](query-reference.md): the `$`-operator filter sub-language.
- [Step context](step-context.md): `this` inside loops and parallels.
- [Array mutation](array-mutation.md): write-side `$add` / `$rem` / `$addIf`.
- [Numeric mutation](numeric-mutation.md): write-side `$inc` / `$dec` / `$incIf`.
- Specification: [`MScript`](../../spec/MScript.md),
  [`ValidationAction`](../../spec/ValidationAction.md),
  [`FetchStatsAction`](../../spec/FetchStatsAction.md),
  [`ListMapAction`](../../spec/ListMapAction.md).
