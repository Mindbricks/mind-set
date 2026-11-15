---
title: Recommendation engine
---

# Recommendation engine

Declare `objectSettings.recommendationSettings` on a data object to turn it into an **item being
recommended**: a background refresh precomputes ranked neighbor / popularity tables from what users
already do (completed carts and, where supported, counted visits), and the generated service serves
ready-made lists ("customers also bought", "bestsellers") under that object's own routes, behind that
object's own read gate.

A recommendation score is an engagement signal, **never an authorization or filtering input** — the
same hard rule object visits and the decision layer carry. This guide documents the behaviour a
conforming compiler provides. Not every compiler implements every slice (see
[What a compiler may not implement](#what-a-compiler-may-not-implement)); where a declared value is not
emitted, validation says so with a warning that names it.

> **Reference:** [`RecommendationSettings`](../../spec/RecommendationSettings.md) ·
> [`RecommendationList`](../../spec/RecommendationList.md) ·
> [`InteractionSource`](../../spec/InteractionSource.md) ·
> [`RecommendationEvidence`](../../spec/RecommendationEvidence.md) ·
> [`RecommendationFilters`](../../spec/RecommendationFilters.md) ·
> [`RecommendationListPolicy`](../../spec/RecommendationListPolicy.md) ·
> [`RecommendationApi`](../../spec/RecommendationApi.md) ·
> [`RecommendationRerank`](../../spec/RecommendationRerank.md)

---

## Concepts: relations and signals

A **relation** names *how* two items (or an item and an actor) are connected — `coPurchased`
("appeared in the same completed basket"), `coConsumed` ("consumed by the same actor"),
`popularity` ("collected the most interactions"). The SQL engine computes these relations:

| Relation | Needs (roles) | Meaning |
| --- | --- | --- |
| `coPurchased` | item, group, validWhen | Two items in one completed basket. |
| `coConsumed` | item, actor, time | The same actor consumed both items (the actor is the group; `windowDays`, when set, bounds the history read). |
| `coViewed` | item, group (or actor + time) | Items viewed in the same session, or by the same actor in the selected history window. |
| `consumedAfter` | item, actor, time | Directed pairs where the actor consumed B after A. `windowDays`, when supplied, also bounds the time gap. |
| `popularity` | item, time | A count of interactions per item (optionally time-decayed). |
| `repeat` | item, actor, time | At least two distinct acquisitions of one item in the caller's bounded recent history, using groups or events when no group exists; used by `buyAgain` at request time. |

The rest of the vocabulary is schema-accepted but **not yet emitted** — declaring one is a
`RECOMMENDATION_NOT_YET_EMITTED` warning, not an error, naming the slice that will:

| Relation | Needs | Slice |
| --- | --- | --- |
| `similarContent` | none (reads the item's own fields) | R6 — cold-start fallback. |

A **signal** is the free-text label the underlying interaction records (`ordered`, `view`, `read`,
`purchase`, ...) — carried into the response (`_rec.signal`) so the frontend never claims "bought"
when the data only shows "ordered". A relation and a signal are validated against each other (the
"toy-car rule"): a purchase-like signal (`purchase`, `purchased`, `ordered`, `order`,
`bought`, `paid`) never feeds `coViewed`, and a view-like signal (`view`, `viewed`, `read`, `seen`,
`access`, `visit`, `impression`) never feeds `coPurchased` or `repeat` — mismatching the two is
`RECOMMENDATION_EVIDENCE_SIGNAL_MISMATCH`. An unrecognized label never contradicts anything (it is a
free label).

## Declaring sources and lists

Two blocks, both under `objectSettings`, on the item object:

```
DataObject.objectSettings.recommendationSettings   (RecommendationSettings) — turns it on
  .sources   [InteractionSource]   — hand-declared event sources (optional)
  .lists     [RecommendationList] — what is served
```

### Interaction sources: declared vs. pattern-published

An **interaction source** names the event object and the property path that plays each role
(item / group / actor / time / weight) plus the signal label and a `validWhen` filter. Two kinds:

- **Pattern-published** (`from: "pattern"`) - discovered automatically from a configured pattern.
  The shopping cart publishes the cart source below. Where visit tracking is supported, tracked visit
  history also publishes a source for each recorded interest signal. An optional explicit visits
  descriptor selects a tracked object and signal; the shared reader resolves its table and roles from
  visit tracking, so an authored role cannot change the published mapping. The other patterns named in
  `InteractionSourcePattern` (`checkout`, `invoicing`, `subscription`, `videoAttendance`,
  `hubMessages`) are planned. An item with no source gets `RECOMMENDATION_NO_SOURCE` (warning;
  served empty, fallbacks apply).
- **Declared** (`from: "declared"`, the default) — a hand-modelled event object (an order line, a
  booking) for a data model the shipped patterns do not already describe.

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | String | — | Unique among the object's sources; an evidence entry's `source` names it. |
| `from` | `declared` \| `pattern` | `declared` | A `pattern` descriptor uses the pattern's own table and role mapping. |
| `pattern` | InteractionSourcePattern? | `null` | Set on a computed `from: pattern` descriptor: which pattern publishes it. |
| `patternTarget` | String? | `null` | Which instance of the pattern: the cart name, or the visit-tracked object name. |
| `eventObject` | DataObjectName? | `null` | For `from: declared`: the object whose rows are the interactions. |
| `itemProperty` | String | — | Path to the item key: a property of `eventObject`, or `<relation>.<property>` one relation hop away (a relation property or the `<object>Id` foreign-key convention). A deeper path is `RECOMMENDATION_SOURCE_PATH_UNRESOLVED`. |
| `itemLookup` | String | `"id"` | The item object's property the item key matches (a barcode-keyed catalog names `barcode`). |
| `groupProperty` | String? | `null` | Path to the "together" group (a basket, a session). Required by `coPurchased`; `coViewed` also accepts actor + time. |
| `actorProperty` | String? | `null` | Path to the actor (a user id or anonymous session key); relation traversal allowed. Required by `coConsumed`, `consumedAfter`, `repeat`. |
| `timeProperty` | String? | `null` | Path to the interaction time. Required by windowed/decayed relations. |
| `signal` | String | — | The free-text signal label, carried into every response. |
| `validWhen` | MScript (mquery)? | `null` | A where-clause selecting the records that count, with no request context: plain equality, an array (IN), `$eq`/`$ne`/`$gt`/`$gte`/`$lt`/`$lte`/`$in`/`$nin`/`$exists`/`$and`/`$or`/`$not` over `eventObject`'s own properties or a one-hop path (`<object>.<column>` under the `<object>Id` convention; `<relationProperty>.<column>` when the foreign key is a declared relation). It applies to refresh and request-time actor history. Anything else (another operator, an unknown path, `null` inside an `$in`) is not caught at design time: it raises `RECOMMENDATION_VALIDWHEN_UNSUPPORTED` rather than silently counting every row. A failed refresh is logged and leaves the previous rows served. |
| `weightProperty` | String? | `null` | Path to an interaction strength (a line quantity). |

#### The shopping cart source

Zero-declaration: when a service's `shoppingCartConfig` binds a **product catalog**
(`productCatalogSettings.useProductCatalog: true`, pointed at the item object carrying
`recommendationSettings`), the cart publishes one `InteractionSource` automatically:

| Role | Mapped from |
| --- | --- |
| item | `<cartItem>.barcode`, matched against the catalog's `lookupField` (default `barcode`) |
| group | `<cartItem>.<cart>Id` (the basket) |
| actor | `<cart>.ownerId`, falling back to `<cart>.sessionId` when the cart supports guests |
| time | `<cart>.checkedOutAt` — a column added to the cart object exactly when a recommendation list reads this source |
| validWhen | `<cart>.status IN ('checkedOut', 'convertedToOrder')` |
| weight | `quantity` |
| signal | **`ordered`** — a completed checkout, deliberately not "bought"/"paid": no payment link exists yet (a paid-only signal is a later slice) |

A cross-service-bound catalog is not discovered (same-service only, for now); only one catalog
binding is read per service. See [Shopping cart](shopping-cart.md).

#### The visits source

Enable `objectSettings.visitTracking` with `history: true` and declare an enabled visit API for
the signal that should feed the list. A tracked object alone does not establish a recorded signal.
The source names are `visits_<object>_<signal>`, for example `visits_article_read`.
Only counted or confirmed interest visits feed the relation. Pending visits and `seen` impressions
do not create interest or feed recommendation scores.

The history mapping is the visit table's `objectId` to the item's id, `actorKey` for the actor,
and `createdAt` for time. It uses the actor + time form of `coViewed`; a supplied `windowDays`
bounds the history and pair gap. The source retains the tenant in every grouping and join.
Its signal label is the declared visit signal, with only `counted` or `confirmed` rows included.
`actorState` may stay enabled
for caller read state; ordered and windowed recommendation history comes from history rows rather
than the latest timestamp in the visit state. See [Object visits](object-visits.md).

Lists use `source: "auto"` to discover these sources, or select a source by its computed name.
An explicit selection can name the same pattern contract:

```json
{
  "name": "reads",
  "from": "pattern",
  "pattern": "visits",
  "patternTarget": "article",
  "itemProperty": "objectId",
  "signal": "read"
}
```

The source object must have enabled visit tracking and history, and a visit API for `read`.
The descriptor reads the pattern's own role mapping. Choose `coConsumed` for "Readers also read",
`coViewed` for session comparisons, `consumedAfter` for "Next to read", and `popularity` with
`decayHalfLifeDays` for "Trending". These signals change rank only: every returned item still
passes the item's own get rules, redactions and current row visibility.

ContentModel adoption is a separate integration step: its delivery read uses a custom slug
router rather than a Business API get. It needs a visit hook and an equivalent parent-read contract
before readers-also-read or next-to-read lists can be enabled there. Visit sources do not add lists
or visits to a ContentModel automatically. Objects without enabled recommendation blocks retain their
existing generated output.

### Lists

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | String | — | Unique on the object: names the route (`.../recommendations/<name>`) and `_rec.list`. The shared tables are keyed by the relation key, not by the list name (see [the shared neighbor table](#the-shared-neighbor-table)). |
| `kind` | RecommendationListKind | — | See below — which route shape and whose interactions. |
| `evidence` | `[RecommendationEvidence]` | — | `{ relation, source = "auto", weight = 1 }`; blending several is explicit, never silent. A candidate's score is the sum of `weight × score` over the evidence entries that produced it, and its `_rec.relation` / `_rec.signal` name the entry that contributed most. |
| `scoring` | count \| cosine \| jaccard \| lift \| llr | `cosine` | See [scoring](#scoring). |
| `windowDays` | Integer? | `null` (no time cutoff) | How far back interactions count. Actor lists first select the latest 500 actor events per evidence source, then apply source validity and this time cutoff; null does not remove the event cap. |
| `decayHalfLifeDays` | Integer? | `null` | Positive finite whole days; invalid values are an error (`RECOMMENDATION_DECAY_HALF_LIFE_INVALID`). On `popularity`, null or absence disables decay. On `personalized` and `buyAgain`, null or absence uses a 30-day half-life for request-time recency. It does not change the stored neighbor scores. |
| `minSupport` | Integer | `3` | Minimum co-occurrences before a pair exists. |
| `maxGroupSize` | Integer | `50` | Baskets/sessions larger than this are sampled (bounds pair blow-up). |
| `storedNeighbors` | Integer | `50` | Top-K neighbors kept per item in the table. |
| `size` | Integer | `10` | Items returned per request; `fallback` tops up a short list to this. |
| `filters` | RecommendationFilters? | `null` | See [the read gate](#the-read-gate-in-depth) — deterministic, re-applied at serve time. |
| `listPolicy` | RecommendationListPolicy? | `null` | `{ dedupeBy, maxPerValueProperty, maxPerValueCount }` — diversity on the ranked page. |
| `rerank` | RecommendationRerank? | `null` | Planned (R5): a bounded, fail-open decision-provider rerank. Declaring it warns `RECOMMENDATION_NOT_YET_EMITTED`. |
| `fallback` | `[String]` | `[]` | Other lists of the same object, tried in order while this one is short. |
| `engine` | sql \| clickhouse \| compute \| graph | `sql` | See [the shared neighbor table](#the-shared-neighbor-table). |
| `refreshCron` | String | `"0 */6 * * *"` | Every six hours, by default. |
| `api` | RecommendationApi? | `null` | `{ routePath, exposePublic }` — see [the read gate](#the-read-gate-in-depth). |
| `logImpressions` | Boolean | `true` | Writes `seen` history rows for the final returned page when the item has enabled visit tracking and history; needs an eligible actor. |

#### Kinds

| Kind | Route shape | Serves | Status |
| --- | --- | --- | --- |
| `related` | anchor (`:<item>Id`) | "items related to the one being viewed" | emitted |
| `complementary` | anchor | "items bought together with the one being viewed" | emitted |
| `trending` | collection (global) | "the most popular items right now" | emitted |
| `next` | anchor | "what to open next" | from `consumedAfter` |
| `personalized` | collection (actor) | "items for the current actor" | actor lists (R4) |
| `buyAgain` | collection (actor) | "items the actor may want to buy again" | actor lists (R4), from `repeat` |

### Actor lists

`personalized` and `buyAgain` rank candidates by descending score, with equal scores
ordered by item id using English collation independently of the server's default locale.

`personalized` selects 20 recent distinct interacted items across the same resolved sources as
its evidence. Each evidence source first selects the actor's latest 500 events in the source's
tenant scope; source `validWhen` and `windowDays` then qualify events within that window. The
single fixed runtime constant of 500 events serves both actor kinds;
there is no authored event-count setting. Distinct items are selected globally from the remaining
bounded history. An older distinct item can be omitted when newer events fill the cap, and invalid
or out-of-window events still occupy the event budget. It
accepts `coPurchased`, `coConsumed`, `coViewed` and `consumedAfter` neighbor evidence. One database
operation joins the recent seeds to their stored neighbors;
each seed contributes at most `min(storedNeighbors, 100)` neighbors. The runtime also enforces hard
caps of 50 seeds and 100 neighbors per seed. There is no authored seed-count setting.

Each contribution is `evidence.weight * neighborScore * 2^(-ageDays / halfLifeDays)`, using that
seed's latest interaction time. `decayHalfLifeDays` defaults to 30 for actor lists. `windowDays`
and each source's `validWhen` apply to the source history. Scores for the same candidate are added;
items the actor has already consumed in those evidence sources are excluded across all retained
history, even outside `windowDays` or the 500-event cap. This exclusion uses candidate-limited
existence checks over the source history; it does not aggregate the actor's full history. An explicit `excludeConsumedBy` filter is additionally applied
at serve time. Changing actor history
can therefore change the result immediately, while neighbor strengths still follow background
refresh. No per-user recommendation rows are stored.

`buyAgain` uses `repeat` evidence from valid actor/time sources: ordered shopping carts or declared
sources whose signal is not view-like. It first selects the actor's latest 500 events per evidence
source in the source's tenant scope, then applies `validWhen` and `windowDays`. An item qualifies when the remaining bounded history contains
at least two distinct acquisition groups; when the source has no group, distinct event ids are used
instead. Duplicate lines in one basket do not establish a repeat purchase. Its score is the
acquisition frequency observed within that bounded history multiplied by
`2^(-latestAgeDays / halfLifeDays)` and the evidence weight, with the same default 30-day half-life
and source window. This is a bounded recent-history approximation: it can omit an older repeat
item and undercount its frequency compared with the full retained history; invalid events can
occupy the event budget too. A null `windowDays`
still keeps the 500-event cap. `excludeConsumedBy` is ignored for this kind so repeat items remain eligible.

The source event limit bounds the rows returned to aggregation. It does not guarantee a bounded
database scan or sort: a declared source without an index for its actor/time path can still read
many stored rows to find the latest events. For recognized declared sources whose actor and time
are on the same discoverable table, `RECOMMENDATION_ACTOR_HISTORY_INDEX_MISSING` warns when a
full-domain composite index beginning with actor then time is absent. If the tenant predicate is
on that table, indexes beginning with tenant, actor, time or actor, tenant, time also qualify. Reversed columns,
separate property indexes and partial indexes do not satisfy that check. Composites on soft-delete
objects are active-row partial indexes, so they do not cover the raw history read either. Pattern sources, split-table
actor/time paths, multiple fallback actor columns, unknown metadata and unsupported engines or
databases are not verified by this warning. It is advisory and does not disable the list. A direct source should
also provide an actor/item index for consumed-item existence checks; the warning tests actor/time.
For tenant-skewed declared data, tenant must also appear in the equality prefix before time to
bound the ordered read; an actor/time-only index can still scan that actor's other tenants.
The advisory recognizes index metadata, rather than proving the work of arbitrary joined queries.
The raw visits table prepares actor/tenant/time and actor/item access paths. Generated cart sources
prepare full-domain cart indexes on (tenant, owner, time) and (tenant, owner, session, time),
omitting tenant in a single-tenant service, plus cart-line lookup indexes. The ordered cart read
tests the cart tenant as well as the line tenant and requires a null owner before using a guest
session. Thus other tenants' carts and signed-in carts sharing a guest session do not increase
the history scan. These indexes are prepared once, only when absent; declared tables are never altered.
Creating an index on existing data is a one-time schema operation and can be expensive. The
500-event limit counts joined cart lines, including duplicate lines in one cart, before validity
and window qualification. Carts with no lines can still require extra cart reads to find 500
line events. Other joined source paths and arbitrary validity predicates can also require additional database work; strict
work bounds for every such shape require a materialized actor/item projection.

Actor identity is the authenticated user id, or a persisted anonymous `X-Session-Id` when there is
no authenticated user. These histories are not combined. There is no request parameter for another
actor's identity. A caller with no actor key or no
qualifying history gets no actor candidates; fallback lists may still fill the page. The item's read
gate determines who may call the route, including whether login is required. Both actor kinds keep
tenant isolation, hydration, current read rules, field redactions, visibility, availability,
compatibility, list policy and fallback. `next` is a separate anchor list: its `consumedAfter`
evidence follows the readable anchor, rather than the caller's recent-item seeds.

For a catalog-bound cart source, these two collection lists need no declared source:

```json
[
  {
    "name": "forYou",
    "kind": "personalized",
    "evidence": [{ "relation": "coConsumed" }],
    "windowDays": 180,
    "decayHalfLifeDays": 30,
    "fallback": ["bestsellers"]
  },
  {
    "name": "buyAgain",
    "kind": "buyAgain",
    "evidence": [{ "relation": "repeat" }],
    "windowDays": 180
  }
]
```

Add them to `recommendationSettings.lists`, alongside the `bestsellers` fallback declared in the
store example below. Call `GET /products/recommendations/forYou` or
`GET /products/recommendations/buyAgain` with the caller's normal session.

### Scoring

Over `nij` (pair co-occurrences), `ni`/`nj` (each item's own support), `n` (total groups in the
tenant):

| Option | Formula | Notes |
| --- | --- | --- |
| `count` | `nij` | Raw count; debugging only, popular items dominate. |
| `cosine` (default) | `nij / sqrt(ni · nj)` | Popularity-normalized: an item bought everywhere does not top every list. |
| `jaccard` | `nij / (ni + nj − nij)` | |
| `lift` | `nij · n / (ni · nj)` | Unstable on rare pairs; bounded by `minSupport`. |
| `llr` | Dunning's log-likelihood ratio G² over the 2×2 contingency table (`2 × Σ k·ln k` entropy terms), floored at 0 | The robust significance test for sparse co-occurrence. |

`minSupport` bounds the `HAVING COUNT(*) >=` clause on the pair aggregation (a pair with fewer
co-occurrences than this does not exist). `maxGroupSize` caps each basket to a deterministic,
hash-ordered sample of that many items before pairing (bounds the pair blow-up of one huge basket).
`storedNeighbors` is the top-K kept per `(tenant, item)` for the neighbor relations and per tenant
for `popularity`, by score. `windowDays` bounds the source
rows read by time (requires the source's `timeProperty`). `decayHalfLifeDays` (popularity only)
weights each interaction by `weight × 0.5^(ageDays / halfLife)` — recent activity counts more; an
interaction with no time weighs 0 under decay.

### Filters and fallback

`RecommendationFilters` is re-applied to every candidate **at serve time** (neighbor tables are
stale by up to one refresh):

| Field | Meaning |
| --- | --- |
| `visibleWhen` | MScript over the candidate row: visibility on top of the read gate and tenant. |
| `availableWhen` | MScript over the candidate row: stock / availability. |
| `compatibleWhen` | MScript over `{ anchor, candidate }`: structured compatibility (e.g. `candidate.batteryType == anchor.batteryType`). A filter, never a score. |
| `excludeConsumedBy` | A source name or signal label: items the calling actor already has there are dropped. Ignored by `buyAgain`; `personalized` also excludes consumed items from its own evidence sources. |

None of the three `*When` filters may consult a decision provider (`RECOMMENDATION_ON_AUTHZ_SURFACE`
— a filter is deterministic; ranking by a provider is the planned **rerank**, which never
filters or generates candidates). A filter that **throws** drops the candidate (fail closed), never
500s the whole list.

`fallback` names other lists of the same object, walked depth-first (each list visited once) while
the response is still short of `limit`; the head list's own gate decides who may call at all, and
each fallback list's own filters still apply to its own candidates.

## The shared neighbor table

Up to two tenant-scoped tables are injected per item object that carries an active block (one with
at least one list) — only the ones its lists need, and never an API over them (an author-written read of
either is `RECOMMENDATION_ON_AUTHZ_SURFACE`):

- **`sys_<Item>Neighbor`**`(tenantId, relationKey, itemId, neighborId, score, support, computedAt)`
  — the top-K neighbors of each item, for `coPurchased` / `coConsumed` / `coViewed` / `consumedAfter`
  (planned: `similarContent`). Read by anchor kinds and `personalized`.
  `repeat` is queried from source history at request time and needs no neighbor rows.
- **`sys_<Item>Popularity`**`(tenantId, relationKey, segment, itemId, score, computedAt)` — the top-K
  items of one `popularity` relation. Injected when any list uses `popularity`; read by `trending`
  (`segment` is `''`).

**`relationKey`** is the one piece of naming every consumer must share: the neighbor and popularity
tables are shared per **(relation, source set, window)**, plus every knob that changes the computed
rows:

```
non-popularity:  relation | sorted-source-names | w<windowDays|all> | scoring | s<minSupport> | g<maxGroupSize> | k<storedNeighbors>
popularity:      popularity | sorted-source-names | w<windowDays|all> | d<decayHalfLifeDays|0> | k<storedNeighbors>
```

Two lists that differ **only** in `filters`, `listPolicy`, `size` or `fallback` resolve to the same
key and read the same precomputed rows — recomputing once serves both. Two lists that share a key
but declare **different `refreshCron` values** both still read the one computed table, but only ONE
refresh schedule actually runs it: the **first** list (by declaration order) that resolves to the
key wins the cron; every later list sharing the key gets the warning
`RECOMMENDATION_REFRESH_CRON_CONFLICT` naming which list it shares with and which cron was applied.
Give both the same `refreshCron`, or change a computing knob (window, scoring, `minSupport`,
`maxGroupSize`, `storedNeighbors`) to split the rows onto separate keys.

Each table carries its **own** `tenantId` column (`''` when the source has no tenant), not the
framework tenant FK: the scope of a row is the scope of the *interactions*, which can be tenant-level
even when the item object is not (a shared catalog sold in tenant-level carts).

## Refresh

A scheduler of its own runs one transaction **per relation key**, on the key's resolved
`refreshCron` (default every six hours), plus one pass shortly after boot that fills any key with
no rows yet (a fresh deployment). Per key, in one transaction:

1. Take a per-key advisory lock — a replica that loses the lock answers
   `status: 'locked'` and does nothing else (no delete, no insert): two replicas never compute the
   same key at once, and a lock not granted leaves the existing rows untouched.
2. Delete the existing rows of that key.
3. Insert the freshly computed rows, across **every tenant** of that key, in the SAME
   transaction — so a reader only ever sees the fully-old or the fully-new set for a key, never a
   half-written one.

**PostgreSQL only.** The SQL engine runs on PostgreSQL; on any other SQL dialect a refresh answers
`status: 'unsupported'`. The design-time check is narrower still — `RECOMMENDATION_SQL_DB_TYPES` names only `postgresql` as a
supported database: a MongoDB service (the only other service database) gets the warning
**`RECOMMENDATION_ENGINE_DB_NOT_IMPLEMENTED`**, no refresh ever runs, and every list is served empty
(its `fallback` chain still applies) until a later slice adds that engine.

## Serving routes

Mounted by the generated service **before** the item's own business routes (a collection route like
`/products/recommendations/bestsellers` must win over `/products/:id`), bare and under `/v1`, both
answering the same handler:

| Kind | Route |
| --- | --- |
| `related`, `complementary`, `next` | `GET /<items>/:<item>Id/recommendations/<list>` |
| `trending` (global), `personalized`, `buyAgain` (actor lists) | `GET /<items>/recommendations/<list>` |

- **Query parameter `limit`** (optional, integer, 1..100): how many items to return. Default: the
  list's `size`. An invalid value (non-integer, ≤ 0, non-numeric) is treated as absent, never a 400;
  the result is always clamped to 100 regardless of `size` or `limit`.
- **Anchor lists** take the item being viewed as a path parameter. An anchor the caller cannot read
  (missing, out of scope, failing `visibleWhen`) answers `404`.
- `api.routePath` overrides the computed route when set.

### Response shape

```json
{
  "listRequestId": "4b0c6f0e-2a51-4d39-9a5f-6c1c1d1e7a10",
  "list": "boughtTogether",
  "items": [
    {
      "id": "p_9f2a",
      "barcode": "0123456789012",
      "_rec": { "list": "boughtTogether", "relation": "coPurchased", "signal": "ordered", "score": 0.82 }
    }
  ]
}
```

- `items` are in rank order; render them in that order.
- `_rec` carries exactly four keys — `list` (the list that produced the item: the one requested, or
  one of its fallbacks), `relation` (`coPurchased` / `coConsumed` / `coViewed` / `consumedAfter` /
  `popularity` / `repeat` - pick the caption
  from it: "Frequently bought together", "Customers also bought", "Bestsellers"), `signal` (what the
  evidence counted — **`ordered` means a completed checkout, not a payment**: write "ordered
  together", never "paid for together"; when one evidence entry reads several sources it lists
  their distinct labels comma-separated, for example `ordered,purchased`), `score` (a ranking strength comparable only within one
  list — never render it as a percentage or a probability). There is no `position` field in `_rec`
  and no `paging` in the envelope.
- Every response carries a fresh `listRequestId`. Appending it to an opened item's request
  (`GET /<items>/:id?rec=<listRequestId>`) is the attribution wire-up for click-through evaluation.
  The value is stored when that request records a visit - the item's get API declares
  [`visitSettings`](object-visits.md) - in the visit row's `attribution` column. A list
  with `logImpressions: true` records `seen` history rows after filtering and fallback, with this
  `listRequestId` and the zero-based `position` in the returned page. The object must have visit
  tracking and history enabled. A signed-in user or persisted anonymous `X-Session-Id` is required;
  the object's anonymous-visit setting still applies. Keep the same session header when opening
  an item. `logImpressions: false` disables the write. Reporting on those stored impression and
  attribution inputs is a later slice (R7).
- An empty `items` array is a normal answer (a new shop, a new item, data not computed yet): hide
  the carousel, never show an error.

### Errors

| Status | errorCode | When |
| --- | --- | --- |
| 400 | `RECOMMENDATION_ANCHOR_REQUIRED` | An anchor list called with no anchor id (an internal guard: over HTTP a missing anchor id does not match the route at all). |
| 401 | `loginRequired` | The gate requires a session, the caller has none, and the gate carries no part the route cannot evaluate. |
| 403 | `forbidden` | Logged in, but none of `checkRoles` is held. |
| 403 | `RECOMMENDATION_GATE_NOT_INHERITED` | The item's read gate uses a part this route cannot evaluate (below). A row rule (`whereClause.*`) or a `removeFromResponse` condition the route cannot evaluate refuses **every** caller, absolute roles included; any other such part refuses every caller without an absolute role. Anonymous callers are refused the same way, whether or not the parent requires a login. |
| 404 | `RECOMMENDATION_LIST_NOT_FOUND` | No list of that name on this object (an internal guard: each list is mounted on its own path, so over HTTP an undeclared list name matches no route and gets the service's ordinary not-found answer). |
| 404 | `RECOMMENDATION_ANCHOR_NOT_FOUND` | The anchor item does not exist, or does not pass the hydration scope (including the `get` API's `whereClause`) / `visibleWhen`. |
| 500 | `RECOMMENDATION_SERVE_FAILED` | The pipeline threw; retry later or hide the carousel. |

## The read gate, in depth

**This is the security core of the pattern.** A list is served on the item's own service and
**inherits** the read gate of that object's own `get` API (preferring one literally named
`get<Item>`), or the explicit `api.exposePublic` choice. It never widens that gate.

### What is inherited

- `authOptions.loginRequired` (default true). A login-free parent admits **every** caller, with no
  owner scope, exactly as its generated `get` does — see [a login-free get API](#a-login-free-get-api)
  for the checks it skips and the ones it still runs.
- `authOptions.checkRoles`, verbatim (on a login-required parent).
- `authOptions.absoluteRoles` — the API's **effective** absolute roles (its own `absoluteRoles` plus,
  on a login-required API, the automatic `superAdmin`, and `tenantOwner` where the tenant filter is
  in force). An absolute role bypasses the **authorization** parts of the gate, exactly as on the
  `get` API: the role checks, ownership, and the fail-closed authorization parts below. It never
  bypasses the `get` API's **row rules**: the `whereClause` is applied to an absolute caller too
  ([below](#what-is-applied-the-get-apis-whereclause)), and a row rule the route cannot evaluate
  closes the list to absolute callers as well. A login-free API gets no automatic absolute role (only
  the ones it lists), so a login-free parent with a fail-closed part and no `absoluteRoles` of its own
  closes the list to **every** caller.
- `authOptions.ownershipCheck` — when true and the object declares an owner field, the hydration is
  scoped to the caller's own rows (owner scope); when true and **no** owner field resolves, that is
  itself a fail-closed part (`ownershipCheck`, below) — it cannot narrow to nothing.

`exposePublic` is tri-state and asymmetric: with a parent `get` API it can only ever **narrow**
(`exposePublic: false` forces a login even over a public parent) — it is the get API's own answer
to widen, so a login-free parent already serves publicly; `exposePublic: true` over a
login-required parent is `RECOMMENDATION_EXPOSE_PUBLIC_IGNORED` (warning) and never clears a
fail-closed part. With **no** `get` API on the object at all:

| `api.exposePublic` | Item `authorization.dataObjectAccess` | Served to | Warning |
| --- | --- | --- | --- |
| `true` | `accessPublic` | everyone, no session needed | — |
| `false` | any | any logged-in caller (no roles, no owner scope) | — |
| `true` | anything else | no one (`403`; with no parent API there are no absolute roles to inherit either) | `RECOMMENDATION_NO_READ_GATE` |
| unset | any | no one (`403`) | `RECOMMENDATION_NO_READ_GATE` |

### What is applied: the `get` API's `whereClause`

A `whereClause` is **logic, not authorization**: it says which rows exist for this caller, and no
caller bypasses it — absolute roles included. The hydration therefore applies the parent `get`
API's `query.whereClause` (`fullWhereClause` and every `additionalClauses` entry, with its
`condition` / `excludeWhen`) to every candidate, for every caller:

- It runs the **same MScript** the `get` API runs, in the **same context**: `this` is the `get`
  API's own request context, built from the caller's request the way that API builds it, with the
  candidate's id bound to the API's id parameter (`this.<item>Id`). So `this.session`,
  `this.userHasRole(...)` and the session slots hold exactly what the `get` API would see for this
  caller.
- The result is conjoined into the one hydration query (with the tenant pin, soft delete, the owner
  scope and the moderation / published-state term). A clause that does not read the id is evaluated
  once per request; a clause of the form `{ id: this.<item>Id, ... }` is bound to every candidate id
  at once (`id IN [...] AND ...`); any other clause that reads the id is evaluated per candidate and
  OR-ed into the same single query. A clause that throws drops what it was evaluated for.
- Each evaluated term goes through the `get` API's own where-clause normalization, same rules in the
  same order: an undefined value that empties the clause is refused there (`400`), so that
  candidate is not served; an undefined `$or` branch is dropped (the owner-visibility clause
  `{ $or: [{ isPublished: true }, { ownerId: this.session.userId }] }` serves an anonymous caller
  the published rows, as the `get` API does); an array-membership operator on a scalar column
  degrades to `$in` / `$nin` (and, on postgresql, a scalar term on an array column lifts to
  `$overlap`).
- **A `get` API with no id parameter.** On the default route a
  `fullWhereClause` IS the `get` API's row address, and a custom route
  without `:<item>Id` is the same; that `get` API answers the FIRST matching row. For a
  recommendation list its `whereClause` is read as a **row filter**: every candidate the clause
  matches is served (a `{ isPublished: true }` clause serves every published candidate), never only
  the row the `get` API would answer first. This is deliberate: a `whereClause` is logic. The
  latest-record fallback (the `{}` planted on a route with no selector and no segment)
  is not a restriction, so there the list is filtered only by its own scope (tenant, soft delete,
  moderation / published state) and its `filters`.
- **Evaluable** means the clause reads only constants, `LIB` functions, the addressed id
  (`this.<item>Id`) and the caller: `this.session`, `this.auth`, `this._userId`, `this._userIdValue`,
  `this._tenantId`, `this._userRole`, `this.userHasRole(...)`, `this.userHasAnyRole(...)`,
  `this.currentRoleIds()`. A clause that reads anything else — a request parameter
  (`this.status`), an action result (`this.<actionName>`), the request itself (`this.request`), a
  computed member (`this[...]`), code built from a string (`eval` / `Function`) — **cannot be evaluated** by a route that has none of those, and is
  a fail-closed part that no caller passes (below). So is an authored `selectBy` term beyond `id`:
  it always reads a request parameter.

### A login-free `get` API

A login-free `get` API has no caller identity, so the list does for an anonymous caller exactly what
the generated `get` does:

- **Skipped, as on the `get` API**: `checkRoles` (the role gate applies only under `loginRequired`),
  `ownershipCheck` and its owner scope, and `parentOwnershipChecks`. The list never names them.
  `PUBLIC_API_WITH_ROLE_GATE` (error) reports them on the `get` API itself: they have no effect there.
- **Still run on the `get` API, so the list still fails closed on them**: `permissionCheck`
  (the permission check does not test `loginRequired`), `foreignPermissionCheck`, `requireApproval`,
  `queueTokenRequired`, `requiredCallerKind`, and every access-control action (a membership,
  permission or object-permission check action runs with no login short-circuit and refuses a caller
  it cannot identify).
- **Logic still applies**: the `whereClause` (above), a required lookup (`fetchObjectActions` with
  `isRequired`), and the response shaping.

### What fails closed (403 `RECOMMENDATION_GATE_NOT_INHERITED`)

A recommendation route decides once, at compile time, from the parent `get` API's declaration. Every part below that the parent API carries is
named in the design-time warning and refused at request time — anonymous callers included, and on a
**login-free** parent too: the route checks these parts before it looks at `loginRequired` /
`exposePublic`, so a public parent never serves rows or fields its own `get` would hide.

- A **row rule or a redaction condition the route cannot evaluate** (`whereClause.*`,
  `removeFromResponseActions.<name>` with such a condition) refuses **every** caller, absolute roles
  included: it is logic, and on the `get` API no role bypasses it either.
- **Every other part** refuses every caller without an absolute role. A caller holding one of the
  parent's effective `absoluteRoles` passes, exactly as that role bypasses those authorization
  checks on the `get` API. The list's own `filters`, the tenant pin, soft delete, the `whereClause`
  and the read state (as the parent `get` applies it to that caller) still apply to them.

| Category | Named as | Triggered by | Who passes |
| --- | --- | --- | --- |
| No read gate at all | `noGetApi` | The object has no `get` API on this service, and the list neither sets `exposePublic: false` nor is an `accessPublic` object served with `exposePublic: true` (table above). | absolute roles (none to inherit) |
| Access-control gates | `permissionCheck`, `foreignPermissionCheck`, `requireApproval`, `queueTokenRequired`, `parentOwnershipChecks`, `requiredCallerKind` | Any of these set (non-empty / non-`any`) on the parent API's `authOptions`. On a login-free parent, `parentOwnershipChecks` is skipped instead ([above](#a-login-free-get-api)). | absolute roles |
| Ownership with no column | `ownershipCheck` | `ownershipCheck: true` on a login-required parent but no property resolves as the object's owner field. | absolute roles |
| Row visibility the route cannot evaluate | `whereClause.fullWhereClause`, `whereClause.additionalClauses`, `whereClause.selectBy.<name>` | A where clause or additional clause that reads more than constants, `LIB`, `this.<item>Id` and the caller ([above](#what-is-applied-the-get-apis-whereclause)), or a `selectBy` term other than `id`. An evaluable one is **applied**, not named. | nobody |
| Access-control actions | `membershipCheckActions.<name>`, `permissionCheckActions.<name>`, `objectPermissionActions.<name>`, `validationActions.<name>`, `readJwtTokenActions.<name>`, `verifyWebhookActions.<name>` | Any declared action in one of these six buckets on the parent API — every one is presumed to exist to refuse the caller. | absolute roles |
| A required lookup | `fetchObjectActions.<name>` | `isRequired: true` with `onActionError` not `completeApi` (the action throws 404/503 on a miss). | absolute roles |
| Response redaction the route cannot apply | `removeFromResponseActions.<name>` | A `condition` (or an `applyToListRows` `rowCondition`) that reads more than the caller and the item, or `eval` / `Function`, or a condition reading `this.output` / `this.result` whose position in the `get` API's output stage the route cannot reproduce (see [response shaping](#response-shaping)). | nobody |
| Response reshaping | `response.<key>`, `listMapActions.<name>`, `functionCallActions.<name>`, `arrowFunctionActions.<name>` | A response addition that overwrites an item field, a result-replacing list map, or code that writes into or hands over `this.result` / `this.instance` / `this.output` / `this.<item>`. | absolute roles |
| Tenant pin mismatch | `tenantScope.<field>` | The parent `get` pins the tenant on a column other than the item's own tenant column. | absolute roles |
| List-level filters on the get API | `listOptions.permissionFilters.<name>`, `listOptions.membershipFilters.<name>`, `listOptions.jointFilters.<name>`, `listOptions.searchFilter` | The parent `get` declares any of these (the where-clause include applies them with no crudType gate). | absolute roles |

Moderation (`objectModeration.onPlace`) and a ContentModel's published state are **not** in this
table: the hydration applies those read-state rules itself, the same way the item's `get` API does
— see [moderation and published state](#moderation-and-published-state) — rather than failing the
whole list closed.

The remedy text in the warning is specific to the category: a row rule the route cannot evaluate
names the reads that made it so (`It reads this.status, ...`) and says to express the rule over the
caller and the addressed id, or to move the request-dependent part into `filters.visibleWhen` (which
**is** evaluated per candidate, at request time); an access-control action says there is no
recommendation-side equivalent — keep it and accept an absolute-roles-only list, or move the
caller-side half into `checkRoles` and the row-side half into `visibleWhen`; a redaction part says
an **unconditional** `removeFromResponseActions` entry, a **plain** `selectProperties` list (no
aliases) and a condition over the caller and the item are all applied, so expressing it that way
makes the gate inheritable.

### Worked example: a `whereClause` that is applied, and one that is not

A `getProduct` API for signed-in shoppers (`loginRequired` left at its default, `true`, with
`absoluteRoles: ["catalogAdmin"]`) that only ever returns published rows:

```json
{
  "basics": {
    "apiOptions": { "name": "getProduct", "crudType": "get", "dataObjectName": "product" },
    "authOptions": { "absoluteRoles": ["catalogAdmin"] }
  },
  "query": {
    "whereClause": { "fullWhereClause": { "js": "({ isPublished: true })" } }
  }
}
```

A `boughtTogether` list over this `product` validates with no `RECOMMENDATION_*` code. At request
time the hydration conjoins `{ isPublished: true }`: a shopper **and** a `catalogAdmin` both get
published neighbors only — `catalogAdmin` bypasses `getProduct`'s authorization checks, not its row
rule, on `getProduct` itself and on the list alike. A clause such as
`this.userHasRole('catalogAdmin') ? {} : { isPublished: true }` is applied the same way and reads
the caller, so there `catalogAdmin` sees every neighbor and a shopper the published ones — again
exactly what each would get from `getProduct`.

Now a clause that narrows by a request parameter:

```json
{
  "query": {
    "whereClause": { "fullWhereClause": { "js": "({ isPublished: true, region: this.region })" } }
  }
}
```

The recommendation route has no `region` parameter, so it cannot evaluate this clause. Validating the
list reports exactly one code:

```
W: RECOMMENDATION_GATE_NOT_INHERITED
   Recommendation list "boughtTogether": the read gate of getProduct uses
   whereClause.fullWhereClause, which the recommendation route cannot evaluate per candidate, so
   the list refuses EVERY caller, absolute roles included (whereClause.fullWhereClause: logic the
   route cannot evaluate, not authorization) (fail closed, 403 RECOMMENDATION_GATE_NOT_INHERITED).
   api.exposePublic does not change this: a list never widens its item's gate. The row rule
   whereClause.fullWhereClause of getProduct cannot be evaluated by the route, so no caller reads
   the list, absolute roles included (a row rule is logic, not authorization). It reads
   this.region, which a recommendation route does not have. The route applies getProduct's
   whereClause to every recommended item when it reads only constants, LIB functions, the
   addressed id (this.<item>Id) and the caller (this.session, ...); express the rule that way, or
   move the request-dependent part into the list's filters.visibleWhen. There is no list-level
   opt-out.
```

At request time every caller — a shopper, a caller with no session, and a `catalogAdmin` — gets
`403 RECOMMENDATION_GATE_NOT_INHERITED`. The fix keeps the part the route can evaluate on the `get`
API and moves the request-dependent part to the list, where it **is** evaluated per candidate (here
against the caller's session):

```json
{
  "query": {
    "whereClause": { "fullWhereClause": { "js": "({ isPublished: true })" } }
  }
}
```
```json
{
  "name": "boughtTogether",
  "kind": "complementary",
  "evidence": [{ "relation": "coPurchased" }],
  "filters": { "visibleWhen": { "js": "candidate.region == session.region" } }
}
```

This validates with no `RECOMMENDATION_*` codes at all. Note what the fix changes on the `get` API
itself: `getProduct` no longer narrows by `region`. If it must, keep that clause on `getProduct` and
accept a list that no caller can read.

## Response shaping

A served item never carries more than the item's own `get` API would return to that caller. A `get`
bound to a DataView is supported. The route reads all eligible candidate view documents in
one bounded query per hydration batch. A dynamic view uses one descriptor batch for its joins and
stats; its number of read queries depends on the declared view, not the number of candidates.
List filters still read the scoped table rows. The route projects the view columns and applies the
get API's supported response shaping, including caller-dependent removals, scrubs and ledger units.
It runs no item workflow actions of the `get` API. A view miss drops the
candidate. A stored view's where clause runs against the view source, including computed columns;
a dynamic view's clause follows its get API's database read before enrichment.
A view-bound list stays closed with `403 RECOMMENDATION_GATE_NOT_INHERITED` for every caller
when any pre-response get workflow action is outside the supported read-only types, publishes
its result, overwrites read context, or contains a script not proven read-only. The supported
types are an unused optional FetchObject with a fresh read-only query, FunctionCall and
ArrowFunction with proven read-only scripts, and the response removals the list already
reproduces. Conditions are checked as well as action bodies. Static caller reads such as
``this[`_tenantId`]`` are allowed, including literal bracket keys. Manager aliases,
destructuring or passing `this`, dynamic keys, unlisted calls, writes and unknown script
constructs keep the list closed. Containers also stay closed because their result routing
can change the read context or rows. Checks cover every get stage before the response,
including the missing-instance branch; `afterSendResponse` and `afterApiEvent` are later.
The conservative check ensures the batched answer does not depend on omitted workflow effects.
The list retains its final internal-column strip and adds `_rec` last. DataView binding itself
does not close the gate; the other unsupported parts above still do.

Each DataView hydration batch accepts at most 1,000 candidate ids. A larger batch refuses the
whole recommendation request before reading the table or view. Dynamic joins also refuse a
batch when `candidateCount * (joinSize + 1)` exceeds 60,000,
so a join with size 1,000 accepts at most 59 candidates per batch. These refusals return
`500 RECOMMENDATION_SERVE_FAILED` with a problem body and no partial item list. An unavailable
view store or an incomplete view search also fails the whole request; a missing stored-view
index answers an empty list.

Dynamic joins and stats use the get API's key normalization: array keys drop empty strings,
nulls and non-scalar entries and deduplicate by string value; scalar `0` and `false` remain valid.

For a table-backed `get`, the
hydration itself drops the item's own hashed and `isSecret` properties, retaining only a declared
per-record ledger scale until conversion. Then, in order, on
the hydrated row (filters already ran against the hydrated row, not the redacted one):

1. **Ledger major units** — convert the hydrated row's ledger columns using the same
   conversion as its `get` API, before any scale column can be removed
   (see [Ledger](ledger.md)).
   A hidden scale is then dropped along with the full hidden-field list. Missing or invalid
   per-record scales are never guessed. Filters still see stored minor units; presentation
   does not mutate their hydrated input. A whole-unit ledger (scale 1) rescales nothing.
2. **Projection** — a `selectClause.selectProperties` list projects the row to those
   properties plus `id` (select-joins are not served). Where the `get` API's `barcode:code` select
   returns the source key `barcode`, recommendations mirror that
   behavior. The alias declaration alone does not rename either answer.
3. **Credential scrub** — the SAME helper and the SAME name list the `get` API's own response uses:
   the service's secret property names minus that API's own exposed secret columns, applied deep, by
   name (a column named like a secret anywhere, including nested in a JSON column, is stripped).
   With a conditional removal declared this runs here, before the removals, because the `get` API
   scrubs while it builds its output, before its output-stage actions run.
4. **`removeFromResponseActions`** — exactly the removals the `get` API applies to its answer:
   the ones placed in the `afterBuildOutput` stage of the `get` workflow (top-level, or inside a
   container action placed there). That is the only stage whose removals change the answer:
   `this.output` exists from `buildOutput` on, and the response is built right after that stage. A
   removal placed in an earlier stage (`afterMainGetOperation`, ...) finds no output and removes
   nothing; one placed later runs after the answer is built; an unplaced one never runs. The `get`
   API applies none of those, so neither does the list. Each applied removal is walked the way that
   action walks its paths (dot path, `[n]` as a segment; copying along the path rather than mutating
   the hydrated row). With only **unconditional** removals the order does not matter and every path
   is deleted. As soon as one has a `condition` (or `applyToListRows` + `rowCondition`), the route
   runs them in the `get` API's **own order**: the stage order, each condition evaluated right before
   its action on the CURRENT output (`this.output` = the item being served, `_type` included), then
   the members of a container action placed in the stage. A member listed in the stage beside its
   container runs only inside the container, as on the `get` API, so a condition of such a member that
   reads the output is closed rather than evaluated at the sibling position. Each condition is the
   `get` API's own MScript, run in the
   `get` API's context for this caller (`this.session`, `this.userHasRole(...)`,
   `this.<item>Id`, `this.<item>` / `this.result` = the hydrated row). A condition reads the
   ledger columns of `this.output` in stored (minor) units, as on the `get` API, which converts only
   when it finishes its answer: the route evaluates it on the same shaping without step 1 and applies
   every removal to both copies. "Hide `costPrice` unless
   admin" (`condition: "!this.userHasRole('admin')"`) serves `costPrice` to an admin and not to
   anyone else, exactly as `getProduct` does; "hide `costPrice` of drafts" (`this.output.isPublished
   === false`) placed before an unconditional removal of `isPublished` reads `isPublished` before it
   is removed, exactly as on `getProduct`. An entry with `applyToListRows` is applied to each served
   item (a recommendation list is rows), its `rowCondition` evaluated per item with the item bound
   under `itemName`; on the `get` API itself `applyToListRows` walks `output.data[i]`, which a `get`
   response does not have (`LIST_ROW_REDACTION_ON_NON_LIST`), so the list removes more than the
   `get` API, never less. A condition that throws removes the paths. A condition that reads
   `this.output` / `this.result` where the route cannot reproduce the order (another action placed
   before it in the stage, a placement inside a container action, a read of a response addition or
   of the whole output) is closed to every caller.
5. **Internal-column strip** — the SAME helper and name list: the service's internal response
   columns plus the moderation columns the object owns, if any. A `get` API that opts out
   (`exposeInternalColumns`) still never leaks them through the recommendation route.
6. **`_rec`** is added last and is never subject to any of the above.

A redaction the route cannot reproduce is a fail-closed gate part, not a partial redaction: a
condition that reads more than the caller and the item, or reads the output where the order is not
reproduced (`removeFromResponseActions.<name>`, closed to every caller, absolute roles included) - see
the table above. The list refuses rather than serving a field that `get` hides. DataView bindings
and aliased select entries are supported where the compiler implements this response path; a compiler
that does not keeps the refusal.

## Multi-tenancy

The neighbor and popularity tables carry their own `tenantId` column, scoped to the **interactions**,
not to the item object's own tenant setting (a platform-wide catalog sold through tenant-level carts
still partitions its co-occurrence per tenant — mixing two tenants' baskets into one pair would leak
one tenant's buying pattern into another's recommendations). The refresh writes the tenant from the
source rows; a source with no tenant column writes (and is later read) under the empty-string scope.

At serve time, the caller's own tenant is read **from the session only** — never from a request
header — and scopes two reads: the neighbor/popularity read of every evidence entry whose sources
carry a tenant (an entry whose sources carry none reads the `''` scope), and, for a **tenant-level**
item object, the hydration query (the item's tenant column must equal the caller's tenant). A guest
with no session gets the empty-tenant scope: on a tenant-scoped relation, or over a tenant-level
item, that is an empty list (fail closed, not a cross-tenant leak), with fallbacks still applying.

## Moderation and published state

A recommendation list serves through the item object's own data, so its hydration applies the SAME
read-state rule the item's own `get` API applies — conjoined on the query that fetches the rows, not
a filter checked afterward, and applied to the anchor exactly like a candidate.

### onPlace moderation

An item object staged by [object content moderation](object-moderation.md) in `mode: onPlace` keeps
every verdict's row in the real table, gated by a `moderationStatus` column. The hydration conjoins
the exact term the get API's own read gate conjoins (one rule, two callers):

- **privileged** callers read every row, accepted or not — same as their `get`. Privileged means
  holding one of: the object's `reviewerRoles` (default: the platform operator `admin`; in a
  multi-tenant project `admin` is spelled `saasAdmin`), `superAdmin` (always), and `tenantOwner`
  (only under the double condition below). Author `absoluteRoles` are not privileged here;
- any other identified caller reads `accepted` rows **plus** their own authored rows regardless of
  status (so an author always sees their own pending or rejected submission in their own
  "also interested in" rail, exactly as their own `get` call would show it to them);
- an anonymous caller (no session at all) reads `accepted` rows only.

A pending or rejected **anchor** goes through the same term: an ordinary caller gets
`404 RECOMMENDATION_ANCHOR_NOT_FOUND` for it, exactly as their `get` call on that id would 404 (not
`403` — the row behaves as if it does not exist to them, not as a refused list).

**`tenantOwner` is privileged only in a multi-tenant project, on a tenant-level item, when the
hydration itself pins the item's tenant column AND the item's own `get` API runs the tenant filter.**
This is stricter than the general moderation resolver alone would be, so that a SaaS-level `get` API (one that does *not* pin
a tenant) never grants through the list a tenant-wide privilege its own `get` API does not grant.

### ContentModel published state

A ContentModel's content object is never `onPlace`-moderated (its `contentModeration` is staged only,
which never writes an unapproved row, so there is no moderation state to gate), but its non-preview
read path (the delivery read) serves `status: published` rows only — a recommendation list has no
editorial preview, so it conjoins `{ status: "published" }` for **every** caller, with no privileged
exception (there is no "author" or "reviewer" concept for a draft content item on this route).
See [Build a content editorial UI](content-editorial.md).

### Worked example

An `event` object with `objectModeration.mode: "onPlace"`, `reviewerRoles: ["eventReviewer"]`, and a
`popularEvents` recommendation list. Three callers of the SAME list, over the SAME precomputed rows:

| Caller | Sees |
| --- | --- |
| An ordinary logged-in user | Only `event` rows with `moderationStatus: "accepted"`. A pending or rejected neighbor is silently dropped from the list — not an error, not a `403`. |
| The event's own author | The same accepted rows, **plus** their own pending/rejected submissions if those happen to be neighbors — identical to what `getEvent` would show them. |
| A user with the `eventReviewer` role (or `superAdmin`) | Every neighbor regardless of `moderationStatus` — identical to what `getEvent` would show them. |

None of this needs a separate flag on the list: it is read straight off the item object's own
`objectModeration` block, the same way the tenant and ownership scoping is read off the item's own
`get` API.

## Design-time warnings and errors

Every check below runs only while `recommendationSettings.enabled` is true and the block declares at
least one list. The read-gate codes (`RECOMMENDATION_GATE_NOT_INHERITED`, `RECOMMENDATION_NO_READ_GATE`,
`RECOMMENDATION_EXPOSE_PUBLIC_IGNORED`) and the refresh/lane/db warnings are covered in their own
sections above; this table is the full list, including the ones that are not.

| Code | Meaning |
| --- | --- |
| `RECOMMENDATION_DECAY_HALF_LIFE_INVALID` (E) | A list declares a non-positive, non-finite or otherwise invalid integer `decayHalfLifeDays`. Reported at the list path. Use a positive integer; null/absence means no popularity decay, or the 30-day default for actor lists. Positive integer strings retain the standard validator coercion. |
| `RECOMMENDATION_SOURCE_PATH_UNRESOLVED` (E) | A declared source's `eventObject` is not a data object of the service (including an entry with no `eventObject`), or one of its role paths (item, group, actor, time, weight) or its `itemLookup` property does not resolve. A declared `validWhen` is not checked here (see `RECOMMENDATION_VALIDWHEN_UNSUPPORTED`). |
| `RECOMMENDATION_SOURCE_MISSING_ROLE` (E) | A source lacks a role its relation needs; a tenant-level item reads a declared source with no tenant anywhere on its path; a windowed list (`windowDays`) reads a source with no `timeProperty`. |
| `RECOMMENDATION_KIND_EVIDENCE_MISMATCH` (E) | `personalized` requires neighbor evidence (`coPurchased`, `coConsumed`, `coViewed`, `consumedAfter`); `buyAgain` requires `repeat`; `next` requires `consumedAfter`. Empty or incompatible evidence is rejected. |
| `RECOMMENDATION_ACTOR_SOURCE_REQUIRED` (E) | An actor list's own evidence does not resolve to a source with actor and time roles; a different source elsewhere on the object cannot supply its history. |
| `RECOMMENDATION_ACTOR_HISTORY_INDEX_MISSING` (W) | A recognized declared actor-list source with actor/time on the same discoverable table lacks a full-domain leading actor/time composite index (or tenant/actor/time when the tenant predicate is on that table). Pattern sources, split-table paths and unknown metadata are not checked. The latest-500-events cap bounds aggregation input; the database may still scan or sort retained history without a suitable index. |
| `RECOMMENDATION_ANCHOR_PARAM_REQUIRED` (E) | A custom `next` route omits the item's anchor path parameter (for example `:productId`). |
| `RECOMMENDATION_EVIDENCE_SIGNAL_MISMATCH` (E) | The toy-car rule: a view-like signal feeding `coPurchased`/`repeat`, or a purchase-like one feeding `coViewed`. |
| `RECOMMENDATION_SOURCE_UNKNOWN` (E) | `evidence.source` names no declared or pattern source of the item. |
| `RECOMMENDATION_VISITS_SOURCE_UNAVAILABLE` (E) | An explicit visits source names an object or signal without enabled tracking, retained history and an enabled visit API for that signal. |
| `RECOMMENDATION_FALLBACK_UNKNOWN` (E) | A `fallback` name is not a list of the same object. |
| `RECOMMENDATION_FALLBACK_CYCLE` (E) | A fallback chain returns to a list already on its own path. |
| `RECOMMENDATION_EXCLUDE_SOURCE_UNKNOWN` (E) | `filters.excludeConsumedBy` names no source (or signal) of the object that records an actor. |
| `RECOMMENDATION_ON_AUTHZ_SURFACE` (E) | A filter MScript consults a decision provider (names `decision(s)`, `decide`, `DecisionProvider`), or any author-written API or any object's `objectSettings` in the project names the engine's neighbor/popularity table — a recommendation score is never an authorization input. |
| `RECOMMENDATION_NOT_YET_EMITTED` (W) | A declared value the selected compiler does not emit: `similarContent` (R6), `rerank` (R5), or an engine other than `sql` (R6); also actor lists and `repeat` where the compiler has not implemented them. |
| `RECOMMENDATION_NO_SOURCE` (W) | An implemented relation with no candidate source at all — the list is served empty, fallbacks apply. |
| `RECOMMENDATION_LANE_NOT_IMPLEMENTED` (W) | The service generates for a language that has not implemented the recommendation layer yet. |
| `RECOMMENDATION_ENGINE_DB_NOT_IMPLEMENTED` (W) | The service's database is not `postgresql`; no refresh runs, lists serve empty. |
| `RECOMMENDATION_REFRESH_CRON_CONFLICT` (W) | Two lists share a relation key but declare different `refreshCron`; the first list's cron is the one applied. |
| `RECOMMENDATION_NO_READ_GATE` (W) | The item has no `get` API on this service to inherit a gate from, and the list does not set `exposePublic: false` (nor `exposePublic: true` over an `accessPublic` object) — the list refuses every caller. |
| `RECOMMENDATION_GATE_NOT_INHERITED` (W) | The parent `get` API's gate uses a part this route cannot evaluate (the table in [the read gate](#the-read-gate-in-depth)) — 403 for every caller without an absolute role, anonymous callers included, login-free parent or not; for a row rule or a redaction condition the route cannot evaluate, 403 for every caller, absolute roles included (`details.closed` names those parts, `details.unevaluableReads` the reads that made them so). An evaluable `whereClause` or redaction condition is applied and never warned. |
| `RECOMMENDATION_EXPOSE_PUBLIC_IGNORED` (W) | `api.exposePublic: true` declared, but the parent `get` API requires a login — a list never widens its item's gate. |

W = warning, E = error. `RECOMMENDATION_VALIDWHEN_UNSUPPORTED` is not in this table on purpose: it
is a runtime refresh error (see the `validWhen` field above), not a design-time code.

## Worked examples

Each example below validates with no `RECOMMENDATION_*` code.

### A store: "customers also bought"

Zero interaction-source declaration — the catalog-bound cart supplies it:

```json
{
  "serviceSettings": { "serviceBasics": { "name": "shop" } },
  "shoppingCartConfig": {
    "basicSettings": { "useShoppingCartFeature": true, "cartObjectName": "cart", "supportGuestCart": true },
    "productCatalogSettings": { "useProductCatalog": true, "productDataObject": "product" }
  },
  "dataObjects": [
    {
      "objectSettings": {
        "basicSettings": { "name": "product" },
        "recommendationSettings": {
          "enabled": true,
          "lists": [
            {
              "name": "boughtTogether",
              "kind": "complementary",
              "evidence": [{ "relation": "coPurchased" }],
              "fallback": ["bestsellers"]
            },
            {
              "name": "bestsellers",
              "kind": "trending",
              "evidence": [{ "relation": "popularity" }],
              "windowDays": 30,
              "decayHalfLifeDays": 7
            }
          ]
        }
      },
      "properties": [{ "basicSettings": { "name": "barcode", "type": "String" } }]
    }
  ],
  "businessLogic": [
    {
      "basics": {
        "apiOptions": { "name": "getProduct", "crudType": "get", "dataObjectName": "product" },
        "authOptions": { "loginRequired": false }
      }
    }
  ]
}
```

A frontend calls `GET /products/:productId/recommendations/boughtTogether` (public, no session
needed, since `getProduct` sets `loginRequired: false`). When fewer than `size` (10) items come
back, it is topped up from `bestsellers`.

### A multi-tenant catalog

The same object in a **multi-tenant project**, with a per-tenant catalog
(`authorization.objectDataIsInTenantLevel`). No change to the lists: in a multi-tenant project the
generated cart and cart-item objects are themselves tenant-level, so the
tenant partition is automatic, from the cart line's own tenant column, not a knob on
`recommendationSettings`.

```json
{
  "objectSettings": {
    "basicSettings": { "name": "product" },
    "authorization": { "objectDataIsInTenantLevel": true },
    "recommendationSettings": {
      "enabled": true,
      "lists": [{ "name": "boughtTogether", "kind": "complementary", "evidence": [{ "relation": "coPurchased" }] }]
    }
  },
  "properties": [{ "basicSettings": { "name": "barcode", "type": "String" } }]
}
```

Tenant A's and tenant B's baskets never pair with each other; each tenant's callers see only their
own tenant's `sys_productNeighbor` rows.

### A list with `visibleWhen` and a fallback

```json
{
  "name": "alsoBought",
  "kind": "related",
  "evidence": [{ "relation": "coConsumed" }],
  "filters": { "excludeConsumedBy": "shoppingCart", "visibleWhen": { "js": "candidate.inStock == true" } },
  "fallback": ["bestsellers"]
}
```

An item the caller already ordered is excluded (`excludeConsumedBy`); an out-of-stock neighbor is
filtered at serve time even though it is still in the (stale-by-one-refresh) neighbor table; a short
result tops up from `bestsellers`.

### A declared source: hand-modelled order lines

A service with its own `order` / `orderLine` objects instead of the shopping-cart pattern declares
the source once on the item, and every list names it:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "product" },
    "recommendationSettings": {
      "enabled": true,
      "sources": [
        {
          "name": "orderLines",
          "eventObject": "orderLine",
          "itemProperty": "productId",
          "groupProperty": "orderId",
          "actorProperty": "order.customerId",
          "timeProperty": "order.placedAt",
          "signal": "purchased",
          "validWhen": { "js": "({ 'order.status': ['paid', 'shipped'] })" },
          "weightProperty": "quantity"
        }
      ],
      "lists": [
        {
          "name": "boughtTogether",
          "kind": "complementary",
          "evidence": [{ "relation": "coPurchased", "source": "orderLines" }]
        },
        {
          "name": "customersAlsoBought",
          "kind": "related",
          "evidence": [{ "relation": "coConsumed", "source": "orderLines" }],
          "windowDays": 180,
          "filters": { "excludeConsumedBy": "orderLines" }
        }
      ]
    }
  }
}
```

with `orderLine` declaring `orderId`, `productId` and `quantity`, and `order` declaring `customerId`,
`status` and `placedAt`. `order.customerId` is one relation hop through the `orderId` foreign key
(the `<object>Id` convention); a deeper path, or a property that does not exist, is
`RECOMMENDATION_SOURCE_PATH_UNRESOLVED`. The signal `purchased` may feed `coPurchased`; a view-like
signal there would be `RECOMMENDATION_EVIDENCE_SIGNAL_MISMATCH`.

On a tenant-level `product` in a multi-tenant project, the event object (or an object one of its
paths reaches) must carry a tenant, or the source is `RECOMMENDATION_SOURCE_MISSING_ROLE` — two
tenants' orders are never pooled. The design-time check resolves tenancy the way the build does: an
object carries the tenant column when it declares `objectDataIsInTenantLevel: true` in a multi-tenant
project, so a tenant-level `orderLine` — or a tenant-level `order` reached through `orderId` —
satisfies it. In a single-tenant project no object carries a tenant column and the check does not
apply.

### The frontend call

```js
async function loadAlsoBought(productId, baseUrl) {
  const res = await fetch(`${baseUrl}/products/${productId}/recommendations/alsoBought?limit=6`);
  if (res.status === 404) return []; // caller cannot read this item, or it does not exist
  if (!res.ok) return []; // hide the carousel; do not surface an error
  const { items } = await res.json();
  return items; // already in rank order
}

function renderCarousel(container, items) {
  container.innerHTML = items
    .map(
      (it) => `
    <a class="card" href="/products/${it.id}" data-rec-list="${it._rec.list}">
      <img src="${it.imageUrl ?? ''}" alt="${it.title ?? ''}">
      <span>${it.title ?? ''}</span>
    </a>`,
    )
    .join('');
  // When the user opens one, append ?rec=<listRequestId> to the item request
  // The opened item's visit stores this value in attribution.
}
```

An empty `items` array hides the carousel; it is not an error.

## What a compiler may not implement

A compiler generates the recommendation layer for the target languages it supports. A service whose
language has not implemented it, and that declares an active `recommendationSettings` block, gets the
design-time warning `RECOMMENDATION_LANE_NOT_IMPLEMENTED`: its recommendation runtime is not
implemented. A compiler must reproduce the behaviour this guide documents (relation key format, gate
parts, response shape, scoring formulas) for what it does implement. The slices a compiler may leave
out are the visits source (`coViewed`, `consumedAfter`, impression logging), the actor lists
(`personalized`, `buyAgain`, `next`), DataView-bound `get` answers and databases other than
PostgreSQL; each keeps its warning in that case. See
[the compiler specification](../../compiler/index.md).

## Privacy

**What is stored:** the precomputed tables hold only `tenantId`, a `relationKey`, item/neighbor ids,
a score, a support count and a computed timestamp — no actor identity at all. The *interactions*
that produced those rows live in their own source objects (a cart's line items, under the cart's own
retention), not duplicated into the recommendation tables. At serve time, the caller's own actor keys
are used for `excludeConsumedBy` and the bounded personalized history or repeat query.
Actor lists add no per-user recommendation table. Where visit tracking is supported, an eligible actor is also recorded on `seen`
visit history rows when impression logging is enabled; visit history follows its configured
retention, separately from the precomputed recommendation tables.

**What a served item carries** about the caller: nothing beyond what that caller's own `get` call on
the item would already show them (response shaping, above).

## Limitations and planned slices

| Slice | Adds |
| --- | --- |
| R1 | Shared reader, cart source, `sql` engine (`coPurchased`/`coConsumed`/`popularity`), neighbor/popularity tables, refresh, serving, deterministic filters, fallback. |
| R2 | Visits as a source (`coViewed`, `consumedAfter`), impression logging + `?rec=` attribution. ContentModel slug-read adoption awaits its owning integration. |
| R3 | Paid-only restriction on the cart source, an invoicing source, catalog-verified category/brand on cart lines. |
| R4 | Request-time `personalized`, `buyAgain` from `repeat`, recency weighting; `next` uses directed `consumedAfter` neighbors. |
| R5 | A bounded, fail-open decision-provider rerank (`RecommendationList.rerank`) — ranks the already-filtered page; never generates candidates, never filters, never authorizes. |
| R6 | `clickhouse` / `compute` / `graph` engines; the `similarContent` relation. |
| R7 | Offline evaluation, a chosen default scoring, an online CTR report. |
| R8 | Capability discovery (diagnostics, tool overview, authoring presets). |

## See also

- [Object visits](object-visits.md) — the `access` / `view` / `read` history the visits source reads as an
  interaction source, and the sibling pattern this one's hard rules
  (no authorization from a signal) are shared with.
- [Shopping cart](shopping-cart.md) — the `coPurchased` / `coConsumed` / `popularity` source this
  guide's R1 slice reads with zero author declaration, and the guest-cart actor rule it reuses.
- [Object content moderation](object-moderation.md) — the `onPlace` read gate a recommendation
  list's hydration conjoins with the caller's session (above).
- [The decision layer](decision-layer.md) — the decision-provider rerank planned as R5 is this
  family's provider; a rerank only ranks, it never filters or authorizes.
