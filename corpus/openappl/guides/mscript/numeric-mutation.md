---
title: Numeric mutation
---

# Numeric mutation

The standard `dataClause` shape for an update writes a **value**: `soldCount: 12` sets the
column to 12, whatever it held before. To *add to* what the row already holds (a counter, a
stock level, a quota, a balance) OpenAPPL recognises three `$`-prefixed numeric operators,
the twin of the [array mutation](array-mutation.md) operators.

They are **not** the same mechanism, and the difference is the whole point. The array
operators are resolved in the application layer (read the row, compute the next array, write
it back). The numeric operators are lowered into the statement:

```sql
UPDATE "ticketTypes"
   SET "soldCount" = COALESCE("soldCount", 0) + 3
 WHERE "id" = $1 AND "soldCount" <= "capacity" - 3
```

One statement. The read of `capacity` and the write of `soldCount` cannot be interleaved by
another request, because **the atomicity is the database's**, not the application's. On
MongoDB the same clause becomes an update pipeline,
`[{ $set: { soldCount: { $add: [{ $ifNull: ['$soldCount', 0] }, 3] } } }]`, with the guard
in an `$expr` filter: one document-level atomic write. (`COALESCE` and `$ifNull` are the
NULL rule below.)

## Where it applies

Any update path that writes through a generated `dataClause`:

- the by-id write: the main write of an update API (`crudType: "update"`), authored as a
  `dataClauseItems` row
- the by-MQuery write: what an `UpdateCrudAction` performs, authored as a row of the
  action's `dataClause`
- the generated service's guarded-update helper, the programmatic face for library and
  custom code (see [From library or custom code](#from-library-or-custom-code))

On a create api or a `CreateCrudAction` the operators are refused at validation
(`NUMERIC_MUTATION_NOT_ON_UPDATE`): a new row has no value to add to.

The bulk update by id list **refuses** the operators by name. It resolves an affected-row
count and no rows, so an increment there could be neither projected to Elasticsearch nor
evented nor refused per row.

Everything the ordinary update path does still happens: the Elasticsearch projection, the
`-dbevent-` update event, the query and entity caches, the after-update seam. That is the
reason these operators exist inside the data layer instead of as hand-written SQL.

## Operator catalogue

| Operator | Behaviour | Operand |
|---|---|---|
| `$inc` | `column = column + n`. `n` may be negative. | Number |
| `$dec` | `column = column - n`. Exactly `$inc` with the sign flipped. | Number |
| `$incIf` | The same increment, executed only for rows that satisfy `when` at write time. Zero rows changed is a **typed refusal**. | `{ by, when }` |

One operator key per column. `{ n: { $inc: 1, $dec: 1 } }` is refused rather than
resolved: combine the amounts yourself.

The column must be **numeric** (`Integer`, `Short`, `Double`, `Float`, `Decimal`) and not an
array. On a `Decimal` column the operand (and an `$incIf`'s `by`, so also the `'$by'` a guard
reads) is rounded half-even to the column's `decimalScale` when the mutation is planned:
`$inc: 0.105` on a `Decimal(2)` column adds `0.10`. The assignment itself also rounds inside
the database, in the same atomic statement, because a `Decimal` is stored as a `Double` and
two on-scale doubles can add to a binary tail (`1.1 + 0.1` is `1.2000000000000002`):

| Engine | Assignment on a `Decimal(s)` column |
|---|---|
| Postgres | `SET x = ROUND((COALESCE(x, 0) + n)::numeric, s)::double precision` |
| MySQL / SQLite | `SET x = ROUND(COALESCE(x, 0) + n, s)` |
| MongoDB | an update pipeline `[{ $set: { x: { $round: [{ $add: [{ $ifNull: ['$x', 0] }, n] }, s] } } }]` |

SQL `ROUND` is half-away-from-zero, not half-even, but it cannot matter here: both operands
carry at most `s` fractional digits, so their exact sum does too, and the rounding only
removes the binary tail. The validator refuses `$inc` on anything else while the blueprint
is being authored (`NUMERIC_MUTATION_ON_NON_NUMERIC_PROPERTY`, on an api's `dataClauseItems`
and on a crud action's `dataClause` alike), and the runtime refuses it again against the
model's own attribute types (a 400 `NUMERIC_MUTATION_INVALID`).

```js
{ soldCount: { $inc: 3 } }
{ stock:     { $dec: 1 } }
```

Other columns in the same clause are written normally and ride the same statement:

```js
{ soldCount: { $inc: 1 }, lastSoldAt: 'now()' }
```

### A NULL counter counts as 0

A NULL counter counts as 0: `$inc: 3` on a row whose `soldCount` is NULL stores 3, and
`$dec: 2` stores -2. The rule is the same on every engine and for every numeric type,
`Decimal` included:

| Engine | Assignment (`n` is the signed amount) |
|---|---|
| Postgres / MySQL / SQLite | `SET x = COALESCE(x, 0) + n` |
| MongoDB | an update pipeline, `{ $add: [{ $ifNull: ['$x', 0] }, n] }`; `$ifNull` covers a `null` field and a missing one alike |

Without it the engines would disagree: SQL's `NULL + n` is NULL, so the statement would
report a changed row and silently lose the increment, and MongoDB's native `$inc` is refused
by the server on a field holding `null`. That is why the MongoDB lowering is always a
pipeline and never `$inc`: no generated field is guaranteed non-null there (on MongoDB
`isRequired` is a validator that runs when a document is saved, and the generated update
helpers do not run it). Update pipelines need **MongoDB 4.2 or later**; older servers refuse
every numeric mutation.

The NULL rule is about the **assignment** only. An `$incIf` guard compares the value the row
actually holds, so a NULL counter meets a guard as NULL, not as 0; see
[A guard on a NULL counter](#a-guard-on-a-null-counter).

## `$incIf` and the `$col` column reference

`$incIf` takes a `when` condition, an ordinary [MQuery](query-reference.md), which is
**ANDed into the WHERE of the update itself**. It is not evaluated before the write and
re-checked after; there is no window.

To express a capacity predicate the condition has to compare a column to *another column*,
which MQuery does through a deliberately bounded operand:

| Form | Meaning |
|---|---|
| `{ "$col": "capacity" }` | the value of the `capacity` column of the same row |
| `{ "$col": "capacity", "$minus": 3 }` | `capacity - 3` |
| `{ "$col": "capacity", "$plus": 10 }` | `capacity + 10` |

**Bounded** means: one column, at most one additive constant, nothing else. No nesting, no
functions, no arithmetic between two columns. It is legal only as the right-hand side of
`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`.

**Guard-only** means: `$col` is honoured inside a `$incIf` `when` and the guarded-update
helper's `when`, and **refused everywhere else**: a `whereClause`, a list filter, a value a
caller sent. The operand position is exactly where a caller's filter value lands (the
dynamic filter hands `{"operator":"lt","value":…}` straight through), so a `$col` honoured
there would let any caller compare a filterable field against any other column of the row,
hidden ones included. Anything larger would be an expression language, and
[MScript is expression-only](syntax.md): it does not compile `x = x + 1` into SQL, because
that would hide the atomicity contract behind something that looks like assignment.

Inside a `$incIf` guard, `$plus` / `$minus` also accept the literal token `"$by"`, which
resolves to that step's amount, so the quantity is authored once:

```js
{ $incIf: { by: 3, when: { soldCount: { $lte: { $col: 'capacity', $minus: '$by' } } } } }
```

as the value of the `soldCount` column reads as `soldCount + by <= capacity` and lowers to
`WHERE ... AND "soldCount" <= "capacity" - 3`.

Outside a `$incIf` guard, `"$by"` has no value and is refused by name rather than coerced
to zero.

### A guard on a NULL counter

The guard is not rewritten by the NULL rule: it compares the stored value, and a NULL
compared with anything is UNKNOWN, as in SQL. The guard qualifies a row only when it is
TRUE, and `NOT UNKNOWN` is still UNKNOWN. A `$incIf` on a NULL counter whose guard compares
the counter, negated or not, is therefore refused with the **409**, on every engine:

| Guard on a NULL `soldCount` | Postgres / MySQL / SQLite | MongoDB |
|---|---|---|
| a `$col` operand, any of `$eq` `$ne` `$gt` `$gte` `$lt` `$lte`: `{ soldCount: { $lte: { $col: 'capacity', $minus: '$by' } } }` | UNKNOWN, row not changed: **409** | the `$expr` requires both operands present and non-null: **409** |
| a literal operand, `$lt` `$lte` `$gt` `$gte` `$eq`: `{ soldCount: { $lt: 10 } }` | **409** | a null is not compared with a number: **409** |
| a literal `$ne` / `$nin` (any spelling, e.g. `$notIn`): `{ soldCount: { $ne: 7 } }` | UNKNOWN: **409** | the guard adds `{ soldCount: { $ne: null } }` beside it: **409** |
| any of the above under a negation: `{ $not: { soldCount: { $gt: 9 } } }`, `$nor`, a field-level `$not` | `NOT UNKNOWN` is UNKNOWN: **409** | the negated comparison also holds for a null operand, so the negation refuses it: **409** |
| `{ soldCount: { $eq: null } }` | `IS NULL` holds: stores `n` | holds: stores `n` |

The same holds for the referenced column: a NULL `capacity` makes
`soldCount <= capacity - 3` UNKNOWN, so the write is refused. The MongoDB lowering of
`$col` spells that out on purpose: a bare `$expr` comparison sorts null *below* every
number, so without it a NULL counter would pass `soldCount <= capacity - 3` even with
`capacity` 2 and store 3.

A literal `$ne` / `$nin` follows the same rule **inside a guard**: a NULL or missing field
does not match. Outside a guard (a `whereClause`, a list filter) `$ne` / `$nin` keep the
general MQuery NULL carve-out described in the [query reference](query-reference.md):
MongoDB selects a null where SQL does not.

How MongoDB is made to give SQL's answer: MongoDB has no UNKNOWN, so the generated guard
decides, per comparison, which of TRUE / FALSE UNKNOWN stands for, by counting the
negations around it (`$not`, `$nor` and a field-level `$not` each count one):

- **not negated**: UNKNOWN is FALSE. A positive comparison already rejects a null on
  MongoDB. A negative one (`$ne`, `$nin`, `$nlike`, ...) gets `{ field: { $notnull: true } }`
  beside it. A `$col` comparison requires both operands non-null.
- **negated**: UNKNOWN is TRUE, so the negation around it refuses the row. The comparison
  becomes `{ $or: [<comparison>, { field: { $isnull: true } }] }`, plus
  `{ <column>: { $isnull: true } }` for a `$col` operand.

A field-level `$not` counts whatever its operand: an operator map, a value
(`{ soldCount: { $not: 7 } }` is `NOT (soldCount = 7)`) or a list
(`{ soldCount: { $not: [7, 9] } }` is `NOT (soldCount IN (7, 9))`). Inside a guard `$exists`
/ `$nexists` mean "is not NULL" / "is NULL", as they do on SQL, so an explicit null and a
missing field give the same answer; outside a guard MongoDB keeps its presence test.

A compound operator map is an AND of its comparisons. Under negation, each comparison gets
its own null terms. For example,
`{ $not: { soldCount: { $gt: { $col: 'capacity' }, $lt: 0 } } }` with `soldCount` 0 and
`capacity` NULL means `NOT (UNKNOWN AND FALSE)`, which is TRUE: the guarded write succeeds.
This is also true for field-level `$not` and `$nor`. A NULL `capacity` does not make the
separate `soldCount < 0` comparison TRUE. For Node.js `$regex`, the sibling `$options`
modifier stays attached to the regex as one comparison, including inside a mixed operator
map.

On SQL every added term is `IS NULL` / `IS NOT NULL` and leaves the answer unchanged. No
blanket "not null" is added outside a negation: `NOT (soldCount > 9 AND capacity = 1)` with
a NULL `soldCount` and `capacity` 2 is TRUE on SQL, and it is TRUE on MongoDB too.

So a counter that is guarded should not be NULL. Give it a default of 0
(`basicSettings.defaultValue: 0`), or say what NULL means in the guard yourself, for example
`{ $or: [{ soldCount: { $eq: null } }, { soldCount: { $lte: { $col: 'capacity', $minus: '$by' } } }] }`.

## Operators are written in the blueprint, never sent

An operator object (`{ $inc }`, `{ $dec }`, `{ $incIf: { by, when } }`) and **every object
inside its `when`**, `$col` included, is honoured only when the blueprint's MScript writes
it as a **literal**. A value that arrives from a request is never read as an operator,
wherever it lands.

This matters because a data-clause value is very often a request parameter
(`dataClauseItems: capacity = this.capacity`), and a JSON body can carry an object where a
number was expected. If
`{"capacity": {"$incIf": {"by": 0, "when": {"name": {"$lt": {"$col": "passwordHash"}}}}}}`
were planned, the caller would be writing the guard: a 409-or-200 answer about any column
of the row, one predicate at a time.

So the generated service marks, at build time, each object literal of an operator subtree
the author wrote (a mark no JSON value can carry), and the runtime refuses what is
unmarked:

| What arrived | Answer |
|---|---|
| an object on a numeric column (operator-shaped or not) that the blueprint did not write | `400 NUMERIC_COLUMN_VALUE_INVALID` |
| an unmarked operator object, or any unmarked object inside `when` | `400 NUMERIC_MUTATION_NOT_AUTHORED` |
| `by` / `$inc` / `$dec` amount that is not a finite number | `400 NUMERIC_MUTATION_INVALID` |

Only **leaf values** may come from data: `by: this.quantity`, `{ $gte: this.minimum }`. The
shape (which columns, which comparisons, which `$col`) is the blueprint's. For the same
reason a literal is marked only when its shape is static: a computed key
(`{ [this.field]: 1 }`), a spread, or `$col` whose column is not a string literal
(`{ $col: this.column }`) is left unmarked and refused.

## The refusal

A `$incIf` whose statement changes **no row** raises a typed error:

| | |
|---|---|
| HTTP status | `409` |
| `errorCode` | `CONDITIONAL_UPDATE_REFUSED` |
| `errors` | the object and the planned steps (`[{ field, by }]`); the server-authored `when` is not echoed to the caller |

409 and not 422: by the time a guarded update runs, the payload has been validated and the
row has been addressed. What failed is the **state of that row at the moment of the
write** (somebody else took the last seat), so there is nothing in the request body for the
caller to correct. A client can act on it (retry with a smaller quantity, show "sold out"),
which is exactly why it must not arrive as a 500.

Two outcomes it is deliberately **not**:

- An **unguarded** `$inc` that matches no row keeps the ordinary not-found answer (the by-id
  write reports zero affected rows; the by-MQuery write returns an empty list). "The row is
  not there" and "the row refused" are different facts.
- A `$incIf` with no `when` is refused at plan time, not downgraded to `$inc`. The two have
  different zero-row answers, so guessing would make an oversell succeed silently or a
  missing row answer 409.

## Examples

### Sell tickets without overselling (an update crud action)

**First, check the sign of the amount.** `by: this.quantity` is a request value, and the
guard `soldCount + by <= capacity` is TRUE for a negative one: `quantity: -5` would pass the
capacity check and *unsell* five seats. `$incIf` checks capacity, not intent. Put a
validation in front of the increment (an entry of `actions.validationActions`, run before
the crud action):

```json
{
  "name": "requirePositiveQuantity",
  "description": "A purchase buys at least one whole ticket.",
  "validationScript": { "js": "Number.isInteger(this.quantity) && this.quantity > 0" },
  "shouldBeTrue": true,
  "checkType": "liveCheck",
  "errorMessage": "quantity must be a positive whole number",
  "errorStatus": "400"
}
```

Then the increment itself, an entry of the api's `actions.updateCrudActions`:

```json
{
  "name": "allocatePurchase",
  "childObject": "ticketType",
  "whereClause": { "js": "{ id: this.ticketTypeId }" },
  "dataClause": [
    {
      "dataProperty": "soldCount",
      "dataValue": { "js": "{ $incIf: { by: this.quantity, when: { soldCount: { $lte: { $col: 'capacity', $minus: '$by' } } } } }" }
    }
  ]
}
```

A concurrent purchase for the last seat gets `409 CONDITIONAL_UPDATE_REFUSED`; neither
purchase can read a stale `soldCount`, because neither reads it at all. Under the default
`onActionError: "throwError"` that 409 is the api's answer.

### Decrement stock, never below zero (an update api)

A `dataClauseItems` row of an update api (`crudType: "update"`), so the main write itself is
the guarded decrement:

```json
{
  "name": "stock",
  "value": { "js": "{ $incIf: { by: -1, when: { stock: { $gte: 1 } } } }" }
}
```

`when` is an ordinary MQuery; it does not have to use `$col`.

### An unconditional counter

```json
{
  "name": "viewCount",
  "value": { "js": "{ $inc: 1 }" }
}
```

No guard, so no refusal: a row that is not there is simply not updated.

### From library or custom code

The generated service exposes one programmatic door for guarded numeric updates from
library or custom code. It takes the **object name** (never a physical table name: hand-written
SQL would have to know how the object is pluralised and stored, a guess that answers
`relation "ticketType" does not exist` when it is wrong), a selector, and a mutation of the
form `{ inc: { <column>: <amount> }, when: <guard> }`, or `{ set: { ... }, when }` for a
guarded set-only write. Column references in `when` are built with the service's
column-reference constructor, never as a raw `{ $col }` object: a raw `{ "$col": ... }`
object in `when` is refused (`NUMERIC_MUTATION_NOT_AUTHORED`), so a request object you pass
along as a guard VALUE can never turn into a comparison against another column. Pass
request data into `when` only as numbers and strings.

`when` guards EVERY form of the call: with `inc` it rides each `$incIf`; with only `set` it
rides the selector of the same statement. Either way a zero-row result raises the same typed
refusal (409 `CONDITIONAL_UPDATE_REFUSED`, detail `{ object, steps }`, the guard not echoed);
without `when`, an update that matches nothing returns an empty list. An object name the
service does not have is refused naming the service's objects.

Do not write `{ soldCount: { $inc: 1 } }` by hand into the by-id or by-MQuery update helpers
from library code: an object literal there carries no authored mark, so the helpers refuse
it as data (`NUMERIC_COLUMN_VALUE_INVALID`). The guarded-update door is the one programmatic
entry point, and it marks what it builds. It builds the same `$incIf` clause and calls the
same by-MQuery update, so there is one implementation of the semantics and no second place
for them to drift. See [the compiler specification](../../compiler/index.md) for the
signature a target provides.

## What this DSL does NOT cover

- **Clamping.** `{ stock: { $dec: 1 } }` will go negative, exactly as the SQL would. The
  guard is how you say otherwise.
- **Column-to-column arithmetic.** `capacity - reserved` is not expressible; `$col` takes
  one column and one constant.
- **Multiplication or division.** `$inc` is additive. Model a multiplier as a computed value
  written directly.
- **Instance validation of the incremented column.** A value the database computes is not a
  value the application can validate before the statement runs. A clause carrying a numeric
  operator skips the ORM instance lifecycle (model validators, before/after-update
  *instance* hooks) for the whole clause, not only for the counter. The projection, event,
  cache and after-update seam all still run.
- **Creates.** `$inc` adds to a value the row already has, so it means nothing on a
  `create`; the validator refuses it there.
- **Remote child objects.** The authored mark does not survive the wire: an
  `UpdateCrudAction` on another service's object sends its data clause as JSON, and the
  receiving service refuses the operators as data (`NUMERIC_MUTATION_NOT_AUTHORED`).
  Increment on the service that owns the object.
- **Column references in reads.** `$col` is guard-only (see above), so a `whereClause` or a
  list filter cannot use it. It also has no Elasticsearch lowering (comparing two fields of
  one document needs a script query), so even a guard lowered to ES is refused with
  `COLUMN_REFERENCE_NOT_SUPPORTED_ON_ELASTIC` rather than answering a wrong row set.

## Concurrency

This is the section that differs from [array mutation](array-mutation.md#concurrency), and
it is the reason the operators exist. Array operators are a read-modify-write and two
concurrent updates to one row race. Numeric operators do not read at all: the arithmetic and
the guard are in the statement the database executes under its own row lock. No retry loop,
no optimistic version column, no transaction wrapper is needed for the counter itself.

If the counter has to move together with *other* rows (write a purchase row, then increment
the counter), that is still a transaction's job: the atomicity here is per statement.

## Across languages

Two layers, and they port differently, the same split as array mutation:

- **The `dataClause` shape, the `$inc` / `$dec` / `$incIf` operator set and the `$col`
  operand are language-agnostic.** They are part of the design, not of one runtime.
- **The lowering is a per-target data-layer concern.** The **behaviour** is the contract:
  one statement, `SET x = COALESCE(x, 0) + n` (a NULL counter counts as 0), the guard in the
  WHERE comparing the stored value, a typed 409 on zero rows, and a refusal on the
  count-only bulk helper. See [the compiler specification](../../compiler/index.md).

## See also

- [Array mutation](array-mutation.md): the same idea for list columns, and why it is a
  read-modify-write instead.
- [Query reference](query-reference.md): the operator catalogue, including `$col`.
- [Race conditions](../workflow/race-conditions.md): when a transaction is still the right
  tool.
- Specification: [`UpdateCrudAction`](../../spec/UpdateCrudAction.md).
