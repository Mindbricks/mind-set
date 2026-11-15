---
title: MScript query reference
---

# MScript query reference

Many MScript fields take a *filter object* rather than a scalar expression:
`whereClause`, `searchClause`, `fullWhereClause`, an extended-clause `condition`, a
partial-index `where`, a list-API `listOptions.filter`, etc. The shape is a plain JS object
with `$`-prefixed operators inspired by Mongo.

> **These slots are MScripts, so they carry a language descriptor like every other
> MScript.** The filter object is the *source*, the object literal the expression evaluates
> to, and it goes inside the descriptor:
>
> ```json
> "whereClause": { "js": "({ status: { $eq: 'active' } })" }
> ```
>
> Every example on this page shows that source. Wrapping the object literal in parentheses
> keeps it an expression rather than a block.

At runtime the generated service compiles the same object to Elasticsearch DSL, SQL
conditions, or a native Mongo query, depending on the data object's backing store. The
operator set is fixed; the validator knows the full catalogue below.

Operator SPELLING is not significant: both the runtime converter and the design-time check
strip the `$`, lowercase, and drop spaces / `_` / `-` before they resolve a token, so
`$isnull`, `$isNull` and `$is_null` are one operator. This page uses the canonical spelling
shown in each table, and so does the `MSCRIPT_UNKNOWN_OPERATOR` diagnostic. A token that is
still unknown after that fold is a typo, not a variant, and is refused.

> This page documents the **declarative filter object** form (the `$`-operators). For the
> separate **list-API runtime filter** wire shape used by generated `POST /<resource>/list`
> endpoints, see [Filters and lists](../business-apis/list-api.md). That wire body uses
> bare operator names (`eq`, `gt`, `in`, `contains`) and is translated to the
> `$`-operator form before reaching the same query converter.

## Basic shape

Field names are keys; an operator object is the value:

```json
{ "age": { "$gte": 18 }, "status": { "$eq": "active" } }
```

A bare value at the top level is sugar for `$eq`:

```json
{ "userId": "u_123" }
// equivalent to
{ "userId": { "$eq": "u_123" } }
```

Multiple top-level keys are joined with implicit `$and`. Combine explicitly with `$and`,
`$or`, `$nor`, `$not` when the structure matters.

Because MScript itself is a JavaScript expression, you can build the filter object using
template literals, ternaries, and library calls:

```js
({ name: { $ilike: `%${this.searchKeyword}%` }, workspaceId: this.session.workspaceId })
```

`workspaceId` here is the PROJECT's own tenant name (`<tenantName>Id`), on both sides: the
column the object carries and the session field the auth layer stamps. There is no generic
`this.session.tenantId`: nothing stamps it, so it reads `undefined` and the validator
reports it as `SESSION_FIELD_UNKNOWN`. See [Multi-tenancy](../capabilities/multi-tenancy.md).

Or delegate to a service-library function for reuse:

```js
LIB.buildProductSearchQuery(this.searchKeyword, this.session.workspaceId)
```

### Calling from library code

Library code that queries a data object passes a filter object to an MQuery-aware helper of
the generated service. Such a helper takes the bare filter and returns the matching rows.
The lower-level list helper takes a `{ where, limit, ... }` envelope and returns
`{ rows, count }`; its SQL `where` must use native SQL conditions, not MQuery `$` operators,
and the design-time error `LIB_DBLAYER_RAW_WHERE_USES_MQUERY` names the MQuery-aware helper
to use. Native Mongo filters are valid on MongoDB services. See
[the compiler specification](../../compiler/index.md) for the helper names a target
provides.

## Operator catalogue

### Comparison

| Operator | Meaning | Example |
|---|---|---|
| `$eq` | Equals | `{ "status": { "$eq": "active" } }` |
| `$ne` | Not equals | `{ "status": { "$ne": "inactive" } }` |
| `$notIn` | Alias of `$nin` | `{ "role": { "$notIn": ["guest"] } }` |
| `$notContains` | Alias of `$ncontains` | `{ "bio": { "$notContains": "spam" } }` |
| `$gt` | Greater than | `{ "age": { "$gt": 18 } }` |
| `$gte` | Greater or equal | `{ "age": { "$gte": 18 } }` |
| `$lt` | Less than | `{ "age": { "$lt": 30 } }` |
| `$lte` | Less or equal | `{ "age": { "$lte": 30 } }` |
| `$in` | Value in list | `{ "role": { "$in": ["admin", "user"] } }` |
| `$nin` | Value not in list | `{ "role": { "$nin": ["guest"] } }` |
| `$between` | Inclusive range `[lo, hi]` | `{ "price": { "$between": [10, 100] } }` |
| `$nbetween` | Outside range | `{ "price": { "$nbetween": [10, 100] } }` |

`$between` / `$nbetween` take exactly two elements, `[lo, hi]`; `$geoNear` takes an object
with a `point`. Any other operand (a one- or three-element array, a scalar, `null`, an
object with no `point`) is refused with a shape error naming the operand path, on every
database, instead of being lowered to a wider or empty filter.

### Column reference (`$col`): numeric-mutation guards only

Every comparison above compares a column to a **value**. `$col` puts **another column of
the same row** on the right-hand side, so a capacity predicate such as
`soldCount + 3 <= capacity` is expressible. It is honoured ONLY inside the `when` guard of a
`$incIf` numeric mutation written in the blueprint (and, from library code, through the
generated service's guarded-update helper); in a `whereClause`, a list filter or any
caller-supplied value it is refused, because the operand position is where a caller's
filter value lands and a caller must never be able to turn a value into a reference to
another (possibly hidden) column:

| Form | Meaning | Example |
|---|---|---|
| `{ "$col": "<property>" }` | The other column's value | `{ "soldCount": { "$lt": { "$col": "capacity" } } }` |
| `{ "$col": "<property>", "$minus": n }` | That value minus `n` | `{ "soldCount": { "$lte": { "$col": "capacity", "$minus": 3 } } }` |
| `{ "$col": "<property>", "$plus": n }` | That value plus `n` | `{ "reserved": { "$gte": { "$col": "floor", "$plus": 10 } } }` |

It is deliberately **bounded**: one column, at most one additive constant, legal only under
`$eq` / `$ne` / `$gt` / `$gte` / `$lt` / `$lte` (the bare `{ "a": { "$col": "b" } }` means
`$eq`). The column must be a plain identifier. Anything else, including a `$col` outside a
guard, is refused by name with a shape error. SQL lowers it to a column-bearing operand
(`"soldCount" <= "capacity" - 3`), MongoDB to an `$expr` that also requires both operands to
be present and non-null, so a NULL on either side is not a match on either engine (SQL's
UNKNOWN; a bare `$expr` would sort null below every number). Inside the same guard a
literal `$ne` / `$nin` does not match a NULL or missing field either, and a comparison under
`$not` / `$nor` gives SQL's three-valued answer; everywhere else they keep the NULL carve-out
described in the dialect table below. **Elasticsearch has no lowering**, because comparing
two fields of one document needs a script query, so an ES-backed read refuses it with
`COLUMN_REFERENCE_NOT_SUPPORTED_ON_ELASTIC` instead of answering a wrong row set. See
[Numeric mutation](numeric-mutation.md).

### Existence / null

| Operator | Meaning | Example |
|---|---|---|
| `$isnull` | Field is null | `{ "deletedAt": { "$isnull": true } }` |
| `$notnull` | Field is not null | `{ "deletedAt": { "$notnull": true } }` |
| `$exists` | Field exists (Mongo / ES) | `{ "phone": { "$exists": true } }` |
| `$nexists` | Field does not exist | `{ "phone": { "$nexists": true } }` |

Backend semantics: SQL stores treat `$isnull`/`$notnull` and `$exists`/`$nexists` the same;
Mongo and ES distinguish "field absent" from "field present and null".

**A `null` OPERAND on `$eq` / `$ne` is the null test.** `{ "f": null }` and
`{ "f": { "$eq": null } }` mean "is null"; `{ "f": { "$ne": null } }` means "is not null".
That is what the SQL backend renders (`IS NULL` / `IS NOT NULL`) and what MongoDB answers,
so on Elasticsearch the two lower to `must_not exists` / `exists`, the same clauses
`$isnull` / `$notnull` produce (a `term` clause cannot carry a null value and the cluster
rejects one). Prefer the explicit `$isnull` / `$notnull` spelling in new blueprints.

### Pattern matching (strings)

| Operator | Meaning | Example |
|---|---|---|
| `$like` | Case-sensitive `LIKE`, `%` wildcard | `{ "name": { "$like": "%john%" } }` |
| `$nlike` | Negated `$like` | `{ "name": { "$nlike": "%bot%" } }` |
| `$ilike` | Case-insensitive `LIKE` | `{ "name": { "$ilike": "%john%" } }` |
| `$nilike` | Negated `$ilike` | `{ "name": { "$nilike": "%bot%" } }` |
| `$starts` | Starts with | `{ "name": { "$starts": "Mr." } }` |
| `$nstarts` | Does not start with | `{ "name": { "$nstarts": "Ms." } }` |
| `$ends` | Ends with | `{ "email": { "$ends": "@gmail.com" } }` |
| `$nends` | Does not end with | `{ "email": { "$nends": "@yahoo.com" } }` |
| `$contains` | Contains substring (or array element, see below) | `{ "bio": { "$contains": "sale" } }` |
| `$ncontains` | Does not contain | `{ "bio": { "$ncontains": "draft" } }` |
| `$match` | Backend text search, **not portable**, see the [ruling table](#cross-dialect-operator-semantics) | `{ "description": { "$match": "sale" } }` |
| `$nmatch` | Negated `$match` | `{ "description": { "$nmatch": "error" } }` |
| `$matchPhrase` | Phrase match: adjacent, in order. Phrase-exact on Elasticsearch; **degrades to `$match`** on Postgres and Mongo | `{ "title": { "$matchPhrase": "sales report" } }` |
| `$nmatchPhrase` | Negated `$matchPhrase` | `{ "title": { "$nmatchPhrase": "sales report" } }` |
| `$regex` | Mongo-style regex with options. **Target-dependent**, see [regex support](#regex-support) below | `{ "name": { "$regex": "^john", "$options": "i" } }` |

`$regex` / `$options` are paired: `$options` is a sibling key, not nested.

The pattern grammar is **SQL `LIKE`'s**: `%` is any run of characters, `_` is exactly one,
backslash escapes the following character, and everything else, including `*`, `?`, `.`,
`+` and every other regular-expression metacharacter, is **literal**. `$starts` / `$ends`
take a **bare** prefix/suffix with no wildcard at all, and `$match` takes a **literal
substring**. The Elasticsearch backend speaks a different wildcard grammar natively (`*` /
`?`) and the MongoDB backend speaks regular expressions, so the converter **translates**
into both; you never write ES wildcards or Mongo regexes yourself. For `$like`, `$ilike`,
`$nlike` and `$nilike`, `\%`, `\_` and `\\` match a literal percent, underscore and
backslash. This follows Postgres's default LIKE escape. A trailing unpaired backslash is
invalid. In a JSON string, double each backslash:
`{ "name": { "$ilike": "%50\\%\\_off%" } }` matches the literal substring `50%_off`,
ignoring case.

For literal substring search, escape backslashes, percent signs and underscores in the
input before wrapping it in `%`: `term.replace(/[\\%_]/g, '\\$&')`. Authored LIKE operands
retain their deliberate wildcard behaviour. Regular-expression metacharacters such as
parentheses remain literal and cannot turn the filter into a regular expression.

Note the flip side on MongoDB: a needle with **no** `%` is a whole-value test there, exactly
as `LIKE 'draft'` is on Postgres. A "contains" test must wrap the term in `%`; the
generated runtime `?q=` search emits `'%' + term + '%'` on both DB engines.

**`$regex` is the raw-regex door.** It is the ONE operator whose operand is a pattern
engine's pattern: `$like` uses SQL wildcards with explicit literal escapes, while `$starts`
/ `$ends` / `$match` take literal text. Escape a search term before interpolating it into
LIKE. Two consequences you own when you reach for it:

* **Do not interpolate untrusted input into a `$regex` needle.** `.*` widens the filter to
  everything, and a nested quantifier such as `(a+)+$` backtracks catastrophically on the
  MongoDB backend. If the needle comes from a user, use `$like` / `$match` instead.
* **`$options` supports `i` and nothing else.** It is a *sibling* key of `$regex`, not a
  nested one, and it is the only flag all three dialects can express (`~*` on Postgres,
  `$options: "i"` on MongoDB, `case_insensitive` on Elasticsearch). An `m` / `s` / `x` is
  **refused** with a shape error rather than silently dropped.

`$regex` is also where the runtime list-API `regexp` operator lands on the DataObject path;
see the ruling row below for the Elasticsearch anchoring difference.

A Node.js guard written programmatically may pass a real `RegExp`, such as
`{ name: { $regex: /^a/i } }`; its source and flags survive, and the same flag restrictions
apply. JSON inputs use a pattern string and optional `$options`.

#### Regex support

`$regex` is implemented on the **Node.js target only**. Other targets do not behave
uniformly across every dialect or backend they support, and the behaviour verified for one
dialect of a language does not describe that language's other dialects. Depending on target
and backend, a non-Node.js service may:

- **refuse** a positive or negated `$regex` with an error (the safe outcome: a caller finds
  out immediately);
- **silently drop** the clause, so the query runs without that filter and returns every
  unfiltered row, which is functionally the same hazard as failing open;
- pass the operator to the database with **no operator allowlist, no `$options`
  validation and no pattern-length bound** (for example on a MongoDB backend), which works
  but exposes the same catastrophic-backtracking class described above;
- fail **open** under negation (a negated match-nothing clause matches everything).

Which of these applies is dialect-scoped, not language-scoped. Do not author `$regex` in a
blueprint whose service targets anything but Node.js, and never generalise one dialect's
or one backend's verified behaviour to the rest of that language. Prefer `$like`, `$starts`,
`$ends` or `$match`, which are portable. See
[the compiler specification](../../compiler/index.md) for the per-target behaviour a
compiler documents.

An **ES wildcard written directly** into a `$like` needle (`{ "$like": "*john*" }`) is a
literal `*` on every backend, the Elasticsearch one included: on the SQL ones `*` is an
ordinary character, and treating it as a wildcard would let a user-typed search term
interpolated into `'%' + term + '%'` smuggle one in. Write the documented `%` instead. (The
list-API **`wildcard` runtime operator** is a raw ES pattern and takes its own path to the
cluster on a DataView read. Its DataObject path TRANSLATES that grammar, `*` to `%` and `?`
to `_`, instead of handing the ES pattern to `$like` verbatim. The translation is one-way in
one respect: a `%` or `_` **already in the caller's pattern** is an ordinary character to ES
and a wildcard to `$like`, because that runtime translation leaves percent and underscore
unescaped. The LIKE escape contract above makes literal operands expressible, but this
translator does not apply it, so `{"wildcard": "100%"}` reads as the literal `100%` on a
DataView and as "starts with 100" on a DataObject.)

On the runtime DataView Elasticsearch path, scalar `contains` / `notContains` and `ends`
treat `*`, `?` and backslash in the needle literally. Percent, underscore, brackets and
parentheses remain ordinary literal characters. `starts` remains a literal prefix, while
`wildcard` and `regexp` keep their raw pattern grammars. With declared keyword/ftext field
kinds, `contains` / `notContains` use the same lowering as MQuery. Without field kinds,
runtime scalar contains retains its wildcard substring fallback and MQuery retains its
`match` fallback; those untyped retrieval models differ intentionally.

### Array fields

| Operator | Meaning | Example |
|---|---|---|
| `$contains` | Array contains value; with a **list** operand, contains **every** listed value | `{ "tags": { "$contains": "news" } }` and `{ "tags": { "$contains": ["news", "tech"] } }` |
| `$ncontains` | Negated `$contains`; with a list operand, **at least one** of them is missing | `{ "tags": { "$ncontains": "draft" } }` |
| `$overlap` | Arrays share at least one element | `{ "tags": { "$overlap": ["tech", "ai"] } }` |
| `$noverlap` | Arrays share no elements | `{ "tags": { "$noverlap": ["old"] } }` |
| `$all` / `$notall` | All / not all of the listed values are present | `{ "tags": { "$all": ["a", "b"] } }` |
| `$any` / `$notany` | At least one / none of the listed values are present | `{ "tags": { "$any": ["a", "b"] } }` |
| `$elemMatch` | Sub-object array; at least one element matches the inner predicate | `{ "items": { "$elemMatch": { "sku": "X", "qty": { "$gt": 1 } } } }` |
| `$size` / `$notsize` | Array length equals / does not equal | `{ "tags": { "$size": 3 } }` |

`$elemMatch` keeps the entire inner predicate on **one object element**. For example,
`[{"sku":"X","qty":0},{"sku":"Y","qty":2}]` does not match the example above. MongoDB
lowers it to native `$elemMatch`. The PostgreSQL converter supports JSONB object arrays and
SQL JSONB[] columns (the storage of an array-valued Object property) on PostgreSQL 12+ when
the caller declares the JSON array field (`{ jsonArrayFields: ['items'] }` as the
converter's second argument); it normalizes storage with `to_jsonb` and uses one
`jsonb_path_exists` filter with separately escaped JSON variables. The Elasticsearch
converter requires `{ nestedFields: ['items'] }` in its options and a corresponding
`nested` mapping, and emits one nested query. Scalar SQL arrays, flattened Elasticsearch
`object` mappings, and calls without the corresponding storage declaration are refused with
a shape error. Generated callers do not infer these declarations.

The supported inner vocabulary is non-empty object predicates with finite number, string or
boolean values; `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, non-empty scalar `$in` / `$nin`
lists, and nested `$and`, `$or`, `$nor`, `$not` conditions. Dotted inner names traverse
objects without intermediate arrays; the final properties must be scalar leaves
(Elasticsearch strings must use keyword mappings). Nulls, class instances, nested array
operators and other inner operators are explicitly refused. Missing properties do not
satisfy positive comparisons; negation complements that result. An absent or empty outer
array has no matching element. To select rows with no matching element, place `$not`
**outside** `$elemMatch`; a `$not` inside it instead asks for an element that fails its
inner condition. Embedded `id` properties retain their names.

`$all` / `$any` / `$size` and their negations lower on every dialect. `$all` is `$contains`
with a list (every listed value present; `$all: []` selects nothing) and `$any` is
`$overlap`. `$size` takes a non-negative integer. On Postgres it compares
`COALESCE(array_length(col, 1), 0)`, so `{ "$size": 0 }` matches an empty array (bare
`array_length` of an empty array is NULL) and a NULL column counts as empty. On
Elasticsearch an empty array is an absent field, so `$size: 0` / `$notsize: 0` lower to
`must_not exists` / `exists`. A non-zero length has no query primitive there and is refused
with `ARRAY_SIZE_NOT_SUPPORTED_ON_ELASTIC` (400). MongoDB keeps its native `$size`, which
does not match a missing field.

### Logical combinators

| Operator | Meaning | Example |
|---|---|---|
| `$and` | All sub-conditions true | `{ "$and": [ {"a": 1}, {"b": 2} ] }` |
| `$or` | At least one sub-condition true | `{ "$or": [ {"a": 1}, {"b": 2} ] }` |
| `$nor` | None of the sub-conditions true | `{ "$nor": [ {"a": 1}, {"b": 2} ] }` |
| `$not` | Negates the inner predicate | `{ "$not": { "a": 1 } }` |

Combinators take arrays for `$and`/`$or`/`$nor` and a single object for `$not`. Every
element must be a condition object: an empty `{}` inside `$or` would make the whole
disjunction unconditional, so it is rejected rather than silently widening the read.

**An empty object `{}` you write below the top of the query is refused, on the generated
route and action where-clauses too.** Refused, whatever the sibling terms and however deep:
a field term `{ "ownerId": {} }`, a `{}` branch of `$or` (`{ "$or": [{ "a": 1 }, {}] }`),
and an operator operand `{ "ownerId": { "$eq": {} } }`, also under `$not` / `$nor`. Reading
such a `{}` as "no constraint" would widen the clause: on an update or delete api
`{ ownerId: this.ownerSel, rank: 3 }` with a `{}` value would become `{ rank: 3 }` and
change every owner's rows, so the request fails with the converter's error instead. The
whole clause `{}` is "no restriction", a `{}` member of `$and` is ignored (the clauses of
an api are conjoined, possibly empty), and `$nor: [{}]` / `$not: {}` match nothing. So to
let an admin see every row, gate the whole clause rather than adding a `{}` branch to the
`$or`: `this.session?.roleId === 'admin' ? {} : { $or: [ ... ] }` (the form
`$or: [ ..., ...(admin ? [{}] : []) ]` is refused).

**An EMPTY `$and` / `$or` / `$nor` list is refused by the converter**, in the root position
and the field position (`{ "status": { "$or": [] } }`) alike, with a shape error naming the
path (`$and[1].$or`). Handed to the backends as-is, `[]` would select a different row set
on each: Postgres reads `$or: []` as `0 = 1` and `$and: []` / `$nor: []` as no restriction,
MongoDB refuses all three at query time ("must be a nonempty array"), and Elasticsearch
reads all three as `match_all`, so an empty disjunction would answer **every** document.
Guard a list you build at runtime before you put it in the query: for "match nothing" write
the portable `{ "id": { "$in": [] } }`
([an empty value list is a filter](#an-empty-list-is-a-filter-not-an-omission)), for "no
constraint" omit the key.

Where the refusal is reached: a **raw converter call** (a direct converter call in library
code, a data-layer by-MQuery get / list / stats / update / delete helper called from MScript
or a library function, or a cross-service remote read by MQuery, whose status-carrying form
reports `query-conversion-failed`). The generated **route and action where-clauses do NOT
refuse it**: they run a where-clause normalizer first, whose answers are `$or: []` is
match-nothing, `$and: []` / `$nor: []` impose no constraint. (An empty OBJECT is different:
see the paragraph above.)

#### Extra `$not` positions: Node.js target only

The Node.js runtime additionally accepts the forms below. They are **not portable**, and the
other runtimes do not fail the same way, so a blueprint that must run on another target
should keep to the `{ "$not": { … } }` form above. On other targets these forms may throw an
error for a field-position `$not` (it is not a field operator there), silently drop a root
`$not` with an array operand (the clause simply stops filtering), report the clause as
unexpressible, or silently drop it, so the query runs without that filter.

| Form | Node.js meaning |
|---|---|
| `{ "lastSeenAt": { "$not": { "$gte": cutoff } } }` | field position, negates just that field's predicate |
| `{ "score": { "$gte": 1, "$not": { "$gte": 10 } } }` | combines with sibling operators on the same field |
| `{ "score": { "$or": [ {"$lt": 1}, {"$gt": 9} ] } }` | `$and` / `$or` scoped over one field (see the `$nor` note below) |
| `{ "$not": [ {"a": 1}, {"b": 2} ] }` | array operand, `NOT(AND(...))` |
| `{ "n": { "$not": [ {"$gte": 1}, {"$lte": 9} ] } }` | field-scoped array of operator objects, `NOT(n >= 1 AND n <= 9)` |
| `{ "tags": { "$not": ["x", "y"] } }` | field-scoped array of **values**, negated `$in` |

A `$not` operand with nothing unambiguous to negate is rejected with a shape error naming
the path, **in both the root and the field position**. That covers an empty object, `null`,
an empty array (`{ "f": { "$not": [] } }` as much as `{ "$not": [] }`), and a *mixed* array
of condition objects and bare values.

**`$nor` means `NOT a AND NOT b` on every backend**: the SQL lowering negates each member,
not the conjunction (`NOT (a AND b)` would match a row where `a` held and `b` did not). The
row sets are pinned across the three dialects. `$nor` is **not** in the advertised
FIELD-scoped set; write `{ "score": { "$not": [ {"$gte": 1}, {"$lte": 9} ] } }` or an
explicit `$and` of negations for a single field.

#### `null` inside a value list is rejected

A `null` **element** of a value list is refused with a shape error naming the element INDEX
(`f.$in[1]`), on every dialect. This covers `$in`, `$nin`, `$overlap`, `$noverlap`,
`$contains` and `$ncontains` with a LIST operand, a field-scoped `$not` value list
(`{ "f": { "$not": [null] } }`) and the bare-array shorthand (`{ "f": [1, null] }`, which
*is* `$in`). The scalar `$contains` arm is untouched: the guard fires only when the operand
IS an array.

It is rejected because a `null` there cannot mean one thing:

| Backend | `{ "f": { "$in": [1, null] } }` | `{ "f": { "$nin": [1, null] } }` |
|---|---|---|
| Postgres | `f IN (1, NULL)`: the NULL element never matches | `f NOT IN (1, NULL)` is UNKNOWN for every row, so **zero rows, always** |
| MongoDB | matches `f: null` **and** documents with no `f` | excludes them |
| Elasticsearch | `terms` **rejects** the null: a query-time 400 | same |

Spell the null branch out instead:
`{ "$or": [ { "f": { "$isNull": true } }, { "f": { "$in": [1] } } ] }`, or
`{ "f": { "$notnull": true } }` for the excluding direction.

Two things are deliberately NOT affected: a null-free list of any length (including the
empty list, which keeps its "matches nothing" meaning, ruled explicitly in
[An empty list is a filter, not an omission](#an-empty-list-is-a-filter-not-an-omission)),
and a bare `null` VALUE (`{ "f": null }`), which is the documented "is null" literal.

##### A LITERAL null never gets that far

When the null is **typed into the blueprint** (`{ "f": { "$in": ["a", null] } }` in a
`whereClause`), the validator refuses it at design time with
`MSCRIPT_MQUERY_NULL_IN_VALUE_LIST`, naming the slot and the element's position, so the
runtime refusal is the second line of defence rather than the first. The design-time pass
judges exactly the shapes above (`$in` / `$nin` / `$overlap` / `$noverlap` / `$contains` /
`$ncontains` with a list operand, a field-scoped `$not` over a value list, and the
bare-array shorthand in clause position), and only what is DECIDABLE: a literal `null`. A
dynamic element that *might* be null for one caller (`{ "$in": [this.maybeNull] }`) is not a
design-time fact and is left to the runtime; an `undefined` element keeps its documented
behaviour, which is **not** "match-nothing". On a READ, `undefined` list elements are
**dropped from the list**: `{ "$in": ["a", undefined] }` becomes `{ "$in": ["a"] }` and the
surviving values still match; only a list left EMPTY by that filtering stops matching. On an
update/delete SELECTOR the same element is **refused** with a `400` naming its index
(`id.$in[1]`), because a degradation on a mutation would widen a mass update.

##### Who sees the refusal, and who never reaches it

The runtime refusal is aimed at **the query you WRITE** (a `whereClause`, an
`additionalClauses` gate, a joint-filter MQuery, an action's `$in` list) once a value that
was not decidable at design time turns out to be null. It is a shape error in
server-authored MScript, so it surfaces the way every other server-side fault does: a logged
`500` with the generic body, never a `400`. A `400` would be a lie, since the caller has no
field to correct and the `f.$in[1]` path describes the SERVER's query, not the request.

> **One converter refusal IS a `400`**, and it is the exception that shows the rule. `$eq` /
> `$ne` with an ARRAY operand on the Elasticsearch backend raises an unsupported-on-dialect
> error with `errorCode: ARRAY_EQUALITY_NOT_SUPPORTED_ON_ELASTIC`. The query is *well
> formed* (it means something on the other two backends) and there is a spelling that works
> (`$in` / `$overlap`), so the message names it, rather than sending a clause the cluster
> would reject with a parsing error nobody can act on. Every other refusal in the converter
> is deliberately status-less.

Three framework-owned or caller-bound inputs therefore never reach it as a `500`:

* **Generated id lists**: the joint-filter and full-text-search id arrays the generated
  service pushes as `{ id: { $in } }` are built from rows, and a nullable joined key or an
  id-less ES hit contributes a `null`. Those lists are **stripped at the source** (null ids
  are filtered out, as is the membership-filter list): a row that joins to nothing selects
  nothing, which is what the filter means.
* **Runtime list filters** (`POST /<resource>/list` with `body.filters`): the `values` array
  is untrusted client input, so a `null` element there is a **`400`** with
  `errorCode: NULL_IN_VALUES`, the field name and the element index (`values[1]`), raised
  before any conversion. It applies to `in`, `notin`, `range`, and `contains` /
  `notContains` with a LIST operand, whose element arrives under `value` rather than
  `values`. Client input is answered with a client error; it never becomes a `500`.
* **Declared filter parameters and authored `selectBy` terms**: both are `requestParameter`
  values read verbatim off the request, so both are validated by the generated service. It
  answers a `400` for the two shapes a caller can put there wrongly:
  `FILTER_VALUE_NULL_ELEMENT` for a null MEMBER of a value list, and
  `FILTER_OPERATOR_NOT_ALLOWED` for an operator map where a value belongs. A caller-bound
  term is a scalar or a list of scalars; MQuery operators on it are the SERVER's to choose,
  and a caller who wants to pick one uses the runtime-filter body, which validates the
  operator name against the API's allow-list.

##### Write selectors: an open range has a closed-form rewrite

On some targets (the .NET target, for example) the write-side guard refuses an update/delete
selector whose `$between` / `$nbetween` / `$contains` / `$ncontains` operand carries a
literal `null` bound, the same way it refuses any other unbound term in a mutation selector;
the path is named in the `400` (e.g. `age.$nbetween[0]`). This is intentionally **stricter**
than the read side: a mutation cannot take the risk of an unbound compiled term widening a
mass update.

**For an author hitting this refusal, there is an exact rewrite that is never refused,
because it is the same clause in its closed form.** An open `$nbetween` bound IS a strict
comparison once one side is dropped:

* `{ "age": { "$nbetween": [null, 30] } }` becomes `{ "age": { "$gt": 30 } }`
* `{ "age": { "$nbetween": [30, null] } }` becomes `{ "age": { "$lt": 30 } }`

`$between` / `$contains` / `$ncontains` with a null bound do not have an equivalent closed
form: they lower to "match nothing", and the fix is to name the intended bound explicitly
(e.g. `$lte`) rather than leave one side open. There is no `$isNull`-style spelling that
covers an open range, so the escape hatch above is the whole answer: name every bound in a
mutation selector, or write it in closed form.

**SQL and NULL.** A negation over a nullable column does not return the rows where the
column is NULL. `NOT (lastSeenAt >= cutoff)` is UNKNOWN when `lastSeenAt IS NULL`, and SQL
keeps only rows that evaluate TRUE, so the Postgres backend omits them, while MongoDB and
Elasticsearch include them (a missing field simply fails the inner comparison, so the
negation matches). Spell the intent explicitly when it matters:
`{ "$or": [ { "lastSeenAt": { "$isNull": true } }, { "lastSeenAt": { "$not": { "$gte": cutoff } } } ] }`.

### Geospatial

On Node.js PostgreSQL list routes, a standalone geospatial predicate applies to both the
page query and its total count. It does not require another condition beside it. Standalone
`$size` and `$notsize` predicates have the same behaviour.

For data objects with a geo point or geometry property.

| Operator | Meaning |
|---|---|
| `$geoNear` | Sort by distance from a point; pair with `$maxDistance` / `$minDistance` |
| `$geoWithin` | `{ shape }`: inside a geometry. `{ bbox: [minLon,minLat,maxLon,maxLat] }`: **overlapping** that box, since a bbox is a viewport |
| `$geoContains` | Geometry contains the given point |
| `$geoIntersects` | Geometries overlap |
| `$nearSphere` | The MongoDB spelling of `$geoNear`, read on every backend (see Operand shapes below) |
| `$maxDistance` / `$minDistance` | Distance bounds (metres), sibling of `$geoNear` / `$nearSphere` |
| `shape` | GeoJSON geometry for `$geoWithin` / `$geoContains` / `$geoIntersects`; `$geometry` is an accepted alias |
| `point` | GeoJSON Point for `$geoNear`; `$geometry` is an accepted near-operand alias |
| `$box` | Two corners `[[minLon,minLat],[maxLon,maxLat]]`, accepted by `$geoWithin` as a Polygon shape (containment) |
| `bbox` | Flat bounding box `[minLon, minLat, maxLon, maxLat]`: operand for `$geoWithin`, and an overlap test |

The exact wire shape varies per backend (SQL uses PostGIS, Mongo uses GeoJSON, Elastic uses
geo-bounding-box queries). The MScript object is the same.

**Operand shapes.** `$geoNear` (also spelled `$near`, `$geoDistance` and `$nearSphere`)
takes `{ point: <GeoJSON Point>, maxDistance?, minDistance? }` in metres. The MongoDB
spelling `{ $nearSphere: { $geometry: <Point>, $maxDistance, $minDistance } }` is read as
the same operand on every backend, and so are the bounds written as siblings
(`{ loc: { $nearSphere: {...}, $maxDistance: 500 } }`). `$geoWithin` / `$geoContains` /
`$geoIntersects` take `{ shape: <GeoJSON> }` (`$geoWithin` also `{ bbox }`); the MongoDB
`{ $geometry: <GeoJSON> }` is read as `shape`, and
`$geoWithin: { $box: [[minLon, minLat], [maxLon, maxLat]] }` as that box's Polygon
(containment, what `$box` means on MongoDB, unlike the overlap `bbox`).

**Bbox limits.** Every `bbox` coordinate must be finite, longitude in [-180,180] and
latitude in [-90,90], with min <= max on each axis and longitude width **strictly less than
180 degrees**. Exactly 180 or wider is refused on all three MQuery targets. The converter
throws; the `/geo/<object>/<field>/inBBox` route maps the refusal to HTTP 400. Split an
antimeridian viewport into two valid bbox requests/clauses; a whole-world view may omit the
filter. These are `bbox` limits, not a blanket restriction on explicit `shape` polygons or
the `$box` alias, which is lowered to a shape.

**Backend boundaries.** PostGIS bbox overlap uses planar `ST_Intersects` on `::geometry`
with `ST_MakeEnvelope`. MongoDB uses `$geoIntersects` with a GeoJSON ring on `2dsphere`,
with geodesic edges. Rows near a wide box's north/south edges, including points, can
differ. The contract is the question (overlap or containment), not an edge-exact row set.
PostGIS shape containment uses `ST_Covers` for Polygon/MultiPolygon and `ST_Within` for
other shapes; boundary inclusion is not universally identical. MongoDB's current
`$geoContains` lowering uses `$geoIntersects`: its contains-point intent is not a general
arbitrary-geometry containment guarantee. Elasticsearch emits `geo_bounding_box` for bbox,
`geo_polygon` for a Polygon shape and `geo_shape` otherwise; its bbox behaviour is not
specified here. See [Geography features](../capabilities/geography-features.md) for the
route and box-edge caveats.

A `$geoNear` with no `point` (including a null point), or a non-plain object operand, is
refused with a shape error naming the path on every backend. A point with absent or empty
`coordinates` instead matches nothing; present malformed coordinates are refused,
including non-finite values or a non-empty array that is not two finite numbers.
`$geoWithin` without a shape or bbox target, and `$geoContains` / `$geoIntersects` without
a shape target, also match nothing. Present malformed shape/bbox targets are refused.
Absent or empty targets lower to Elasticsearch `match_none`, a constant false SQL predicate,
or MongoDB's always-empty `_id` membership test. Each term logs one warning naming its path,
without operand values. The converter does **not** assemble a `bbox` from loose viewport
parameters (`southLat`, `westLng`, ...): the design builds the operand itself, e.g.
`{ "location": { "$geoWithin": { "bbox": [this.westLng, this.southLat, this.eastLng, this.northLat] } } }`,
and leaves the term out when the parameters are absent.

**An empty field name matches nothing.** A term whose field name is empty, blank, `"null"`
or `"undefined"` (what a computed key becomes when the name it reads resolved to nothing)
is lowered to the backend's match-nothing and logged with its path. In a conjunction the
whole clause selects nothing, and in an `$or` the other branches still answer. The term is
never dropped, because dropping it would widen the read.

### Update-time operators

A handful of `$`-tokens are *write*, not query. They are valid inside write fields
(`dataClauseItems[].value`, action `dataClause`) but do not make sense in a where clause.

| Operator | Where it applies |
|---|---|
| `$set` / `$setOnce` / `$unset` / `$default` | Write-side data-clause directives |
| `$add` | Array append on writes, see [Array mutation](array-mutation.md) |
| `$rem` | Array remove on writes, see [Array mutation](array-mutation.md) |
| `$addIf` | Array dedupe-append on writes, see [Array mutation](array-mutation.md) |
| `$inc` | Atomic numeric add on writes, done by the database, see [Numeric mutation](numeric-mutation.md) |
| `$dec` | Atomic numeric subtract on writes, see [Numeric mutation](numeric-mutation.md) |
| `$incIf` | Atomic numeric add under a `when` guard; zero rows is a typed 409, see [Numeric mutation](numeric-mutation.md) |
| `$append` / `$prepend` / `$clearAll` | String / aggregate field mutations |
| `$identify` | Marks a property as the identity key for upserts |

All of these are in the MScript validator's known-operator set.

### Boolean and date-range values

These are not `$`-operators. They are *value-handling* helpers beside the operator set. They
affect how a scalar reaches an existing operator (`$eq`, `$between`, …), not the operator
catalogue itself.

**Boolean query params.** Declared `Boolean` request parameters read from REST query/header
locations are converted to booleans by the generated service before validation or workflow
expressions run. Actual boolean values and exact `"true"` / `"false"` text are accepted;
other values return `400`. For `isArray: true`, conversion applies to each element after
the single-value array lift. Missing and null values stay missing/null. Body parameters and
non-REST readers keep their JSON types.

This is a declared-parameter reader contract, not a global query parser. Raw query values
without a declared `Boolean` request parameter are strings: `?active=true` is `"true"` and
`?active=false` is `"false"` in the raw query bag; nothing converts them. There is no
`$bool` operator; an MScript handler that reads an undeclared raw query value converts it
explicitly (e.g. `value === 'true'`).

**Date ranges.** There are no relative-date or named-window operators (`$today`,
`$lastWeek`, …). Bound a `$between` with plain values you compute in the expression: a
compiler may provide day-boundary helpers (start and end of a day, in server or named
time zone, returning ISO-8601 strings), but the contract is only that the operand is an
ordinary value, e.g. `{ createdAt: { $between: [this.dayStart, this.dayEnd] } }`.

## Cross-dialect operator semantics

A DataObject read (Postgres or MongoDB) and a DataView read (Elasticsearch) are meant to be
interchangeable from the caller's side: same filter language, different store. They are
**not** interchangeable for every operator. The first table shows what the basic operators
become on each backend; the second is the ruling on the operators whose meaning differs.

### Basic operators on each backend

The comparison, membership, range, existence and logical families lower to each store's
native primitive. They are pinned row-for-row across the three backends by conformance
suites, and the geospatial family has its own parity suite.

| Operator | Postgres (SQL) | MongoDB | Elasticsearch |
|---|---|---|---|
| `$eq`, a bare value | `= v` (`IS NULL` for `null`) | `{ f: v }` | `term` (`bool.must_not` `exists` for `null`) |
| `$ne` | `<> v` (`IS NOT NULL` for `null`) | `$ne` | `bool.must_not` `term` (`exists` for `null`) |
| `$gt` `$gte` `$lt` `$lte` | `>` / `>=` / `<` / `<=` | `$gt` / `$gte` / `$lt` / `$lte` | `range` with `gt` / `gte` / `lt` / `lte` |
| `$in`, a bare list | `IN (…)` | `$in` | `terms` |
| `$nin` | `NOT IN (…)` (an empty list is `1 = 1`) | `$nin` | `bool.must_not` `terms` |
| `$between` | `BETWEEN` (both bounds inclusive) | `{ $gte: lo, $lte: hi }` | `range` with `gte` / `lte` |
| `$nbetween` | `NOT BETWEEN` | `$not: { $gte: lo, $lte: hi }` | `bool.must_not` `range` |
| `$isnull` | `IS NULL` | `{ f: null }` (null or missing) | `bool.must_not` `exists` |
| `$notnull` | `IS NOT NULL` | `{ f: { $ne: null } }` | `exists` |
| `$exists` | as `$notnull` | `$exists: true` | `exists` |
| `$nexists` | as `$isnull` | `$exists: false` | `bool.must_not` `exists` |
| `$and` | `AND` | `$and` | `bool.must` |
| `$or` | `OR` | `$or` | `bool.should` |
| `$not` | `NOT (…)` | `$nor: [ <sub> ]` | `bool.must_not` |
| `$nor` | one `NOT` per member, joined by `AND` (`NOT a AND NOT b`) | `$nor` | `bool.must_not` with every member |

Two things follow from the table:

- **The operand of `$exists` / `$nexists` is ignored on all three.**
  `{ "f": { "$exists": false } }` still means "exists"; write `$nexists` (or `$isnull`)
  for "absent".
- **Negations over a nullable column split on NULL.** `$ne`, `$nin`, `$nbetween`, `$not`
  and `$nor` compare the column, so on Postgres a row whose column is NULL evaluates UNKNOWN
  and is not selected, while MongoDB and Elasticsearch select a document whose field is null
  or missing. Spell the null branch out when it matters (see
  [SQL and NULL](#logical-combinators) above).

### Rulings for the operators that differ

The operators listed below either converge because the converter translates for you, or
are ruled *backend-defined* and must not be used where a filter has to answer the same on
both sides. Absence from this table means "no ruling was needed", not "never checked".

For Elasticsearch `$ilike` and `$nilike` on the Node.js target, case equivalence comes from
[Unicode 17 CaseFolding.txt](https://www.unicode.org/Public/17.0.0/ucd/CaseFolding.txt)
statuses C and S, as defined by [UAX #44](https://unicode.org/reports/tr44/). This includes
cedilla, Cyrillic, all three sigma forms, long-s/S/s, Kelvin/K/k, and capital/lowercase
sharp-s. It excludes Turkic substitutions: ASCII I/i pair only with each other; dotted I
(U+0130) and dotless i (U+0131) each remain separate. Multi-character folds are excluded:
`ss` does not match sharp-s, and ligatures do not expand. There is no Unicode
normalization.

The mapping is bundled in the runtime; existing indices need no mapping change or reindex.
These are literal characters and classes in a
[Lucene regexp](https://www.elastic.co/docs/reference/query-languages/query-dsl/regexp-syntax),
with SQL LIKE wildcards translated and reserved punctuation escaped. `$like` remains
case-sensitive. As with every ES term query, the field's mapping decides the indexed terms
(an analyzed field is not a whole string). ES
[regexp limits](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-regexp-query)
still apply, including `index.max_regex_length` (default 1000 characters), determinization
limits and `search.allow_expensive_queries`. Case classes expand the pattern, so a long
needle can hit that limit sooner; a cluster refusal is an error, never a truncated pattern
or a different search.

| Operator | Postgres (SQL) | MongoDB | Elasticsearch | Ruling |
|---|---|---|---|---|
| `$like` `$nlike` `$ilike` `$nilike` | SQL `LIKE` / `ILIKE`; `%` and `_` are wildcards, backslash escapes the next character. Unicode folding follows the database collation | anchored `RegExp`; unescaped `%` becomes `.*` and `_` becomes `.`, with literal escapes preserved. `$ilike` carries the `i` flag; Unicode matching follows MongoDB's regex engine | `$like` uses case-sensitive `wildcard` (`%` to `*`, `_` to `?`). Node.js `$ilike` uses a whole-term `regexp` (`%` to `.*`, `_` to `.`), with explicit Unicode 17 default simple-fold equivalence classes and escaped literal characters; `$nilike` negates that clause | **Shared LIKE grammar and ASCII case matching.** Unicode matches follow each engine's rules; the Node.js ES policy above is locale-independent. Other targets need the same ES port |
| `$starts` `$nstarts` | `LIKE 'v%'` (literal prefix) | `RegExp('^' + escaped(v))` | `prefix` | **Portable.** Bare prefix, no wildcard, needle taken literally |
| `$ends` `$nends` | `LIKE '%v'` (literal suffix) | `RegExp(escaped(v) + '$')` | `wildcard`; the converter **prepends `*`** and escapes ES metacharacters | **Portable.** Bare suffix, no wildcard; the `*` is the converter's job, not yours |
| `$matchPhrase` `$nmatchPhrase` | *degrades* to `$match` (`@@`) | *degrades* to `$match` (regex) | `match_phrase`: adjacent, in order | **ES-exact, SQL/Mongo degraded.** Only Elasticsearch enforces word adjacency and order; the other two answer exactly what `$match` answers |
| `$match` `$nmatch` | Postgres full-text `@@` (tsquery over a tsvector: stemming, stop-words) | unanchored `RegExp` over the **escaped** needle: literal substring, **case-SENSITIVE** | analyzed `match`: tokenized, scored bag-of-words | **Backend-defined. NOT portable.** Three different retrieval models; there is no lowest common denominator to converge on. The *needle* is a literal on all three; the *retrieval model* is not. **Case is part of that:** the Mongo arm carries no `i` flag, so `{ "$match": "eta" }` selects `beta` and **not** `ETA report`, while the other two fold case only as far as their analysis does: Postgres lowercases during tsvector normalisation, and on ES it is the field's mapping that decides. On a `fulltextSearch` String property (and a DataView aggregate property copied from one) `$match` searches the analyzed `.ftext` sub-field, tokenized and lower-cased, so one word, a suffix or a differently-cased title all match; without `fulltextSearch` the String is a plain `keyword` and `$match` is a whole-value match, case-folded (`term` with `case_insensitive: true`). That mapping-aware lowering applies where the generated read knows the index mapping: every stored-DataView read (authored where clause and `?q=` search; the runtime `?filters=` `match` / `contains` / `notContains` operators) and every cross-service read of another service's object (a remote fetch or select join uses the target object's own mapping); a raw converter call without the text-field table keeps a bare `match`, which on a `keyword` field is an exact, case-sensitive whole-value match. There is no `$imatch`; use `$ilike` when you want a case-folded substring on all three |
| `$contains` `$ncontains` on an ARRAY column, **scalar** operand | `@>`: array containment | `$elemMatch: { $eq }`: element equality | `match`: an analyzed text query, **not** a containment primitive | **Backend-defined.** The SQL and Mongo arms agree; the ES arm agrees only when the field is mapped `keyword` (see below). Prefer `$overlap` for array membership, which is `terms` on ES and portable |
| `$contains` `$ncontains` on an ARRAY column, **list** operand | `@>`: the stored array contains **every** listed element | `$all`: same | `bool.must` of one `term` per element: same | **Portable on all three**, *for the positive arm, and on rows that have the field*. `$ncontains` negates the whole conjunction ("at least one missing"), not each element, and it inherits SQL three-valued logic like every other negated arm here: a **NULL or absent** array is dropped by SQL and **selected** by MongoDB and Elasticsearch, exactly as `$nin` / `$noverlap` diverge. An **empty** list operand is covered by the empty-list rows at the end of this table: match-nothing for `$contains: []` on all three, match-all for `$ncontains: []` with the same NULL carve-out |
| `$contains` `$ncontains` on a STRING column | substring | substring | on a stored-DataView read (its runtime `?filters=` `contains` too) and a cross-service object read: a `fulltextSearch` String is an analyzed `match` on `.ftext` **or** a case-insensitive substring `wildcard` on the keyword; a plain `keyword` String is the case-insensitive substring `wildcard`. Without the view's text-field table: bare `match` | **Backend-defined**, same reason. The generated DataView `?q=` search lowers through this row, so a partial or differently-cased word finds the row there |
| `$regex` (+ `$options: "i"`), **Node.js target only, see [regex support](#regex-support) above** | `~` / `~*`: POSIX regex, **unanchored** | `$regex` (+ `$options`): PCRE, **unanchored** | `regexp`: Lucene regex, **anchored to a whole term**; `case_insensitive: true` carries the fold | **Backend-defined on ANCHORING and on dialect, and this table describes the Node.js target only.** Anchor the pattern yourself (`^…$`) if you need the same answer on all three dialects. On ES the pattern is matched against one indexed *term*, so on an analyzed `text` field it sees tokens, not the field's text (same mapping dependence as `$contains`, see below). Regex *dialects* differ too: POSIX ERE, PCRE and Lucene are not the same language beyond the common core. On other targets `$regex` is refused, silently dropped, or something else again, not uniformly per language |
| `$overlap` `$noverlap` on a **SCALAR** column (generated where-clause) | *degrades* to `IN` / `NOT IN` | *degrades* to `$in` / `$nin` | `terms` (unchanged: it is already the membership test) | **Degraded to `$in` / `$nin` on all three, and the degrade IS the ruling.** `$overlap` asks "does the stored side share an element with the operand list"; when the stored side is a scalar that question IS `$in`. Without the degrade the three dialects would not even fail alike: Postgres throws on `varchar && text[]` (the `{ roleId: { $overlap: ['staff'] } }` shape on the auth user object, whose `roleId` is an array only under `usersHaveMultipleRoles` and a scalar on a single-role project), Mongo's `$elemMatch` matches nothing, ES answers correctly. Applies to columns the generated api KNOWS are scalar; array columns and unknown fields keep the authored operator, and a field map that spells `$overlap` beside `$in` is left untouched. A lone scalar operand is lifted to a one-element list |
| `$contains` `$ncontains` on a **SCALAR** column (generated where-clause) | *degrades* to `IN` / `NOT IN` | *degrades* to `$in` / `$nin` | *degrades* to `terms` / negated `terms` | **Degraded on all three, and the degrade IS the ruling.** `$contains` asks "does the stored side contain EVERY listed element"; a scalar stored side is the one-element set `{c}`, which is a superset of the operand list only when that list names ONE distinct value. So exactly one distinct operand becomes `$in: [v]` (identical row set), and zero or two-or-more distinct operands become `$in: []`, the explicit match-NOTHING list, which is also what `$contains: []` answers on an array column. `$ncontains` is the exact complement through `$nin`, whose empty-list arm is match-ALL. Without the degrade Postgres would throw the same error as for `$overlap`, and the authoring pressure is the same: the docs promise `roleId` is a list under `usersHaveMultipleRoles`, while a single-role project stores a scalar. Same conservatism as the `$overlap` row: only known scalar columns, never a field map that also spells `$in` / `$nin`, and an operand carrying a non-primitive element keeps its authored operator |
| bare value, bare list, `$in` `$nin`, scalar `$eq` `$ne` on an **ARRAY** column (generated where-clause, runtime `filters`, and the by-MQuery data-layer helpers that workflow actions and library code call; Node.js) | *lifted* to `&&` / `NOT (… && …)` (`$overlap` / `$noverlap`) | unchanged: `$in` / `$nin` / equality already test array membership | unchanged: `terms` / `term` already test element membership | **Lifted on Postgres, and the lift IS the ruling.** The mirror of the two degrade rows above. An `isArray` property is an array column and the SQL layer escapes every operand of a term against it as an array, so `{ tags: 'x' }`, `{ tags: ['x', 'y'] }` (the `$in` shorthand), `{ tags: { $in: [...] } }`, `$nin`, and a scalar `$eq` / `$ne` would throw. They are rewritten to the MEMBERSHIP test on the raw MQuery before conversion: a bare scalar `v` becomes `$overlap: [v]`, a list or `$in` becomes `$overlap`, `$nin` becomes `$noverlap`, scalar `$eq` / `$ne` become `$overlap: [v]` / `$noverlap: [v]`: the row set MongoDB and Elasticsearch answer, and the operator the declared list filter uses. **Exact-array equality keeps its explicit spelling** (`{ tags: { $eq: ['x', 'y'] } }`, see the row below). Not touched: an empty list (already match-nothing / match-all), a null value, a list with a null or object element, scalar columns, and MongoDB services (their `$in` also matches rows that store a scalar, which `$elemMatch` would drop). `$noverlap` inherits the NULL carve-out of the row at the end of this table |
| `$eq` / `$ne` with an **array** operand | whole-value comparison (`= ARRAY[…]`) | whole-document inequality | **refused**: `400 ARRAY_EQUALITY_NOT_SUPPORTED_ON_ELASTIC` | **Inexpressible on ES.** ES indexes an array field element-wise and has no whole-array equality, and `term` takes one scalar. Use `$in` / `$nin` / `$overlap` / `$noverlap` for the membership test |
| `$in` `$overlap` `$contains` with an **empty** list | `IN ()` / `&& ARRAY[]`: always false | `$in: []`: never matches | `terms: []`: zero hits | **Portable, and MATCH-NOTHING is the meaning.** See below. `$contains: []` is lowered through the same `$overlap` arm rather than "contains every element of the empty set", which would be vacuously true |
| `$nin` with an **empty** list | `1 = 1`: always true, and it names no column, so NULL rows are selected too | `$nin: []`: excludes nothing | `must_not: { terms: [] }`: negates a match-nothing | **Portable, and MATCH-ALL is the meaning**: the NEGATED half of the row above, inverting its verdict. Excluding nothing selects everything, on all three, NULL rows included. The SQL arm says so explicitly (`1 = 1`), so the term keeps its meaning inside a `$or` and under a `$not` |
| `$noverlap` `$ncontains` with an **empty** list | `NOT (… && ARRAY[])`: true for a row that HAS the array; **UNKNOWN**, so NOT selected, where the column is NULL or the field is absent | excludes nothing, NULL/absent rows **included** | excludes nothing, NULL/absent rows **included** | **MATCH-ALL only over rows that have the field, and NOT portable past that.** These lower to a term that REFERENCES the column, so SQL three-valued logic drops the rows `$nin`'s bare `1 = 1` keeps. Over the same four rows SQL answers `['a','b','c']` while Mongo and Elasticsearch both answer `['a','absent','b','c']`. It is the same NULL carve-out the `$ncontains` list-operand row above describes, not a separate defect. `$nin: []` is the only member of this family that earns both words |

> **The pattern operators agree on the needle and on case.** On MongoDB the `$like` family
> is an anchored regular expression built from the SQL `LIKE` pattern with every regex
> metacharacter in the needle escaped, and `$starts` / `$ends` / `$match` take the needle
> literally too, so `.` / `*` / `+` and an unbalanced `(` from a search box are ordinary
> characters. `$like` is case-sensitive and `$ilike` case-insensitive on MongoDB, and
> `$ilike` folds case on Elasticsearch. Some targets build the MongoDB pattern differently
> (for example a raw unanchored, case-insensitive `$regex` that reads the needle as a regular
> expression), so cross-target conformance is written to the operators' *portable core*:
> whole-value needles with no wildcard and no metacharacter.

> **`$contains` with a LIST operand means superset on all three.** Postgres `@>` (the stored
> array contains every listed element), MongoDB `$all`, and Elasticsearch a `bool.must` of
> one `term` per element. The **scalar** operand is the backend-defined row above.

Two more are worth spelling out.

### An empty list is a filter, not an omission

`{ "tagIds": [] }`, and its long spellings `{ "$in": [] }` / `{ "$overlap": [] }`, means
**match nothing**, on every backend. It is not coerced to "no filter" and it is not refused
with a `400`.

That is a decision, not an accident. The API-parameter layer immediately upstream ruled the
same way: a declared filter parameter treats `undefined`, `null` and `""` as absence and
deliberately **excludes** `[]`, under the principle *the array/scalar choice is the
caller's and this guard does not touch it*. Coercing an empty list to "unfiltered" would
silently **widen** a read the caller narrowed. Refusing it would break the generated
id-list filters, whose source list is legitimately empty when a join matched no rows, and
an empty page is the correct answer there, not an error.

**If you mean "no tag filter", omit the key** (or send an empty string on a query-string
surface). Both are absence.

The **negated** spellings invert that verdict rather than sharing it: `{ "$nin": [] }` /
`{ "$noverlap": [] }` / `{ "$ncontains": [] }` mean **match everything**, because excluding
nothing excludes nothing. That is the same rule, read from the other side.

For `{ "$nin": [] }` the three backends deliver it exactly, rows with a NULL column
included, and all targets agree. The two ARRAY spellings do not reach that far:
`{ "$noverlap": [] }` and `{ "$ncontains": [] }` lower to `NOT (col && ARRAY[])`, which
names the column, so under SQL's three-valued logic a row whose array is NULL or absent
evaluates **UNKNOWN** and is dropped, while Mongo and Elasticsearch select it. So they are
match-all over the rows that HAVE the field, and not portable past that. It is the NULL
asymmetry every *column-referencing* negated arm in this table already carries, inherited
rather than invented. `$nin` escapes it only because `1 = 1` mentions no column.

It is still a *term*: the SQL arm renders an explicit `1 = 1` rather than an empty
fragment, so an arm of a `$or` widens the union as it should, and
`{ "$not": { "$or": [ …, { "f": { "$nin": [] } } ] } }` selects no rows, as it does on Mongo
and Elasticsearch.

If you *meant* "match nothing", the positive spelling is the one that says it:
`{ "$in": [] }`.

### `isArray Text` columns are mapped `keyword` on Elasticsearch

An `isArray` `Text` property is indexed as `keyword` (exact-match) rather than analyzed
`text`, so array membership means the same thing as the Postgres `text[] && ARRAY[…]` it
mirrors: a row whose `tags` hold `"blue jacket"` matches a filter for `"blue jacket"` and
**not** one for `"blue"`, on both backends.

Two consequences to know about:

* An array **element** longer than 8191 characters is not indexed (`ignore_above`), so it
  matches no filter. The alternative is worse: a `keyword` term over Lucene's 32766-byte
  limit makes Elasticsearch reject the **whole document**, which would leave the row present
  in the database and missing from the mirror.
* A **scalar** `Text` column is unchanged: still analyzed `text`. It is prose, its filters
  are `$match` / `$contains`, and there is no array-membership semantic there to agree
  about.

### Where these rulings are implemented

These translations are properties of the compiled service, not of the blueprint. A filter
that relies on a translation in the table above needs the target's converter to carry it
too; every compiler is expected to implement the same rulings. See
[the compiler specification](../../compiler/index.md).

## Field paths

Field names address columns on the data object you are querying. Dotted paths reach into:

- JSON / object-typed properties: `metadata.region`.
- Array-of-objects elements paired with `$elemMatch` (see above).

Relation-qualified where keys such as `customer.tenantId` are refused at design time with
`MSCRIPT_MQUERY_UNKNOWN_COLUMN` when `customer` names a relation of the filtered object.
The generated service issues no SQL join for these keys. Filter on the foreign-key column
or fetch the related object first; query a stored DataView for a projected cross-object
field.

References to the runtime context (`this.session.userId`, a request parameter
`this.orderId`, action results) are JS expressions inside the filter, not field paths. They
appear on the right-hand side of an operator:

```js
({ userId: { $eq: this.session.userId } })
```

There are no `$session` / `$now` reserved roots. Use the MScript runtime values directly.

## Implicit AND vs explicit combinators

Top-level keys are AND'd:

```json
{ "status": "active", "workspaceId": "t_1" }
```

To OR them, wrap explicitly:

```json
{ "$or": [
    { "status": "active" },
    { "workspaceId": "t_1" }
] }
```

`$and` becomes useful when you need two predicates on the same field (otherwise the second
clobbers the first in the object literal):

```json
{ "$and": [
    { "age": { "$gte": 18 } },
    { "age": { "$lt":  65 } }
] }
```

Equivalent shorthand on the same field:

```json
{ "age": { "$gte": 18, "$lt": 65 } }
```

## Worked example

A list-orders API that returns published, recent, well-engaged orders for the caller's
tenant. Authored as JS:

```js
({
  $and: [
    { workspaceId: { $eq:    this.session.workspaceId } },
    { status:    { $eq:      'published' } },
    { createdAt: { $gte:     this.startDate } },
    { $or: [
        { views: { $gte: 1000 } },
        { likes: { $gte:  500 } }
    ] },
    { tags:      { $overlap: ['technology', 'science'] } }
  ]
})
```

That expression is what you write into the `fullWhereClause` MScript string in the
blueprint:

```json
{
  "fullWhereClause": { "js": "({ \"$and\": [ { workspaceId: { \"$eq\": this.session.workspaceId } }, { status: { \"$eq\": \"published\" } }, { createdAt: { \"$gte\": this.startDate } }, { \"$or\": [ { views: { \"$gte\": 1000 } }, { likes: { \"$gte\": 500 } } ] }, { tags: { \"$overlap\": [\"technology\", \"science\"] } } ] })" }
}
```

## Filter objects across languages

A filter is just an MScript object literal, so it is translated like any other MScript when
the service targets a non-Node.js language. **The `$`-operator set and the wire semantics
are identical across targets**: the converter for each language consumes the same operator
catalogue. (Identical across *languages*, that is. What an operator means can still differ
across the three *backing stores*, see the [ruling table](#cross-dialect-operator-semantics),
and that difference is the same in every language.) What changes is (a) the
**context-reference binding** (`this.` becomes `self.` in Python, indexed access in Rust)
and (b) the **host object-literal syntax**. For a simple clause such as
`({ workspaceId: { $eq: this.session.workspaceId } })`, a translator emits a dictionary with
a `self` binding in Python, a map literal in Go, a JSON value with indexed access in Rust,
a map in Java and a dictionary initializer in C#: same shape, idiomatic literal. Write the
clause once in JS and it ports to every target; only switch to a per-language source when
you need a native idiom the translator cannot produce. See
[Writing MScript across languages](overview.md#writing-mscript-across-languages).

## Common gotchas

- **Unknown `$`-tokens are caught at validation time.** The validator's
  `MSCRIPT_UNKNOWN_OPERATOR` pass rejects any `$`-prefixed key that is not in the catalogue
  above. If you really want a field named `$something`, give the data object a property
  without the `$`; property names that start with `$` are unsupported.
- **`null` vs missing.** SQL backends fold them together; Mongo and Elastic distinguish.
  Use `$exists` / `$nexists` when you specifically need "field absent."
- **Type coercion.** The operators are forwarded to the backend verbatim.
  `{ "age": { "$eq": "18" } }` is a string compare in Postgres, not an integer compare.
  Coerce on the MScript side (`Number(this.ageString)`) or at the wire layer.
- **`$contains` is overloaded, and backend-defined.** On a `String` column it means
  substring; on an array column it means element membership. The converter picks the right
  SQL based on the column type, but the *Elasticsearch* arm is an analyzed `match` in both
  cases, not a containment primitive, so it does not always agree. See the
  [ruling table](#cross-dialect-operator-semantics); prefer `$overlap` for array
  membership, which is portable.
- **`$match` is not portable.** Postgres full-text `@@`, a Mongo substring regex and an
  Elasticsearch analyzed `match` are three different retrieval models under one operator
  name. Use it where the backend is known; see the
  [ruling table](#cross-dialect-operator-semantics). On a stored DataView (and on a
  cross-service read of another service's object), a `$match` on a String path only
  tokenizes when the source property carries `indexSettings.fulltextSearch: true` (the
  `.ftext` sub-field); otherwise it is a whole-value match, case-folded.
- **Right-hand JS evaluates before the query.** `{ a: this.x ?? null }` produces
  `{ a: null }` when `this.x` is undefined, which matches rows where `a IS NULL`. To skip
  the clause entirely, build the object conditionally with an IIFE.
- **An `undefined` value that empties your clause is refused.** On a read, an authored
  `whereClause` (the api's own clause, a joint-filter clause, a `fetchObject` /
  `fetchStats` action's clause) whose value resolves to `undefined` (`{ id: this.orderId }`
  with no `orderId`) fails with a typed `400` (`errorCode: MQUERY_UNDEFINED_VALUE`) naming
  the key (`keys: ['id']`) when the undefined value leaves the clause unable to match ANY
  row, instead of answering an empty list, a `null` fetch or a 404 that blames the data.
  Two exceptions are deliberate: an undefined value inside an `$or` branch is just dropped
  while another branch answers
  (`{ $or: [{ isPublic: true }, { ownerId: this.session.userId }] }` stays public-only for
  an anonymous caller), and the framework's own ownership / tenant pins fail closed to
  match-nothing. To filter only when a value is present, gate the term (an
  `additionalClauses` entry with a `condition`, or `this.x != null ? { a: this.x } : {}`),
  and to answer "nothing" deliberately, say so: `{ id: { $in: [] } }`.
- **Cross-table joins.** A relation-qualified where key does not add a SQL join. Validation
  refuses a static key such as `customer.tenantId` with `MSCRIPT_MQUERY_UNKNOWN_COLUMN`
  when its root names a relation of the filtered object. Filter its foreign-key column,
  fetch the related object first, or query a projected `DataView`.

## See also

- [Syntax](syntax.md): the base MScript grammar.
- [MScript overview](overview.md#writing-mscript-across-languages): the per-language
  context-binding table.
- [Filters and lists](../business-apis/list-api.md): list-API wire shape and runtime
  translation.
- [Array mutation](array-mutation.md): the write-side `$`-operators.
- [Numeric mutation](numeric-mutation.md): `$inc` / `$dec` / `$incIf` and the `$col` guard.
- Specification: [`MScript`](../../spec/MScript.md).
