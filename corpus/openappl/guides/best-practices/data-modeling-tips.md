---
title: Data modeling tips
---

# Data modeling tips

Opinionated guidance for authoring the data layer of a blueprint, gathered
from real projects.

## Name objects by what they *are*, not what they *do*

- ✓ `order`, `invoice`, `subscription`, `document`
- ✗ `orderManager`, `invoiceHandler`, `documentSystem`

The data object is the noun. The verbs go on the business APIs.

## Singular, camelCase

- ✓ `order`, `orderItem`, `product`
- ✗ `orders`, `order_items`, `Products`

A data object's `name` is a single lowerCamelCase word. A PascalCase name
is rewritten when the blueprint is saved (`OrderItem` becomes `orderItem`,
reported as an applied auto-fix), and references to the object are
canonicalized the same way. Routes, tables, and event topics derive from
the name, and the generated code capitalizes it where it needs a class or
helper name (`createOrderItem`), so one convention keeps everything in
step.

## Reach for `Enum`, not `Boolean`

When you find yourself adding `isApproved`, `isRejected`, `isPending` —
pause. That's three booleans encoding one tristate. Use an `Enum`:

```json
{ "basicSettings": { "name": "status", "type": "Enum", "enumOptions": ["pending", "approved", "rejected"] } }
```

Then model the transitions as business APIs that move the value from
one state to the next ([Lifecycle and state](../data-modeling/lifecycle-and-state.md)).

## One owner per record

For records that belong to a user (`order`, `document`, `invoice`), put
the owner in one field — typically `createdBy` (ID) or `userId` (ID).
Don't sprinkle `creatorId`, `authorId`, `ownerId` on different objects
of the same project — pick a convention and stick.

## Soft delete vs lifecycle

The `isActive: false` flag is *deletion*, not *state*. Don't model
"draft" / "archived" / "expired" as `isActive: false` — those are
state, deserving an `Enum` and the APIs that change it.

## Don't over-normalise small structures

An address with five fields on a `customer` is often better as one
`Object` property than as its own `address` data object. The latter
doubles your join surface for no win.

```json
{ "basicSettings": { "name": "address", "type": "Object", "isRequired": false, "description": "line1, city, postal, country" } }
```

An `Object` value is one JSON document per row (`JSONB` on Postgres, a
`Mixed` field on MongoDB). Its keys are not declared in the blueprint
and the validator does not check them, so write the expected keys in
the property's `description` and check the ones your logic depends on
in a `ValidationAction`.

Promote to a separate `address` data object only when:

- The same address is shared across many records (book entries, locations).
- You need to list/search addresses independently.
- The address has its own lifecycle (e.g. user-confirmed vs unverified).

## Money is `Decimal` paired with a currency

Declare every money column `Decimal` with the scale its currency carries
(`"decimalScale": 2` for most currencies, `0` for JPY / KRW), paired with a
`String` currency column (or, when the project ships a cart, the
`shoppingCartConfig.basicSettings.currency`). Amounts are in **major** units
(250.00 TL, 10.00 USD); payment and invoice adapters own each provider's wire
encoding, so a column that really stores cents is charged 100x.

The generated service rounds a `Decimal` value to its scale, half-to-even, at
every write boundary: every write that reaches storage through the generated
data layer (business apis, CRUD actions, seed data and custom code alike)
is rounded, and so are a request parameter after its `transform` and the
amount handed to a payment or invoice provider. That is what keeps
`3 x 16.10` from reaching storage as `48.300000000000004`. A column bound to
a checkout, marketplace or invoicing `amountProperty` MUST be `Decimal` (a
numeric column is migrated by an auto-fix, a non-numeric one is
`MONEY_BINDING_NOT_DECIMAL`). See
[Property types](../data-modeling/property-types.md#decimal).

Whatever scale you pick, write it once on `order` and copy it to
`invoice`, `refund`, and every other monetary row in the same
service. Mixing scales across rows is the only mistake here
that's near-impossible to undo cleanly later.

## `Object` for stored structure; properties for queried fields

The `DataTypes` enum has no `JSON` type. Pick by what you do with the
data:

- **Stored and returned as a whole** — a shipping snapshot, provider
  metadata, a webhook payload — fits an `Object` property (or `Object[]`
  for a list). The value is kept as one JSON document; its keys are not
  typed or validated.
- **Filtered, sorted, indexed or related** — give each field its own
  property, or move the structure into a child data object with a
  relation, where every field has a declared type that is checked.
- **Free text** — `Text`. It is a string; don't store JSON in it and
  parse it back.

See [Property types](../data-modeling/property-types.md#object).

## Index for the queries you actually run

Don't add indexes speculatively. List filters → check that the leading
column is selective. List sorts → consider whether a composite index
makes sense. Aggregations → partial indexes can be huge wins.

See [Index patterns](../composition/index-patterns.md).

## Plan the lifecycle before the columns

For domain-heavy objects (`order`, `subscription`, `loan`), sketch the
states and the transitions between them before the property list. The
columns you need follow from the states and transitions — not the other
way around.

## See also

- [Data objects](../data-modeling/data-objects.md)
- [Property types](../data-modeling/property-types.md)
- [Lifecycle and state](../data-modeling/lifecycle-and-state.md)
