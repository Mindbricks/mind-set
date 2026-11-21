---
title: Rules the validator enforces
---

# Rules the validator enforces

A semantic validator reports mistakes that a schema cannot express. These five are
**blueprint rules**: they describe how to write an expression or a library body so that
the compiled service does what the author meant. A compiler may report them under the same
code; the rule holds either way.

| Code | Severity | The mistake |
|---|---|---|
| `FETCH_SCALAR_CONSUMED_AS_LIST` | error | a fetch that returns one object is consumed as a list |
| `MSCRIPT_ASYNC_LIB_NOT_AWAITED` | error | a library promise is read before it is awaited |
| `OPTIONAL_FETCH_RESULT_READ_UNGUARDED` | warning | a field is read off an optional fetch result that can be null |
| `SECONDARY_KEY_NOT_DISCOVERABLE` | warning | a request binds a secondary key that no public read exposes |
| `LIB_UNDECLARED_IDENTIFIER` | warning | a library body uses a name that is never declared |

## `FETCH_SCALAR_CONSUMED_AS_LIST`

A [`FetchObjectAction`](../actions/fetch-object-action.md) has `isArray: false` by
default: it produces **one object**, or an absent result when it is optional. Using that
context as a list is the mistake: calling `.map`, `.filter`, `.some`, `.every` or another
list method on it, or naming it as the `sourceList` of a
[`ListMapAction`](../actions/list-map-action.md) or the `loopFor` of a
[`LoopAction`](../actions/loop-action.md).

- **Fix:** set `isArray: true` on the fetch when you want a list.
- `(this.found ?? [])` handles absence only. It cannot turn a matching object into an
  array. Whether a field is required or nullable does not change the cardinality either.
- A deliberate conversion to an array is valid. A fetch that runs from a schedule must run
  before its reader for the check to establish the shape; when the order cannot be proven,
  the check abstains.

## `MSCRIPT_ASYNC_LIB_NOT_AWAITED`

`LIB.dataViews.<name>(filter?, options?)` returns a **promise of rows**. Await it before
you read members, test its value or consume its rows: `(await LIB.dataViews.quickView({})).length`
reads the resolved list length; `LIB.dataViews.quickView({}).length` reads the promise.
The same holds for a static bracket key. A dynamic member name is not checked.

The same family warns about shapes the compiler cannot repair on its own, and which fail
the build in a service whose expressions are asynchronous by nature:

- a library call whose result is negated, compared or tested inside a **synchronous**
  callback (`MSCRIPT_LIB_CALL_IN_SYNC_CALLBACK`);
- `const r = LIB.<fn>(...)` whose `r` is read as a value where an automatic await cannot be
  inserted: the declaration sits in a synchronous callback, `r` is also used as a promise
  (`.then`, `await r`), or it is re-assigned (`MSCRIPT_LIB_RESULT_VAR_NOT_AWAITED`);
- a nullable manager member (`const p = this.instance`) dereferenced or destructured with
  no null guard before it (`MSCRIPT_NULLABLE_MEMBER_UNGUARDED`).

## `OPTIONAL_FETCH_RESULT_READ_UNGUARDED`

An optional single-row fetch (`isRequired` false, which is the default, and `isArray`
false) leaves its context property **`null`** when no row matches. Only an info log line
(`FetchActionResolvedNothing`) records it. A later slot that reads a field off that value
with no guard (`this.product.stock`, or the loop copy `line.product.stock` when both
actions are inner actions of one loop) is the warning. Three remedies:

1. **guard the read:** `this.product?.stock`, or a null or truthiness test in the same
   expression;
2. put a **`condition`** on the consuming action that tests the value (a bare
   `this.product` is enough);
3. declare the fetch **`isRequired: true`** when a missing row is an error: the API then
   answers 404.

A guard action scheduled between the fetch and the reader also counts. An action that no
workflow stage schedules never runs and guards nothing. A consumer whose `condition` is the
literal `false` never runs and is not flagged. The check abstains when another action
writes the same name, a script assigns it, or the order of the two actions cannot be
proven.

## `SECONDARY_KEY_NOT_DISCOVERABLE`

An explicit request binding (a `query.dataClauseItems` entry, or a `whereClause.selectBy`
parameter) needs a column that is both `unique` and `isSecondaryKey` on the target object,
and no statically known **public get or list** exposes that column. A client that only
knows the secondary key then has no way to find out the value it must send.

- If clients must discover the value, provide an authorised read that selects it
  explicitly (an omitted or empty select list is a full read; a select that contains the
  key, including the `key:alias` spelling, counts), or document another supported source.
- Review privacy before exposing a key. An intentionally private key may stay private: the
  advisory never adds columns, changes authorisation or blocks validation.
- Internal-only reads and routes hidden by a controller binding do not count as discovery.
  Other transports, DataView reads, authored workflows and projections that cannot be
  classified are treated as unknown, and **unknown is never reported as absent**.

## `LIB_UNDECLARED_IDENTIFIER`

A library function or edge-function body (the code you write in `library`) uses a name it
never declares. For example `hub.register = () => {}; module.exports = hub;` warns that
`hub` is undeclared. Declare the name locally, or obtain it through an explicit
`require`/import or through `LIB` / `API`. The warning names the module, the service, the
kind (`library` or `edge`), the identifier, and the line and column (one-based).

A compiler refuses a body whose undeclared name can throw a reference error at runtime, so
the warning is an early notice of a build failure. The names that the runtime provides
(the language's own globals, `LIB`, `API`) are not undeclared. When the scan itself cannot
run, a validator reports `LIB_UNDECLARED_SCAN_UNAVAILABLE`: the absence of findings in that
answer does not certify a clean scan.

## Related checks

- `FETCH_STATS_RESULT_USED_AS_NUMBER` (warning): a stats fetch stores an **object**
  (`{ count: 0 }`, keyed by stat label such as `count` or `sum-price`) or, with `bucketBy`,
  an array of buckets, never a bare number. `this.existingWorkCount === 0` compares the
  object and is false on every request. Read the stat off the value:
  `this.existingWorkCount.count === 0`.
- `MSCRIPT_MQUERY_FIELD_NOT_IN_VIEW` (warning): a stored DataView filter addresses only the
  projected columns, `id` and aggregate paths. If `offer.total` is an aggregate field, a
  flat `{ total: { $gte: 1 } }` cannot address it; write `{ 'offer.total': { $gte: 1 } }`.
- `INTERSERVICE_PATH_PARAM_UNBOUND` (error): route parameters come only from the route
  pathname, before the first `?` or `#`. Colon literals in a query or fragment are not path
  bindings.
