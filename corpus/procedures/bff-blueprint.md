# BFF module authoring — core procedure

Harness-agnostic. Every step names the blueprint path it reads or edits. Extracted
from the Ada corpus (#4400); provenance and translation notes in
`../README.md`. Companion to `blueprint-authoring.md` — its tool semantics
(section 3), authoring loop (section 9), MScript descriptor rule, and
result discipline apply here unchanged. This guide covers only what is
DIFFERENT about the BFF module.

**Task shape.** You are given the project's `bff-spec` (the design document
`design/bff-spec.md`, written in the design phase) and the current blueprint state. You
author the `bffService` module against the LIVE domain services, validate
it clean, and prove completeness against the spec.

**Lifecycle position: Phase 4, FIRST platform module**
(`project-lifecycle.md`). BFF is authored and built BEFORE the
notifications wiring — notification payload views reference DataView
shapes. Gated by `hasBff` in `project-basic-setup`. Unlike the old
parallel-apply regime, the domain services are already written and built
when this task runs: verify everything against the live blueprint, not
against plan documents.

**Grandparent-filter recipe (verified live).** When a stat must filter on a
field one hop PAST the stat's child (e.g. sum order lines only for PAID
orders: product -> orderItem -> order.status), declare a small HELPER VIEW
(orderItem + its parent order as a `oneToMany: false` aggregate) and use
THAT VIEW as the stat's `childObject` — views are legal stat sources — with
the filter reading the aggregated parent (`this.parentOrder && ...`).

## 1. What the BFF is (and isn't)

The BFF is a **configuration-only service**: no data objects, no business
APIs. Its entire job is to declare DataViews — denormalized, read-optimized
Elasticsearch views that join data from multiple services into shapes a
consumer can use in a single fetch. Consumers are NOT the frontend (direct
frontend access to BFF was removed); they are:

- **Business services** — a list/get BusinessApi can opt into a DataView
  instead of a dynamic select-join. Materialize when the endpoint is hot or
  the joined shape is deep (rough threshold: 3+ joins); otherwise a dynamic
  select-join is the same cost as a local join.
- **Notifications** — the notification service needs joined payload data at
  event time and cannot join at runtime itself.
- **Custom code** — `LIB.dataViews.<viewName>(filter?, { page, limit }?)`
  from a library function, hook or action returns the view's rows (#4846).
  Code serving a caller passes `{ session: this.session }` (or
  `{ scoped: true }` inside an api request): the read is pinned to the
  caller's tenant and active-only, like the consuming api's where clause.
  Without either option it is a SYSTEM read (every tenant's rows), for
  system work only.

**Stored or dynamic — both are consumable (#4846).** A DataView is a
reusable query definition first; `viewBasics.isStored: true` adds the
Elasticsearch materialisation on top.

- **Stored** (`isStored: true`): an index is built and kept in sync from
  the source events; a binding api reads the joined document from it. Fast,
  seconds-stale. Choose it for hot lists and for data SQL serves poorly.
- **Dynamic** (the default): nothing is indexed. An api that binds it with
  `apiOptions.dataViewName` reads its object from the DATABASE with its own
  where clause exactly as authored (selectBy / fullWhereClause /
  additionalClauses — an `$or` visibility rule included) and the view's
  aggregates/stats are joined onto each row per request. Choose it for a
  LIVENESS read (remaining capacity, a single-row read-your-own-write page)
  where a seconds-stale index would lie. A notification bound to a dynamic
  view computes its document when the event arrives.
- A dynamic view pays its joins on every read: keep read-time LIST apis
  paged. Every list is paged unless it declares
  `paginationOptions.unpaged: true`; that opt-out on a read-time list is
  refused (`UNPAGED_DATAVIEW_UNSUPPORTED`) and `DATAVIEW_READ_TIME_UNBOUNDED`
  explains its cost. The retired `paginationEnabled` is ignored. Validation
  reports each read-time binding as `DATAVIEW_READ_TIME` (info) —
  `DATAVIEW_NOT_STORED` is retired.

**No gap-fill views.** Author only what `bff-spec` lists (service-requested
views plus notification payload views). A use case the spec did not request
is served by a dynamic select-join inside its service, not by a speculative
materialized view here. Spec-is-a-source still applies the other way: when
a listed view is wrong (broken key, impossible join), design what is right
and record the deviation.

### Structural map — how it differs from the generic service shape

The module lives at the project-root path `bffService` (NOT under
`services/`). Top-level pattern `BFFService` — two chapters only:

| Blueprint path | Pattern | What it holds |
|---|---|---|
| `bffService/serviceSettings/documentation` | `ModuleDocumentation` | `frontendDocument` — UX-intent prose (section 4) |
| `bffService/dataViews/<ViewName>` | `DataView` | one named item per view |
| `bffService/dataViews/<ViewName>` → `viewBasics` | `ViewBasics` | `name`, `isStored`, `mainObject` (`serviceName:objectName`), `properties` (subset to carry, or omit for all) |
| `... /<ViewName>/aggregates/<Name>` | `ViewAggregate` | one named item per joined record set |
| `... /<ViewName>/stats/<Name>` | `ViewStat` | one named item per bucketed aggregation |

The generated service builds under the system service name **`bff`**.

### The deprecated `lookups[]` chapter — REJECTED

Older docs and specs may reference `ViewLookup` /
`bffService/dataViews/<View>/lookups/<Name>`. That chapter is deprecated in
the DataView pattern and **a write to `.../lookups/...` is rejected by the
server**. Single-related-record joins (the old "lookup" use case — e.g.
enriching an order with its customer record) are expressed as a
`ViewAggregate` with **`oneToMany: false`**. When the spec uses the word
"lookup" or asks for a `lookups` section, convert each entry to a
single-record aggregate.

## 2. Composition rules

**Aggregates** — ONE pattern covers both cardinalities:

- `oneToMany: true` → child records joined in; the result is an ARRAY under
  the named property (an order's line items).
- `oneToMany: false` → a SINGLE related record (one-to-one / many-to-one —
  an order's customer).

Fields: `name` (output property), `childObject`
(`serviceName:objectName`), `parentKey` (key on the view's main object),
`childKey` (matching key on the joined object), `oneToMany`, optional
`properties[]` (subset to project), optional `condition` (MScript on the
parent record), optional `checkIn` (MScript on each child record). There is
no `mainObject` field on an aggregate (it inherits from
`viewBasics.mainObject`).

**Stats** — bucket-based aggregations (conceptually Elasticsearch bucket
aggs). Fields: `name`, `childObject` (object to aggregate — may be a
previously defined view), `parentKey` (the bucket owner on the main
object), `childKey` (the FK relating child to parent), optional `select`
(MScript pre-filter on child records), and `aggList[]` of `AggregateItem`s
— each `{ name, aggField, aggType, dataType, filterValue? }` (empty list =
default count). One stat groups once and can compute several filtered
metrics via multiple aggList items.

> The Ada corpus described an older flat stat shape
> (`sourceObject`/`aggregationType`/`aggregationField`/`filterClause`);
> the current pattern is the bucketed shape above. When in doubt,
> read `openappl/spec/ViewStat.md` and its `openappl.json` entry; the ontology wins.

**MScript slots** (`condition`, `checkIn`, `select`, `filterValue`) bind
the record to `this` — read fields as `this.<field>` (descriptor form,
e.g. `{ "js": "this.status === 'active'" }`). There is **no `parent`
binding** in any DataView script slot — parent/child correlation is the
parentKey/childKey join; a bare field name or `parent.<field>` read does
not resolve and is refused at validation.

**Join-key accuracy is critical.** A wrong key fails silently at query
time. Verify every `parentKey`/`childKey` against the live objects with
a read of `services/<svc>/dataObjects/<obj>` in `blueprint.json`, always the
object sub-path, never the whole service (a real service subtree is
huge; the object path answers the question). Do not guess, and do not
trust the spec's field names without this check.

## 3. Write order (sharded)

Scaffold-then-fill: derive the view inventory from the spec first (views,
their aggregates, their stats — with the `lookups`→aggregate conversion
applied and duplicates collapsed), then author one view at a time. Before
each write: check the payload against the pattern pages; after each
write run `mindset validate blueprint.json` and resolve every error before moving on
(`blueprint-authoring.md` sections 3 and 9).

1. **Each DataView: ONE complete edit at the named-item path**
   `bffService/dataViews/<ViewName>`: `viewBasics` plus the FULL
   `aggregates` and `stats` chapters for that view in the same payload
   (named-item semantics: chapters you include are overwritten wholesale,
   chapters you omit survive — so send each view complete).
2. Per-aggregate / per-stat writes at
   `bffService/dataViews/<View>/aggregates/<Name>` (or `stats/<Name>`) are
   for the fix loop and change requests — never the primary build pattern.
3. **`bffService/serviceSettings/documentation`**: set
   `{ frontendDocument: "..." }` (section 4).

## 4. Document UX intent (`frontendDocument`)

The module's UX prose lives at
`bffService/serviceSettings/documentation/frontendDocument`; frontend
generation reads it when wiring DataView consumers into pages. Empty means
generic listings. Write 3-6 sentences covering: which views serve which
page surfaces (admin dashboard / public browse / user portal / detail
pages); expected cardinality (small reference list vs big paginated list);
which views are KPI tiles vs row-level data; cross-view drill-downs. Do not
write to `bffService` directly — module-level primitives do not exist; the
field lives in the `documentation` section.

## 5. Validate, build, gate

1. Validate the module (`mindset validate blueprint.json`, then an OpenAPPL
   validation tool or compiler when one is available) and drive `bffService` to zero errors.
2. The notifications module authoring starts only after
   the DataViews exist (its `dataViewName` references are checked against
   them).
3. **Machine completeness gate:** list the spec's inventory (every view;
   per view its aggregates split by cardinality and its stats) and diff it
   against the blueprint (`bffService/dataViews` in `blueprint.json`). Every
   spec item must exist; every extra must be
   intentional; every `lookups` conversion must be accounted for. Report
   the diff explicitly.
4. Report: views written (with aggregate/stat counts), join keys verified,
   validation status, spec deviations (including any lookup conversions
   and any views deliberately left dynamic), and which notification
   payload views the notifications task will bind to.
