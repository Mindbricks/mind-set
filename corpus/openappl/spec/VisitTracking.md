# VisitTracking

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [VisitTracking in Part 1](../ontology/VisitTracking.md)

**Activation:** the pattern is switched on by `enabled`.

Object-level visit storage (docs/ADR-object-visits-pattern.md section 2.1): WHERE the visits of this object go. The history table `sys_<Obj>Visit` is an analytics fact table (visit id, object id, tenant, actor key, user and session, signal, status, api name, controller, list attribution, the frozen `context` fields, server timestamps); the counter and the per-actor state are projections of it. The api-level `visitSettings` decides which call records a visit. Tenant and actor are stamped from the session, never accepted from the client. History and actor-state rows are personal data. No authorization or filtering decision may read a visit (ADR hard rule 1).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | yes |  |  |  | Turns visit tracking on for this object. False (the default) leaves the block inert: no visit table, no host column, no injected api, and the object is generated exactly as without the block. The other fields are only checked while this is true. |
| `history` | `Boolean` | no | `true` |  |  | Keep the raw event log `sys_<Obj>Visit`, one row per visit: the analytics and recommendation source, and the truth every counter can be rebuilt from. Default true. |
| `historyRetentionDays` | `Integer` | no |  |  |  | Raw history rows older than this many days are deleted by a generated retention cron, after rollup. Null (the default) keeps them. Emitted by slice V4; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `actorState` | `Boolean` | no | `false` |  |  | Keep one row per (actor, object) in `sys_<Obj>VisitState` (first / last seen, first / last read, visit count): read receipts, seen, unread counts, new since your last visit. Default false. Emitted by slice V3; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `counterProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | A host column of this object incremented once per COUNTED visit (see `visitSettings.countPolicy`). When the named property does not exist the framework adds it as a framework-managed Integer column. The column is QUIET: its increments emit no db event, trigger no Elasticsearch re-projection and invalidate no entity cache, so a hot page never amplifies writes (ADR section 6.2). Null (the default) keeps no counter. An engagement metric, never an authorization or billing input. |
| `uniqueCounterProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | A host column incremented once per DISTINCT actor; it reads `actorState`, so it requires it. Quiet like `counterProperty`. Emitted by slice V3; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `ownerReadMapping` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | Owner-row read flags for a SINGLE-recipient object (a mailbox message, a personal notification): the use case of the retired `setAsRead`, now a by-product of visits. Applied only when the visiting actor is the row's owner (the object must declare an `isOwnerField`), through the quiet update path after the response. Each value is MScript over `{ now, signal }`, e.g. `isRead: true`, `readAt: now`. Emitted by slice V3; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `anonymousVisits` | `Boolean` | no | `true` |  |  | Record visits that carry only an anonymous session key. The actor key is then the session id, read by the guest-cart rule (the session, else the `X-Session-Id` header the frontend mints and persists). Default true; false drops anonymous visits. Anonymous rows are not re-keyed when the visitor later logs in. |
| `publishVisitEvent` | `Boolean` | no | `false` |  |  | Publish `<obj>.visited` (the unified event envelope) after each counted visit. Default false. Emitted by slice V5; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `elasticLog` | `String` | no |  |  |  | Name of a declared ElasticLog every visit is also appended to: an optional downstream sink, the relational history stays the source of truth. Emitted by slice V5; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |
| `eventStream` | `String` | no |  |  |  | Name of a declared EventStream every visit is also appended to, through a server-side ingest that stamps actor and tenant from the session (ADR section 6.4). Emitted by slice V5; until then a declared value is reported as VISIT_TRACKING_NOT_YET_EMITTED (warning), so the knob never silently does nothing. |

## Constraints

Property rules:

- `enabled` must be present. Enforced only while `enabled` is on. (`REQUIRED_FIELD_MISSING`)
- `counterProperty`, `uniqueCounterProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `ownerReadMapping` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VISIT_COUNTER_PROPERTY_NOT_NUMERIC` | error | visitTracking.… "…" is a … property of "…"; the visit counter is incremented in the database (COALESCE(col, 0) + 1) and needs a numeric column. |
| `VISIT_OWNER_MAPPING_INVALID_PROPERTY` | error | visitTracking.ownerReadMapping target "…" must name a declared ordinary property of "…"; owner and framework columns are not read-state fields. |
| `VISIT_OWNER_MAPPING_WITHOUT_OWNER` | error | visitTracking.ownerReadMapping on "…" requires an owner field: mark the owner property with sessionSettings.isOwnerField: true. |
| `VISIT_SIGNAL_ON_AUTHZ_SURFACE` | error | A visit-derived value of "…" (…) is read by an authorization surface: …. |
| `VISIT_TRACKING_LANE_NOT_IMPLEMENTED` | warning | visitTracking on "…" is not generated for … yet: the visits family (history table, quiet counter, visit hook, confirm route) is implemented by … so far, so this … service records no visit. |
| `VISIT_TRACKING_NOT_YET_EMITTED` | warning | visitTracking.… is accepted but not generated yet: slice … of the visits family emits it, and until it lands the setting does nothing. |
| `VISIT_UNIQUE_COUNTER_REQUIRES_ACTOR_STATE` | error | visitTracking.uniqueCounterProperty requires actorState: true: the state row identifies the first counted visit of an actor for an object. |
