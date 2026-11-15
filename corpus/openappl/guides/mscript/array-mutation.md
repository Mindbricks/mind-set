---
title: Array mutation
---

# Array mutation

The standard `dataClause` shape for an update operation replaces array fields wholesale:
`tags: ['a', 'b']` overwrites whatever was in the column before. For partial updates
(append, remove, dedupe) OpenAPPL recognises three `$`-prefixed mutation operators that the
generated service's update paths resolve against the current row value before persisting.
Three operators, applied in fixed order; nothing else.

## Where it applies

Every update path that writes through a generated `dataClause` to an array-typed property,
on both database drivers:

- the by-id write: the main operation of an update Business API, whichever controller
  triggered it (REST, Kafka, gRPC, an edge controller or a library call)
- the by-MQuery write: `UpdateCrudAction`, the guarded-update helper and the other write
  actions

The by-MQuery write resolves the operators per row: each row reads its own current array
value before the mutation applies.

The bulk update by id list does **not** take them: it resolves an affected-row count and
reads no rows to apply them to, so a mutation object there is refused by name (400
`ARRAY_MUTATION_UNSUPPORTED_HERE`) instead of being written into the column. There is no row
to mutate on a create: an ID-typed array refuses a mutation object there (400
`errMsg_<field>MustBeAnArray`), but another array type has no create-side check, so the
object reaches the database create and fails or is stored as written. Send plain arrays on
a create.

Two more edges:

- **A JSON (`Object`) column** whose value happens to carry a `$add` / `$rem` / `$addIf` key
  is left alone by the by-id write and the id-list write (they act on array columns only),
  but the by-MQuery write still reads it as a mutation and rewrites it into a list, losing
  the other keys. Do not use those three key names in a JSON column that an
  `UpdateCrudAction` or the guarded-update helper writes.
- **After the main write**, `afterContentUpdate` and any later MScript that reads
  `this.dataClause.<field>` still see the operator object, not the resolved array. The db
  event carries the resolved value; read the row again when a hook needs the new array.

## Operator catalogue

| Operator | Behaviour | Operand |
|---|---|---|
| `$add` | Append every value to the current array. Duplicates are allowed. | Array |
| `$rem` | Remove every value from the current array. Comparison is by JSON-stringified equality, so object elements work. | Array |
| `$addIf` | Append each value only if it is not already present. Dedupe-on-write. | Array |

All three are in the MScript validator's known-operator set, so none of them raises
`MSCRIPT_UNKNOWN_OPERATOR`.

For a **number** column, the twin operators are `$inc` / `$dec` / `$incIf`; see
[Numeric mutation](numeric-mutation.md). They are not a read-modify-write like these: the
database does the arithmetic.

A plain array as the field value is **full replacement**:

```js
{ tags: ['new', 'list'] }   // tags = ['new', 'list']
```

To mutate, the value must be an object with one or more of the three operator keys:

```js
{ tags: { $add:   ['promo'] } }
{ tags: { $rem:   ['draft'] } }
{ tags: { $addIf: ['core', 'stable'] } }
```

On an **ID-typed array** column (a list of UUIDs or ObjectIds) the strict-ID check of an
update API runs before the mutation is applied. A plain array and a pure mutation object
(only `$add` / `$rem` / `$addIf`, each a list) both pass; every item of every list must be a
valid id, otherwise the call is refused `errMsg_<field>ArrayHasAnInvalidItem`. Any other
non-array value (a scalar, or an object with a key outside the three operators) is refused
`errMsg_<field>MustBeAnArray`.

You can combine all three in a single update; they apply in the deterministic order
`$rem → $add → $addIf`:

```js
{
  tags: {
    $rem:   ['legacy'],
    $add:   ['new'],
    $addIf: ['core', 'stable']
  }
}
```

Given a row whose `tags` is `['legacy', 'core', 'beta']`, the result is
`['core', 'beta', 'new', 'stable']`:

1. `$rem` removes `'legacy'` → `['core', 'beta']`
2. `$add` appends `'new'` (without dedupe) → `['core', 'beta', 'new']`
3. `$addIf` appends `'stable'` (skips `'core'`, already present) →
   `['core', 'beta', 'new', 'stable']`

Every field of the `dataClause` is walked; non-array fields and array fields whose value is
a plain array (not a mutation object) pass through unchanged.

## Examples

In an [`UpdateCrudAction`](../../spec/UpdateCrudAction.md) the mutation is the MScript
`dataValue` of a `dataClause` entry.

### Append a tag

```json
{
  "name": "addPromoTag",
  "childObject": "product",
  "whereClause": { "js": "{ id: this.productId }" },
  "dataClause": [
    { "dataProperty": "tags", "dataValue": { "js": "{ $add: ['promo'] }" } }
  ]
}
```

### Remove a tag

```json
{ "dataProperty": "tags", "dataValue": { "js": "{ $rem: ['obsolete'] }" } }
```

### Dedupe-on-write

```json
{ "dataProperty": "tags", "dataValue": { "js": "{ $addIf: ['promo'] }" } }
```

Idempotent: sending the same call twice still leaves a single `'promo'` entry.

### Bulk swap

```json
{ "dataProperty": "tags", "dataValue": { "js": "{ $rem: ['v1'], $addIf: ['v2'] }" } }
```

### Full replace (no mutation)

```json
{ "dataProperty": "tags", "dataValue": { "js": "['new', 'list']" } }
```

A plain array is full replacement. Use it when the new array is the final shape and you do
not need to merge.

### Object-element arrays

`$rem` compares elements by JSON-stringified equality, so removing an object element
requires the exact same shape:

```json
{ "dataProperty": "items", "dataValue": { "js": "{ $rem: [{ sku: 'X', qty: 1 }] }" } }
```

If the stored element has any additional properties (or a different property order in
non-JSON-canonical storage), the match fails. For keyed removal of object elements, fetch
the row, compute the new array in an `ArrowFunctionAction`, then write it back wholesale.

## Null-array normalisation

Any non-array current value (null, undefined, or a freshly inserted row with no entry yet)
is normalised to `[]` before the operators apply. Practical implications:

- `$rem` against a null column is a no-op: the empty list has nothing to remove.
- `$add` and `$addIf` against a null column produce a fresh array containing only the added
  values.
- The literal `null` is never preserved; the column is always written as an array after a
  mutation runs, even an empty one.

## What this DSL does NOT cover

- **Numeric counters.** There is no `$inc` operator on this code path. For counters, use the
  [numeric mutation](numeric-mutation.md) operators, which the database resolves atomically.
- **String mutations.** `$append`, `$prepend`, and `$clearAll` are not in this array-mutation
  applier. They are recognised by the MScript validator for separate write surfaces
  (string-aggregate fields); verify the target action's documented operand shape before using
  them.
- **Index-based mutation.** `array[3] = ...` is not expressible. Read, modify, write.
- **Conditional cascades.** "If A then set B" belongs in a `ValidationAction` plus a regular
  update, or an `ArrowFunctionAction` that computes the next value.
- **Cross-row updates.** Each row resolves its operators against its own current value. There
  is no broadcast / aggregate form.

## Concurrency

The operators are resolved at the application layer (read the row, compute the next array,
write it), and the write is **conditional on the array it was computed from**, a
compare-and-swap:

```sql
UPDATE "events" SET "liveTicketIds" = $1
 WHERE "id" = $2 AND "liveTicketIds" = ARRAY['t1','t2','t3']::UUID[]
```

On MongoDB the filter carries the same term (`{ _id, liveTicketIds: [t1, t2, t3] }`). When
another writer changed the array between the read and the write, the statement changes no
row; the write re-reads the row and resolves the operators again from the winner's array. So
two concurrent `$rem` calls on the same row both land: neither one restores what the other
removed.

The retry is bounded: after 8 lost races in a row the call fails with 409
`ARRAY_MUTATION_CONFLICT` and nothing is written. A row that disappears mid-write is the
ordinary not-found answer.

Each attempt runs the normal update lifecycle (model validators and before-update hooks see
the resolved array), so a hook with side effects can run more than once for one call under
contention.

A geo list column (stored as one multi-geometry) has no reliable equality, so it is not part
of the guard: a `$add` / `$rem` on a geo list is still last-writer-wins under concurrency.

## Across languages

Two layers are involved, and they port differently:

- **The `dataClause` shape and the `$add` / `$rem` / `$addIf` operator set are
  language-agnostic.** They are part of the design, not of one runtime: each target's
  compiler recognises the same operator keys.
- **Operand *values* are MScript** and are translated like any other expression. A computed
  operand such as `{ tags: { $addIf: [this.session.workspaceId] } }` rewrites the context
  reference per target (for example `self.session.workspaceId` in Python); see
  [Writing MScript across languages](overview.md#writing-mscript-across-languages).
- **The read-modify-write applier is a per-target runtime concern.** The **behaviour**
  (fixed `$rem → $add → $addIf` order, null-array normalisation, JSON-equality removal) is
  the contract. Only the Node.js target resolves the operators on the by-id main operation of
  an update API, with the compare-and-swap and the `409 ARRAY_MUTATION_CONFLICT` described
  under [Concurrency](#concurrency). On the Java, .NET, Python, Rust and Go targets the
  by-id update does not resolve them (a strict ID-array check may refuse the object with
  `MustBeAnArray`); on those targets send the full new array. See
  [the compiler specification](../../compiler/index.md).

## See also

- [Syntax](syntax.md): base MScript grammar.
- [MScript overview](overview.md#writing-mscript-across-languages): the per-language
  context-binding table.
- [Query reference](query-reference.md): the read-side `$`-operator set.
- [Numeric mutation](numeric-mutation.md): `$inc` / `$dec` / `$incIf`, the number-column
  twin, resolved by the database instead.
- Specification: [`UpdateCrudAction`](../../spec/UpdateCrudAction.md).
