---
title: Search filters
---

# Search filters

A search filter runs a full-text search against the main data object's
**Elasticsearch index**, collects the matching id-list, and appends it
to the list's database WHERE clause. The DB query then selects rows by
those ids. This bridges ES relevance search and the relational result
set: the search ranks and finds, the database returns the authoritative
rows (with all the other filters still applied).

Every data object is indexed into Elasticsearch, so this works
on SQL and document-store sources alike — the
search hop is always ES; only the final id-based select differs per
engine.

## Which block activates it

`BusinessApi.query.listOptions.searchFilter` (type `ListSearchFilter`)
on a `list`-type API:

| Field | Type | Notes |
|---|---|---|
| `hasSearchFilter` | Boolean | Activates the search filter for this API. |
| `keyword` | MScript | Expression whose result is the search key (e.g. `this.keyword`). |
| `searchProperties` | PropRefer[] | Properties of the main object to match against. |
| `condition` | MScript | Optional Boolean — when false, the search filter is skipped (so an empty keyword returns the unfiltered list). |

## What it emits

The service runs a pre-query step: when `condition` is truthy, it issues
an ES query for `keyword` across `searchProperties` on the main
object's index, takes the resulting id array, and folds it into the
main WHERE clause as `id IN (...)`. The DB query then runs with that
constraint *plus* every other filter (permission, membership, joint,
runtime, base WHERE). An empty / skipped search contributes no
constraint.

## Exact match vs. token match: `indexSettings.fulltextSearch`

Which of the two kinds of matching a search property gets is decided by
that property's own
[`indexSettings.fulltextSearch`](../data-modeling/indexes.md), and it is
**off by default**:

| `fulltextSearch` | ES mapping | What the keyword matches |
|---|---|---|
| `false` (default) | `keyword` | The **whole stored value**, exactly. `"acme"` finds a row whose column is exactly `acme`, and nothing else. |
| `true` | `keyword` + an analyzed `ftext` sub-field | Individual **tokens** inside the value, with fuzziness - substring / typo / word-in-a-sentence search. |

The compiler resolves this per property when it emits the query: a property
with the flag is searched through its `<prop>.ftext` sub-field, one
without it through the bare field - and a property whose mapping cannot
answer a fuzzy `match` at all is DROPPED from the emitted query rather
than sent anyway (see *What happens to an unanswerable property* below).
A default-mapped `String` column is still searched, because a `keyword`
mapping can answer a `match`; it will just only ever answer an exact
keyword, which on a `firstName` or `vehiclePlate` column is rarely what
the author meant. Blueprint validation raises
`SEARCH_PROPERTY_NOT_FULLTEXT` (a warning, not an error) for each
declared search property that has no `ftext` sub-field.

So: set `indexSettings.fulltextSearch: true` on every property you list
in `searchProperties` that should support partial-word search.

### Three reasons a property has no `ftext` sub-field

The flag is not always the answer, so the warning names the cause it
found and prescribes the change that actually fixes *that* one. It
carries the cause in `details.cause`:

| `cause` | Shape | What to do |
|---|---|---|
| `flagOff` | a `String` / `Text` property, indexed in Elasticsearch, `fulltextSearch` off | Set `indexSettings.fulltextSearch: true`. |
| `notIndexed` | `indexSettings.indexedInElastic: false` | The property is mapped with `index: false` and Elasticsearch cannot search it **at all**, so `fulltextSearch` is inert here — including when it is already `true`. Set `indexedInElastic: true` as well, or drop the property from `searchProperties`. |
| `type` | any type other than `String` / `Text` — `ID`, `Integer`, `Double`, `Float`, `Short`, `Date`, `Boolean`, `Enum`, `Object`, the geo types, `Blob` | Those mappings carry no analyzed sub-field at all and never read `fulltextSearch`. Substring search is not available: remove the property from `searchProperties` (exact-value matching still works through the per-property filters), or declare it as `String` / `Text`. |

### What happens to an unanswerable property

A search property is **answerable** when Elasticsearch can run a `match`
on it, which takes two things together: the property is **indexed in
Elasticsearch** and its mapping is **textual**. The compiler asks the
real mapping, per property, when it emits the query: *indexed* means the
mapping is not `index: false` / `enabled: false`, and *textual* means its
type is `keyword` or `text`. A property that carries an analyzed `ftext`
sub-field is answerable through that sub-field. Everything else - every
numeric, `Date`, `Boolean`, `Enum`, `Object`, geo or `Blob` mapping, and
any property mapped `index: false` - is not.

- An unanswerable property is **dropped from the emitted query**, and the
  generated source carries a comment naming what was dropped. The
  remaining answerable fields still answer normally.
- When **nothing answerable is left**, the query becomes `match_none`:
  an empty result, deterministically, on every call - not an error.

Both outcomes are quiet at runtime on purpose. The loud end is design
time, where `SEARCH_PROPERTY_NOT_FULLTEXT` names each property and its
cause before the service is ever generated. Sending a fuzzy `match` to
such a property anyway would make Elasticsearch answer a shard exception,
which would fail the whole list api instead of just contributing
nothing to it.

Two limits are worth knowing. The dropping applies to the **scalar
keyword branch only**: the array branch is an exact `terms` ID-join,
which is legitimate on a numeric key and is never dropped. And a search
whose target data object cannot be resolved at emission time keeps every
declared property, because there is no mapping to ask.

## Worked example

```json
{
  "basics": { "apiOptions": { "name": "searchArticles", "crudType": "list", "dataObjectName": "Article" } },
  "parameters": {
    "requestParameters": [
      { "name": "keyword", "type": "String", "required": false, "httpLocation": "query" }
    ]
  },
  "query": {
    "listOptions": {
      "searchFilter": {
        "hasSearchFilter":  true,
        "condition":        { "js": "!!this.keyword" },
        "keyword":          { "js": "this.keyword" },
        "searchProperties": ["title", "summary", "body", "tags"]
      },
      "listSortBy": [ { "name": "byPublishedAt", "property": "publishedAt", "order": "desc" } ]
    }
  }
}
```

Call `GET /articles?keyword=postgres%20indexing`: ES searches `title` /
`summary` / `body` / `tags`, returns the matching article ids, and the
DB list returns those rows ordered by `publishedAt`. With no `keyword`,
the `condition` is false, the search filter is skipped, and the full
(otherwise-filtered) list returns.

## Relationship to runtime `?q=`

[`ListRuntimeFilterSettings.searchEnabled`](runtime-list-filters.md)
exposes a runtime `?q=` parameter. For a **DataObject-sourced** list,
the service routes `?q=` through this same `ListSearchFilter` ES
bridge — so `searchEnabled` is the runtime, caller-driven entry point
and `searchFilter` is the explicit, author-configured form. (For a
DataView source, `?q=` uses native ES `multi_match` instead.) Configure
`searchFilter` directly when you want a fixed keyword source and field
set; use `searchEnabled` when the caller drives the search at request
time.

## When to use something else

- Exact-match / range / operator filtering → runtime filters or the
  per-property filter parameters, not a search filter.
- Filtering by a criterion in a *related* object →
  [Joint filters](joint-filters.md).
- Cross-service relevance search with aggregates → a
  [BFF DataView](../system-services/bff.md) with native ES queries.

## See also

- [Runtime list filters](runtime-list-filters.md) — the `?q=` runtime
  entry point that reuses this bridge.
- [ListOptions hub](list-options.md) — how the search id-list combines
  with the other filters.
- [Index patterns](index-patterns.md) — DB indexing for the final
  id-based select.
- Specification: [`ListSearchFilter`](../../spec/ListSearchFilter.md).
