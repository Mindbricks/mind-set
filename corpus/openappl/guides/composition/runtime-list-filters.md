---
title: Runtime list filters
---

# Runtime list filters

Runtime list filters let a list API accept caller-driven filtering,
search, sorting, and saved filters *at request time* — without the
author pre-declaring every predicate. The same block applies uniformly
to a DataObject-sourced list (a where-clause on the object's database)
and a DataView-sourced list (search-index queries). It is the dynamic
counterpart to the static [`WhereClauseSettings`](where-clause-composition.md)
and `listSortBy`.

## What it is

`ListRuntimeFilterSettings` is four independent opt-in flags plus
optional allow-lists. Each flag turns on one runtime capability:

| Flag | Default | Enables |
|---|---|---|
| `filtersEnabled` | `false` | A structured `filters` POST body with operator-based per-field criteria. |
| `searchEnabled` | `false` | A runtime `?q=` query parameter for full-text search across `searchedFields`. |
| `sortEnabled` | `false` | Runtime `?sortBy=&sortOrder=` query parameters (static `listSortBy` becomes the default). |
| `savedFiltersEnabled` | `false` | Auto-generated `/filters` aux endpoints + a per-service `listSavedFilter` DataObject. |

## Which block activates it

`BusinessApi.query.listOptions.runtimeFilters` (type
`ListRuntimeFilterSettings`), on a `list`-type API. Pagination is
configured separately on `query.paginationOptions`.

## What it emits

- **`filtersEnabled`** — the API accepts a `filters` body and
  compiles each entry into a WHERE fragment (database source) or a
  search-index query clause, using the shared operator vocabulary below.
- **`searchEnabled`** — `?q=` is routed through the existing
  `ListSearchFilter` search-index bridge for DataObject sources, or
  a native multi-field text match for DataView sources (see
  [Search filters](search-filters.md)).
- **`sortEnabled`** — `?sortBy=&sortOrder=` overrides `listSortBy`. The
  value must name a field of the sort allow-list (see "Allow-lists" below);
  any other value, including a column that does not exist, is refused with
  `400` and `errorCode: "INVALID_SORT_FIELD"` (the allowed set rides the
  problem body's `errors`), never passed to the database.
  When the api also declares
  [keyed order sets](list-options.md#keyed-order-sets), a selector value
  that matches a set key wins over the runtime sort; a value that matches
  no key defers to the runtime `?sortBy=` (when it names an allowed
  field), and both fall back to `listSortBy`. Do not name the selector
  parameter `sortBy` on a `sortEnabled` api: the enum vocabulary check
  then rejects every raw property name before the runtime sort can read
  it (`LIST_ORDER_SELECTOR_SHADOWS_RUNTIME_SORT`).
- **`savedFiltersEnabled`** — the service generates three auxiliary
  endpoints next to this API at `<routePath>/filters` (`GET`, `POST`)
  and `<routePath>/filters/:filterId` (`DELETE`), plus a per-service
  `listSavedFilter` DataObject. A `listSavedFilter` you author yourself
  replaces the generated one and must keep its columns: `userId`
  (the owner field), `apiName`, `filterName` and `filterPayload` (an
  ERROR, `SYSTEM_OBJECT_CONTRACT_MISSING_COLUMN`, when one is missing),
  and `sortPayload` / `searchTerm` (a WARNING). Saved-filter rows are scoped to the
  calling user (`userId` is the owner field), and the aux endpoints
  inherit this BusinessApi's own gate so they are never more permissive
  than the API they derive from: `checkRoles` and `absoluteRoles` are
  copied, and a `permissionCheck` is carried over as its
  unscoped `{ permission }` (scope fields name this API's row columns,
  which preset rows do not have). When a `permissionCheck` is carried
  over, `checkRoles` is NOT copied beside it — the native resolver
  supersedes the flat role list. Preset rows are not tenant-scoped (the
  owner check scopes them, and an absolute role skips that check), so
  where this API's tenant filter is in force only the platform operators
  `superAdmin` / `saasAdmin` stay in the aux endpoints' `absoluteRoles`;
  any other absolute role of this API (`tenantAdmin`, `tenantOwner`, an
  author-defined role) is added to a non-empty `checkRoles` instead, so its
  holder keeps their OWN presets but never reaches another tenant's.
  The aux endpoints always demand a
  login (even under a public parent) and never inherit `M2MAllowed`,
  `apiInSaasLevel` or `requiredCallerKind` — presets are a
  human-session surface.

## Operator vocabulary

The `filters` body uses the shared `RuntimeFilterOperator` set — the
single source of truth for every database engine and the search index:

| Operator | Meaning |
|---|---|
| `eq` / `noteq` | Equals / not equals. |
| `in` / `notin` | Matches any / none of `values[]`. |
| `gt` / `gte` / `lt` / `lte` | Comparisons. |
| `range` | `values[] = [low, high]`; `gte low AND lte high`. |
| `exists` / `missing` | Field present / absent. |
| `isNull` / `notNull` | Synonyms for `missing` / `exists`. |
| `match` / `matchPhrase` / `matchPhrasePrefix` | Full-text match (search index) / `ILIKE` (SQL). On a stored DataView, `match` on a String column searches the analyzed `.ftext` sub-field when the source property has `indexSettings.fulltextSearch: true` (one word, any case), and is a case-folded whole-value match on a plain keyword String - the same lowering as an authored `$match`. `matchPhrase` is adjacent-and-in-order on the search index only — it **degrades to `match`** on the SQL / Mongo side. |
| `contains` / `notContains` | With a SCALAR `value`, a case-insensitive substring `*value*` (on a stored DataView: the analyzed `.ftext` word match OR the case-insensitive substring of a `fulltextSearch` String, the substring alone on a plain keyword String, with `*` / `?` / `\` in the value taken literally). With a LIST `value` (`["news","tech"]`) it is array **superset containment** on every store and on both legs: the stored array holds every listed element, and `notContains`'s negation is around the WHOLE conjunction ("at least one is missing"), not per element. An EMPTY list is the explicit *match-nothing* filter for `contains`, not "no filter" - and `notContains []` is therefore its negation, which selects EVERY row. The same reading applies to a DataView-backed API as to a DataObject-backed one. |
| `starts` / `ends` | Prefix / suffix match. |
| `wildcard` | Caller-supplied wildcard pattern — `*` is any run, `?` is exactly one, `\` escapes either. On the DataObject path the grammar is translated into `$like`'s `%` / `_`. A `%` or `_` **already in the pattern** is the one thing the translation cannot carry across: it stays an ordinary character on the search index and becomes a wildcard under `$like`, because a literal one needs SQL's `ESCAPE` clause and MQuery has no operand for it. `{"wildcard":"100%"}` selects the literal `100%` on a DataView and everything starting with `100` on a DataObject. |
| `regexp` | Caller-supplied regular expression. **Off by default**: it is available only on an API that names it in `allowedOperators`. See [`regexp` is opt-in](#regexp-is-opt-in) below. The stores' regex dialects and anchoring differ, and a compiler target may lower `regexp` on the DataObject path to a literal `$like` substring test instead of a real regex (see [Language support for `regexp`](#language-support-for-regexp)). |

Restrict the set per API with `allowedOperators`. When it is `null`, the
full set *except `regexp`* is allowed — see
[`regexp` is opt-in](#regexp-is-opt-in) below.

### `regexp` is opt-in

`regexp` is default-deny: the filter validation refuses it with
`OPERATOR_NOT_ALLOWED` unless the API names it in `allowedOperators`.
Every other operator lowers to a bounded store primitive; `regexp`
lowers to a caller-supplied program for a
**backtracking** engine - Postgres's `~` and MongoDB's PCRE2 - where a
six-character pattern such as `(a+)+$` costs ~10 s of a database
worker on a thirty-character value. Turn it on deliberately, on APIs
whose callers you trust, and prefer `starts` / `ends` / `contains` /
`wildcard` (all bounded) where they express the same intent.

Even on an API that opts in, the pattern is passed through a construct
scan at the request boundary. Two families are refused with
`UNSAFE_REGEX_PATTERN`, plus anything over 256 characters:

* a quantified GROUP whose body can itself backtrack (`(a+)+`,
  `(a*)*`, `(a|a)+`), **unless the body carries a delimiter** - see
  "the delimited-list idiom" below; and
* variable-length quantifiers that can TRADE characters with each
  other, at any nesting depth (`a*a*a*a*b`, `[a-z]*` nine times,
  `.*e.*e.*e.*e.*`, `a{0,9}` eight times, and
  `a*a*a*b*b*b*c*c*c*Z` - see the next bullet). Each such term
  multiplies the number of ways the engine can split the value between
  them.

Five things about the second family are worth knowing before you write
a pattern for an opted-in API:

* The whole pattern is priced as ONE product. Segments over DIFFERENT
  character sets do not get separate budgets: the engine re-explores
  every split of the second segment for every split of the first, so
  `a*a*a*b*b*b*c*c*c*Z` costs the product, not the worst segment. That
  pattern is 19 characters and measured 434 ms per row against a
  48-character value; the four-segment version measured 4.4 s.
* One quantifier may trade with one other, and no more. `.*foo.*` and
  `a*a*b` stay allowed - they are the everyday `contains` shapes. A
  THIRD trading term (`a*a*a*b`), or a second trading PAIR anywhere
  else in the pattern (`a*a*b*b*Z`), is refused: measured against a
  256-character value, one pair costs up to 4 ms and two cost 108 ms.
  `.*foo.*bar.*` is refused for the same reason, and that is a
  deliberate false positive. What to do instead: ONE `matchPhrase`,
  `wildcard` or `contains` filter, or filter on the first term here and
  pre-compute the second into a stored column. **Not** "two `contains`
  filters" - a filter body is `{ [field]: criterion }`, exactly one
  criterion per field, so two criteria on the same field are not
  expressible on this surface at all.
* **Alternation branches ADD.** The engine tries each in turn, so `k`
  branches cost `k` times what one costs, and the budget is the sum.
  `^(true|false|yes|no)$` costs 4 and `\.(jpg|jpeg|png|gif|webp)$`
  costs 5, both far inside it; two branches of `a*a*Z` cost 64 and are
  refused. This is the same rule as the product above and not a
  separate one: `a*a*Z|a*a*Z` and `a*a*Za*a*Z` are the same engine
  work, so they get the same verdict.
* Being *bounded* does not exempt a quantifier. `a{0,9}` eight times
  and `a?` twenty times are the same family, and were measured in
  seconds per row.
* A MANDATORY atom whose character set is DISJOINT from a quantifier's
  ends that quantifier's freedom, because the split is pinned to it.
  That is why `^\d+\.\d+\.\d+\.\d+$` (four-part version or IPv4),
  `^\w+\s+\w+\s+\w+\s+\w+$` (a four-word phrase search),
  `^[^,]+,[^,]+,[^,]+,[^,]+$` (a four-field CSV row), `\d+[a-z]+`,
  `^\s*[0-9]+\s*$` and `^[A-Z]+-\d+-[a-z]+$` all cost ONE and keep
  working. A separator the quantifier CAN match pins nothing, which is
  why `.*e.*e.*e.*e.*` is still the hazard it looks like.

### The delimited-list idiom

A quantified group is normally refused when its body can backtrack, and
that would take the whole unrolled-list family with it. It does not,
because of one carve-out: a body carrying a **delimiter** is linear
however many times the loop runs.

A delimiter is a MANDATORY atom that offers no repetition choice of its
own, whose character set is **disjoint from every repeatable atom in the
same body**. Such an atom appears exactly once per iteration and nothing
in the body can absorb it, so the number of iterations is decided by the
value rather than chosen by the engine. That is what keeps these
working, all measured under 0.01 ms against a 1024-character value:

```
^[a-z0-9]+(-[a-z0-9]+)*$        a slug
^#[a-z]+( #[a-z]+)*$            a tag list
^([a-z0-9-]+\.)+[a-z]{2,}$      a domain
^(/[a-z]+)+$                    a path
^([0-9a-f]{1,4}:)+[0-9a-f]{1,4}$   IPv6
^(\S+ ){4}\S+$                 a five-field log line
^\d{1,3}(,\d{3})*(\.\d{2})?$   a formatted amount
```

**Two conditions, not one.** The delimiter pins where an iteration ENDS;
it says nothing about how the engine may split the characters INSIDE
one. So the body must ALSO be unambiguous on its own terms - it has to
cost one by the rules above. `^(\w+\w+,)+$` is twelve characters, has a
perfectly good delimiter, and is refused, because its body holds two
quantifiers that can trade: it measured over 20 seconds against a
253-character non-matching row, growing 0.07 ms at five blocks to past
30 s at twelve. The written-out form of the same language,
`^[a-z]+[a-z]+,[a-z]+[a-z]+,Z$`, is refused too; the two spellings
agree.

**What this costs, stated plainly.** The carve-out does not reason about
alternation, so it discards the whole family of *delimited lists whose
cell is a choice*. Every one of these is refused, and every one is cheap
- measured 0.014 to 0.032 ms, so the price of the false positive is a
400 rather than a slow query:

```
^(true|false)(,(true|false))*$                    0.017 ms
^(yes|no)(;(yes|no))*$                            0.014 ms
^("[^"]*"|[^,]*)(,("[^"]*"|[^,]*))*$              0.023 ms   a quoted CSV row
^(https?://\S+)(,https?://\S+)*$                 0.018 ms   a URL list
^\w+\.(jpg|png)(,\w+\.(jpg|png))*$               0.023 ms   an extension list
^\w+=("[^"]*"|\w+)(&\w+=("[^"]*"|\w+))*$         0.032 ms   kv with quoted values
```

Closing it means requiring every branch to carry its own delimiter AND
those delimiters to be mutually disjoint - a stronger claim than the
scan makes today. Until then, spell the cell as a character class rather
than an alternation where you can (`^[a-z]+(,[a-z]+)*$` is accepted), or
filter on a stored column.

A non-string pattern is `INVALID_REGEX_PATTERN`.

**Read this as a blacklist, not as a guarantee.** It refuses two known
ambiguity families; it does not prove that what it accepts is linear,
and no cheap static scan decides the general case. Across a fuzz of
500,000 generated patterns, the worst ACCEPTED one measured 58 ms
against a 256-character value - four orders of magnitude better than
the payloads above, and still not zero.

Which is why every store carries a **match timeout** behind it. A
statement that runs past the limit (30 seconds by default, configurable
per deployment, `0` disables) is cut off:

| Store | On expiry |
| --- | --- |
| Postgres | `503 DB_STATEMENT_TIMEOUT` |
| MongoDB | `503 DB_STATEMENT_TIMEOUT` |
| Search index | `503 SEARCH_TIMEOUT` |

The search-index timeout is the reason a DataView list can answer 503:
a cluster that cuts a search short returns PARTIAL hits with
`timed_out: true`, and a page built from a count the cluster never
finished is worse than an error. (The Lucene `regexp` leg is
additionally bounded by the cluster's `max_determinized_states`, which
fails loudly with a 400.)

Default-deny is still what actually keeps this operator off an API; opt
in only where the callers are trusted.

These limits are on the **runtime-filter** surface only - `$regex` in an
authored MScript where-clause is author code, not request
input, and keeps the full vocabulary.

### Language support for `regexp`

Whether a compiler target reaches a real regex engine for `regexp` on
the DataObject path is a property of the compiler, not of the blueprint.
Two things hold across targets:

- On the search-index path (DataView lists) `regexp` is a real regular
  expression.
- On the DataObject path a target may lower `regexp` to `$like`, a literal
  substring test. A caller who sends
  `{"field": "b", "operator": "regexp", "value": "^a.+b$"}` to such a
  service gets **substring matching on the literal string `^a.+b$`**:
  not an error, and not the same rows a real regex engine returns for
  the identical request body.
- Not every target wires the runtime-filter feature at all; where it is
  not wired there is no `regexp` operator to reach.

Do not assume `regexp` filters every compiled service the same way. The
per-target ruling is part of
[the compiler specification](../../compiler/index.md).

The vocabulary is shared; a few of its operators still mean different
things on the different backing stores (`match`, `matchPhrase`,
`contains`, and the pattern family's wildcard grammar). The per-store
ruling for each is the table in
[MScript query reference § Cross-dialect operator semantics](../mscript/query-reference.md#cross-dialect-operator-semantics).
An empty `values[]` is an explicit *match-nothing* filter on every
store, not "no filter" — omit the criterion to mean that.

### Rejected filter bodies

A filter body is CLIENT input, so every complaint about it is a `400`
with a machine-readable `errorCode`, the offending `field`, and a
message naming what to send instead — never a `500`.

| `errorCode` | Raised when |
|---|---|
| `INVALID_FILTER_SHAPE` | `filters` is not a plain object keyed by field name. |
| `INVALID_FILTER_FIELD` | The field is not in `allowedFields` (the declared list, or its computed default below). |
| `INVALID_FILTER_CRITERION` | The per-field entry is not an object. |
| `INVALID_OPERATOR` | The operator is not in the vocabulary above. |
| `OPERATOR_NOT_ALLOWED` | The operator is not in this API's `allowedOperators` — or it is `regexp` and this API did not opt in. |
| `UNSAFE_REGEX_PATTERN` | A `regexp` pattern over 256 characters; one repeating a group whose body can backtrack and carries no delimiter, or whose delimited body is itself ambiguous; or one whose quantifiers can trade characters with each other more than one pair's worth, anywhere in the pattern and at any depth. |
| `INVALID_REGEX_PATTERN` | A `regexp` `value` that is not a string. |
| `MISSING_VALUE` / `MISSING_VALUES` | The operator needs `value` / a `values` array and did not get one. |
| `INVALID_VALUES_LENGTH` | `range` did not get exactly two values. |
| `NULL_IN_VALUES` | An element of `values` - or of a LIST `value` on `contains` / `notContains` - is `null`. |
| `INVALID_OPERAND_TYPE` | A comparison (`eq`, `noteq`, `gt`, `gte`, `lt`, `lte`) got an object or array instead of one scalar, Date or null. Also: `starts`, `ends`, `wildcard` or `matchPhrasePrefix` got a non-scalar pattern (including null); or `contains` / `notContains` got an object. |

Comparison values may be strings (including date strings), numbers,
booleans, null, or a Date supplied by an in-process caller. The filter layer
preserves these values and leaves column type/date interpretation to the
existing driver. Objects and arrays are refused before either the MQuery or
search-index translator. List operands remain supported by their explicit
operators (`in`, `notin`, `range`, and the list form of `contains` /
`notContains`); this comparison rule does not change their element rules.

`INVALID_OPERAND_TYPE` is the operand-SHAPE verdict. The four pattern
operators each match ONE pattern against the field, and `contains` /
`notContains` take a scalar or a list and nothing else. A non-scalar is
refused rather than READ, because the two backends would read it
differently: `{"operator":"ends","value":["a","b"]}` would ask the search
index for the suffix `*a,b` — a value no document has — while the
SQL/Mongo side would put the raw array on `$ends`.
`{"operator":"ends","value":[]}` would be worse: it would lower to
the Lucene wildcard `*`, so a filter sent to NARROW a read would match every
document that has the field. An object operand on `contains` would become
the literal substring `[object Object]`, i.e. silently wrong rows. Send one
scalar; use the LIST form of `contains` when you mean several values.

`NULL_IN_VALUES` covers `in`, `notin`, `range` and the
LIST form of `contains` / `notContains`, whose operand arrives under
`value` rather than `values`. The message carries the element INDEX
(`values[1]`, or `value[1]` for the two `contains` operators). A `null` cannot be a member of
a value list: Postgres never matches it — and a `NOT IN` over a `NULL`
matches ZERO rows — MongoDB matches null AND missing, and the search index
rejects it inside `terms`. Ask the question directly with a second
criterion using the `isNull` / `notNull` operator.

"Never a `500`" is a promise about the WHOLE path, not only about
validation: every operator in the vocabulary must convert to a valid
query on every store, so a documented operator never stops short of
rows.

## Allow-lists

| Field | Default when null |
|---|---|
| `allowedFields` | Computed at compile time on a `filtersEnabled` api. DataObject: every property with `isFilterParameter: true`. DataView: every projected mainObject property + every aggregate + every stat. Never a `hashed` / `isSecret` or storage-internal column. An explicit `[]` reads the same as null; a default that comes out empty (no `isFilterParameter` property) refuses every field with `INVALID_FILTER_FIELD`, never admits all. A DECLARED list is used verbatim; the validator warns (`RUNTIME_FILTER_SECRET_FIELD`) when it names a `hashed` / `isSecret` column, because a `starts` / `contains` criterion on one reveals the value a character at a time. |
| `allowedSortFields` | Computed at compile time: `id`, `createdAt`, `updatedAt` plus every non-array property of a sortable type (ID, String, Integer, Short, Float, Double, Decimal, Boolean, Date, Enum - never Text, Object, Blob or geo); on a stored DataView, every sortable field of the view index. Restricted to `allowedFields` only when `allowedFields` is DECLARED (a null `allowedFields` does not narrow it to the `isFilterParameter` default above), and never a `hashed` / `isSecret` or storage-internal column. An explicit `[]` reads the same as null; to offer no runtime sort, leave `sortEnabled` off. |
| `searchedFields` | Fields whose type is text-like. |
| `allowedOperators` | The full `RuntimeFilterOperator` set **except `regexp`**, which is default-deny (above). |

## Worked example

```json
{
  "basics": { "apiOptions": { "name": "listTickets", "crudType": "list", "dataObjectName": "Ticket" } },
  "query": {
    "paginationOptions": { "defaultPageRowCount": 25 },
    "listOptions": {
      "listSortBy": [ { "name": "byCreatedAt", "property": "createdAt", "order": "desc" } ],
      "runtimeFilters": {
        "filtersEnabled":      true,
        "searchEnabled":       true,
        "sortEnabled":         true,
        "savedFiltersEnabled": true,
        "allowedFields":       ["status", "priority", "assigneeId", "createdAt"],
        "allowedSortFields":   ["createdAt", "priority"],
        "searchedFields":      ["title", "body"],
        "allowedOperators":    ["eq", "in", "range", "contains", "gte", "lte"]
      }
    }
  }
}
```

A caller can then POST a filter body. `filters` is an OBJECT keyed by
field name, and each value is a `{ operator, value | values }`
criterion. An array (or any other
non-object) is refused at the boundary with
`400 INVALID_FILTER_SHAPE`:

```json
{
  "filters": {
    "status":    { "operator": "in",    "values": ["open", "pending"] },
    "priority":  { "operator": "gte",   "value": 3 },
    "createdAt": { "operator": "range", "values": ["2026-01-01", "2026-03-31"] }
  }
}
```

Because the body is keyed by field name, a field carries exactly ONE
criterion per request — there is no way to send two predicates on the
same field (`createdAt gte X` *and* `createdAt lte Y` is the `range`
operator, not two entries). Use `value` for the single-value operators
and `values` for `in` / `notin` / `range`; `exists`, `missing`,
`isNull` and `notNull` take neither.

Combine the body with `?q=login%20error&sortBy=priority&sortOrder=desc`.
With `savedFiltersEnabled`, the caller can `POST /tickets/filters` to
store that body under a name and re-apply it later — the saved rows are
scoped to the calling user.

## Pagination

Pagination is its own block, `query.paginationOptions`
(`PaginationOptions`):

| Field | Notes |
|---|---|
| `defaultPageRowCount` | Default rows per page (positive integer; `null` / `0` = 25). |
| `unpaged` | `true` answers the whole filtered set in one response, in the list's own order (sorted after the keyset walk; `topPick` takes the first N of it), refused with 422 `UNPAGED_LIST_TOO_LARGE` above the service's unpaged row limit (default 10000; an SSE stream is not capped). Meant for internal/kafka/cron callers; see [list-api](../business-apis/list-api.md#unpaged-the-whole-set-in-one-response). |
| `paginationEnabled` | Retired and ignored: every list is paged unless it declares `unpaged: true`. |

Pagination pages *within* the filtered + capped result set
(`topPick` caps first, then pages).

## See also

- [ListOptions hub](list-options.md) — how runtime filters sit beside
  the other families.
- [Search filters](search-filters.md) — the search-index bridge `?q=` uses for
  DataObject sources.
- [Where-clause composition](where-clause-composition.md) — the static
  WHERE foundation runtime filters extend.
- Specification: [`ListRuntimeFilterSettings`](../../spec/ListRuntimeFilterSettings.md),
  [`PaginationOptions`](../../spec/PaginationOptions.md),
  [`SortByItem`](../../spec/SortByItem.md). (`RuntimeFilterOperator`
  is an enum — its values are tabled above.)
