# Writer guide: bff-spec

The canonical DataView design of the project's read layer. The BFF is a
configuration-only service - no data objects, no Business APIs; its whole job
is to declare DataViews: denormalized, read-optimized views that join data
across services into shapes a consumer fetches in one call. The BFF blueprint
procedure (`procedures/bff-blueprint.md`) materializes them, so every join key,
property subset and storage decision not pinned here is guessed downstream.
Owed when `hasBff` is on; written after the notification definitions when
those are owed.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `microservice-definitions`, `notification-definitions` (dropped,
  not missing, when `hasNotifications` is off).
- Supplementary: every service spec (`service-spec-*`) - their
  `## BFF DataView Needs` sections are the primary source, and their property
  tables are where every join key is verified. And `auth-spec` (dropped, not
  missing, when `hasAuthentication` is off) and `agent-hub-spec` (dropped, not
  missing, when `hasAgentHub` is off) - their `## BFF DataView Needs`
  sections are declared sources exactly like a service spec's: every bullet
  is satisfied by a view or declined with a one-line reason.
- Canon: `procedures/design/canon/dataview-access.md`.

Consumers of a view are business services (a get or list API reading the view
through `dataViewName`), notifications (a payload view, since the notification
service cannot join at event time) and custom code. A frontend surface is
never a direct consumer (the BFF mounts no public read route): it reaches a
view only through a business API that reads it.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `bff-spec` in `procedures/design/pipeline.json`; write each
exactly as given. The per-view H2 sections before them are named after each
view.

- `## Summary`
- `## Open Questions`

## Document skeleton

```markdown
# BFF Spec
## <ViewName>          <- one H2 per DataView, template below
## Summary
## Open Questions
```

Per view:

```markdown
## <ViewName>
- **mainObject:** <serviceName>:<Object> | <OtherViewName> (view-on-view)
- **purpose:** <who consumes it and why a materialized view beats a local join>
- **isStored:** true|false - <staleness decision, or "live" for dynamic>
- **aggregates:** (table REQUIRED, or "none")

| name | childObject | parentKey->childKey | oneToMany | properties |
|---|---|---|---|---|
| <name> | <svc>:<object> | <parentKey>-><childKey> | true/false | <exact subset> - condition/checkIn: <intent or none> |

- **stats:** (table REQUIRED, or "none")

| name | childObject | parentKey->childKey | aggType | aggField | filter intent |
|---|---|---|---|---|---|
| <name> | <svc>:<object> | <parentKey>-><childKey> | count/sum/avg/min/max | <exact child property; `id` for count> | filterValue: <intent or none> - select: <pre-bucket filter or none> (<dataType>) |

- **consumers:** <api / notification name(s); a surface only through the api it calls> - REQUIRED
- **for-notification:** <notificationName> (only if the view carries a notification payload)
```

## Rules

**Design views ONLY from declared needs** - never gap-fill from product
narrative: (1) every service spec's, the `auth-spec`'s and the `agent-hub-spec`'s
`## BFF DataView Needs`; (2) for each
notification in `notification-definitions`, whether the event payload alone
suffices or a payload view is needed. If neither implies a view, do not
create one - that service reads locally.

**DataView vocabulary (use it exactly):**

- **mainObject** - `serviceName:objectName`, or ANOTHER VIEW's name:
  views-on-views are allowed and are the preferred way to layer aggregation
  instead of duplicating joins.
- **isStored** - `true`: a persisted read model kept current from replicated
  change events; for filterable, sortable hot views (public browse and search
  lists, admin queues); state the acceptable staleness. `false`: assembled
  per request; for user-specific or one-record views; live reads.
- **aggregates** - joined records by key matching, `oneToMany: true` for
  arrays and `false` for a single related record. `lookups` are deprecated -
  every single-record join is a `oneToMany: false` aggregate. Each aggregate
  pins the EXACT property subset (never "all fields"), a condition intent when
  the join applies to some parent rows only, a check-in intent when the
  parent key is an array, and join keys VERIFIED against the service specs'
  property tables (exact names - never guessed, pluralized or invented).
- **stats** - the bucket join (`childObject`, `parentKey` -> `childKey`,
  verified like an aggregate's keys), `aggType` (count / sum / avg / min /
  max), `aggField` (the exact child property; `id` for count), `dataType` (the result's `DataTypes`
  literal), a per-metric `filterValue` intent (two metrics with different
  filters can split one bucket), and a pre-bucket select intent; filter
  literals copy the service specs' enum strings and casing.
- **consumers** - REQUIRED per view. A view with no named consumer is a spec
  defect: delete it or find its consumer in the declared needs.

**Table mandate:** every aggregate and stat is a row of the tables above with
exact ontology literals and real property names. Prose joins ("joined by
owner") are forbidden.

**User identity fields:** the auth user exposes `fullname` and `avatar` -
there is no `displayName`, `username` or `photoUrl`. A view joining user
identity selects exactly `fullname` / `avatar`.

**Coverage:** enumerate the PUBLIC / consumer read surfaces from the use cases
FIRST (browse and search with filters, detail views including media URLs,
profiles, notification lists), then the admin back-office queues. A BFF spec
that covers only admin surfaces is wrong.

Maintenance described in terms of source events uses the derived, lowercase
topic strings.

End with `## Summary` - a table of every view with its main object, isStored
and consumers - and `## Open Questions` (or "(none)"). If the project needs
no views, say so explicitly.

Worked example (shape, not content):

```markdown
## ListingCardView
- **mainObject:** catalog:Listing
- **purpose:** public browse and search grid; one call replaces three joins
- **isStored:** true - staleness: seconds, eventual consistency acceptable
- **aggregates:**

| name | childObject | parentKey->childKey | oneToMany | properties |
|---|---|---|---|---|
| seller | auth:user | sellerId->id | false | fullname, avatar - condition/checkIn: none |

- **stats:**

| name | aggType | aggField | filter intent |
|---|---|---|---|
| reviewCount | count | - | filterValue: status=approved - select: none (Integer) |

- **consumers:** catalog.listListings (dataViewName read); web browse grid
- **for-notification:** (not payload-carrying)
```

## Completeness check

1. Every `## BFF DataView Needs` bullet of every service spec, of the
   `auth-spec` and of the `agent-hub-spec` is satisfied by a view or declined
   with a one-line reason.
2. Every notification needing joined payload data has its payload view; every
   `for-notification` view names a real notification.
3. Public and consumer surfaces are covered before admin queues.
4. Every view has an isStored decision with a staleness statement and at
   least one consumer; no orphan views, no `lookups`.
5. Every aggregate and stat is a table row with exact keys and literals; user
   identity joins select only `fullname` / `avatar`.
6. The Summary table matches the view list one to one; unknowns are `OPEN`.

## Output

Write the document to `design/bff-spec.md` (writer contract section 4).
