# VisitSettings

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [VisitSettings in Part 1](../ontology/VisitSettings.md)

**Activation:** the pattern is switched on by `enabled`.

Api-level visit trigger (docs/ADR-object-visits-pattern.md section 2.2). It declares which call of this BusinessApi records a visit of its data object, with which signal, how the visit is confirmed and which visits are counted. The api's object must declare an enabled `objectSettings.visitTracking` (the storage decision is made once per object). The recording runs after the response, skipped on errors, idempotent replays, completed misses, unlisted controllers and `excludeRoles`. The frontend contract (the `_visit` block and the confirm route) is documented in the generated frontend prompt docs.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | yes |  |  |  | Makes this api a visit source. False (the default) leaves the block inert. Requires an enabled `visitTracking` on the api's data object (VISIT_TRACKING_NOT_DECLARED). |
| `signal` | `VisitSignal` | no | `"access"` | `access`, `view`, `read`, `seen` |  | What a successful call records (VisitSignal): `access` (a served get, unconfirmed; the default), `view` and `read` (a get confirmed by the frontend), `seen` (each row of a list page, an impression). `access`, `view` and `read` record a visit of ONE object: they require a `get` api, or `targetIdFrom` naming the visited id on an api of another crudType (a frontend confirmation, which `view` and `read` call for, requires a `get`); `seen` requires a `list` api. `access` is emitted by slice V1, `view` and `read` by V2, `seen` by V3; until then `seen` is reported as VISIT_SETTINGS_NOT_YET_EMITTED (warning). |
| `confirmation` | `VisitConfirmation` | no | `"none"` | `none`, `frontend` |  | How the visit becomes countable (VisitConfirmation): `none` (the default) counts it when the response is sent; `frontend` (slice V2) returns `_visit { visitId, confirmPath, minVisibleSeconds, expiresAt }`, writes a pending row and counts it only when the frontend confirms after the visible dwell time. `frontend` requires `minVisibleSeconds` or `minScrollPercent`, and is refused with `signal: access` (an access is unconfirmed by definition). |
| `minVisibleSeconds` | `Integer` | no |  |  |  | Frontend confirmation: the visible dwell time, in seconds, the client measures (Page Visibility pauses the clock while the tab is hidden) before it confirms. The server verifies the ELAPSED time since it minted the visit; visibility itself is a client claim. |
| `minScrollPercent` | `Integer` | no |  |  |  | Frontend confirmation: an optional scroll-depth criterion, 0-100. A client claim, stored on the history row for analysis and never trusted for counting. |
| `confirmTtlSeconds` | `Integer` | no | `1800` |  |  | How long, in seconds, a pending visit can still be confirmed. Expiry is lazy: no sweep runs, and a row stays `pending` until a confirm arrives after the TTL, which answers 410 VISIT_EXPIRED and flips that row to `expired`. An expired or never-confirmed row stays in the history and is never counted; analysis should treat a `pending` row older than the TTL as expired. Default 1800. |
| `countPolicy` | `VisitCountPolicy` | no | `"everyVisit"` | `everyVisit`, `oncePerSession`, `oncePerActor`, `oncePerActorPerWindow` |  | Which recorded visits are COUNTED (VisitCountPolicy): `everyVisit` (the default), `oncePerSession`, `oncePerActor`, `oncePerActorPerWindow`. Every visit is still kept in the history. The policies other than `everyVisit` are emitted by slice V2 and judged against the history table: on a relational service the judgement is serialized per object (the host row is locked for the transaction); on MongoDB it is BEST EFFORT (no transaction), so two concurrent first visits of one actor (or session) may both count - the atomic per-key claim is planned in V4. |
| `countWindowSeconds` | `Integer` | no |  |  |  | The window, in seconds, of `countPolicy: oncePerActorPerWindow`. Required by that policy, ignored by the others. |
| `excludeRoles` | `String`[] | no |  |  |  | Roles whose calls never record a visit (admins, editors, support staff): their reads are not consumption. |
| `controllers` | `String`[] | no | `["rest"]` |  |  | The controller kinds whose calls record a visit. Default ["rest"]: MCP, gRPC, Kafka, cron and internal calls are not visits unless listed here (e.g. `mcp`). |
| `targetIdFrom` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript that yields the id of the visited object. On a `get` with `confirmation: none` it replaces the id of the row the get resolved (the default); on an api of any other crudType it is REQUIRED for the `access`, `view` and `read` signals, since such an api has no single resolved row to take the id from. Ignored on a frontend-confirmed get (warning VISIT_TARGET_ID_IGNORED): there the visited id is the row the get and its confirm route addressed. |
| `context` | [`VisitContextField`](./VisitContextField.md)[] | no |  |  |  | Analytic dimensions frozen on every history row at visit time. Each entry is `{ name, from }`, where `from` is an MScript over the api context (the request and the fetched object), e.g. `category` from `this.product.categoryId`, `campaign` from `this.request.query.utm_campaign`. Freezing matters: a row re-categorized next month must not rewrite last month's per-category interest. |

## Constraints

Property rules:

- `enabled` must be present. Enforced only while `enabled` is on. (`REQUIRED_FIELD_MISSING`)
- `signal`, `confirmation`, `countPolicy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `context` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VISIT_CONFIRMATION_CRITERION_MISSING` | error | visitSettings.confirmation "frontend" needs a criterion the client measures before it confirms: set minVisibleSeconds (visible dwell) or minScrollPercent (completion), or both. |
| `VISIT_CONFIRMATION_ON_ACCESS` | error | visitSettings.signal "access" is by definition an UNCONFIRMED serve; a frontend confirmation makes it a "view" (dwell) or a "read" (completion). |
| `VISIT_CONFIRMATION_REQUIRES_GET` | error | visitSettings.confirmation "frontend" needs a "get" api: the confirm route hangs off this api's own route and must address the same row. |
| `VISIT_CONFIRMATION_REQUIRES_HISTORY` | error | visitSettings.confirmation "frontend" needs the visit history of "…" (the pending row IS the claim the confirm moves), but its visitTracking.history is false. |
| `VISIT_COUNT_POLICY_REQUIRES_HISTORY` | error | visitSettings.countPolicy "…" is judged against the visit history of "…", but its visitTracking.history is false. |
| `VISIT_COUNT_WINDOW_MISSING` | error | visitSettings.countPolicy "oncePerActorPerWindow" needs countWindowSeconds (a positive number of seconds): one counted visit per actor per that window. |
| `VISIT_SETTINGS_NOT_YET_EMITTED` | warning | visitSettings … is accepted but not generated yet: slice … of the visits family emits it, and until it lands this api records no visit. |
| `VISIT_SIGNAL_CRUD_MISMATCH` | error | visitSettings.signal "seen" records the rows of a returned list page (an impression) and needs crudType "list"; this api is a "…". |
| `VISIT_SIGNAL_WITHOUT_CONFIRMATION` | warning | visitSettings.signal "…" means the object was on screen (view) or consumed (read), which only a frontend confirmation shows; without one this api records every serve under that name. |
| `VISIT_TARGET_ID_IGNORED` | warning | visitSettings.targetIdFrom is not used on a frontend-confirmed get: the visited id is the row this get (and its confirm route) addressed. |
| `VISIT_TRACKING_NOT_DECLARED` | error | visitSettings is enabled on an api of "…", but "…" declares no enabled objectSettings.visitTracking in this service. |
