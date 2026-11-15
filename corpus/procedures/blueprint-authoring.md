# Blueprint authoring — core procedure

Harness-agnostic. Every step names the blueprint path it reads or edits. First draft
extracted from the Ada corpus (#4389); provenance and translation notes in
`../README.md`.

**Task shape.** You are given ONE service to author into the project blueprint:
its spec (the design document `design/service-spec-<serviceName>.md`), the
project context, and the current blueprint state. You design and write the
service's subtree in `blueprint.json`, validate it clean, and prove completeness
against the spec. The blueprint file is the single source of truth and the
validator is the judging side; you are the authoring side. Never fabricate a
validation result: run the validator and use its real output.

---

## 1. Gather context (once per run)

- **Everything is local.** Reference content is the corpus (`openappl/`,
  `procedures/`, `guides/`, `openappl.json`); project state is
  `blueprint.json` and the design documents under `design/`.
- **Spec:** read `design/service-spec-<serviceName>.md`.
- **Current state:** list `services` in `blueprint.json` (the project fields
  `codename` and `projectSettings.basicSettings` hold the header facts), then
  read the subtree
  at `services/<serviceName>` — the service may be absent, a default skeleton,
  or half-built from an earlier session. Plan against what is actually there.
- **Ontology:** read the pattern page `openappl/spec/<Pattern>.md` and the
  pattern's entry in `openappl.json` for a class you are about to create or a
  populated path you are about to change. Read each class ONCE
  per run and reuse it. Root docs do NOT expand referenced types: batch the
  sub-patterns you will populate —
  - DataObject family: `ObjectSettings`, `ObjectBasicSettings`,
    `ObjectAuthorization`, `DataProperty`, `PropertyBasicSettings`,
    `PropertyIndexSettings`, plus the activation blocks used
    (`PropertyRelation`, `PropertyStaticJoin`, `PropertySessionSettings`),
    plus `CompositeIndex` / `MembershipSettings` when used.
  - BusinessApi family: `ApiOptions`, `ApiAuthOptions`, `ApiRestSettings`,
    `BusinessApiParameter`, `BusinessApiActionStore`, `BusinessWorkflow`, plus
    per-API-type sections (`WhereClauseSettings`, `SelectClauseSettings`,
    `ListOptions`, `PaginationOptions`, `GetOptions`, `DeleteOptions`), plus
    each action class used (`ValidationAction`, `FetchObjectAction`,
    `CreateCrudAction`, `UpdateCrudAction`, `DeleteCrudAction`,
    `FunctionCallAction`, `ApiCallAction`, `InterserviceCallAction`,
    `PublishEventAction`, `SendMailAction`, `LoopAction`, `ParallelAction`).
    Do NOT rely on `BusinessApiActionStore` for action field names.
  - Do NOT fetch `DataMapItem` — the shape is authoritative: an array of
    `{ name, value }` where `value` is an MScript expression.
- **MScript:** when the spec uses expressions, read the MScript guides
  (`guides/mscript/`: syntax, query reference, cookbook) once and reuse them.
- **Style anchors:** read the routes of one existing service in the blueprint
  to match established route casing/pluralization before inventing new routes.
- **Library work:** read the generated db helpers in the data-layer chapter
  (`openappl/compiler/04-data-layer.md`) before writing any
  library function (the generated helper names derive from data-object names);
  derive the topic names with `openappl/compiler/07-event-bus.md` when
  publishing events; coding references are in the corpus (`guides/`).
- **Anything unclear:** search the corpus (`openappl/`, `procedures/`,
  `guides/`, `openappl.json`) for a known term and read the hits in full.
  Never guess.

## 2. Resolve design decisions (checklist)

Answer ALL of these from the spec before writing anything:

- **Responsibility** — one sentence.
- **Roles** — which roles interact and what may each do. Roles must be REAL:
  the union of the project's custom roles (`authentication/accessControl/
  roleSettings`) and the built-ins (single-tenant: `superAdmin`, `admin`,
  `user`; multi-tenant: plus the tenant-level set). If the spec needs a role
  that does not exist, do NOT invent it on API auth lines — record the gap
  explicitly ("custom role X must be added to roleSettings before this
  service is applied; mapped to `user` as placeholder") and use the
  placeholder. Two misconceptions that keep recurring: an EMPTY
  `roleSettings.roleItems[]` does NOT mean the project has no roles — the
  built-ins are never listed there and are always available; and built-in
  roles are valid on EVERY service's `checkRoles`/`absoluteRoles`, not just
  the auth service (auth issues the tokens; every service validates them).
  The failure mode that makes invented roles dangerous: the validator
  accepts any string in a role array, but no user carries that role, so at
  runtime the gate matches zero users — a silent no-op, not an error. In
  multi-tenant projects `admin`/`user` are the WRONG vocabulary — use
  `saasAdmin`/`tenantAdmin` and `tenantUser`.
- **Data objects** — for each: globally-unique name (check against the whole
  project in `blueprint.json`), purpose, properties with
  types and modifiers, relations, indexes, tenant scope. Never use reserved
  names (`user`, `tenant`, `userGroup`, `userGroupMember`, `session`); never
  define `id`, `isActive`, `createdAt`, `updatedAt`, `recordVersion`
  (auto-added; snake_case variants rejected too); never author the tenant id
  property (injected). Response-like property names, including `status`,
  are legitimate domain properties; no validator warning is added merely
  for such a name. Only DataObject names `data`, `paging`, and `_type`
  (case-insensitive) collide with the current success-body envelope and
  are validation errors. Transport metadata names such as `status` and
  `statusCode` are valid DataObject names as well. The **`sys_` name prefix** is
  reserved for the objects the business-pattern injectors synthesize.
- **APIs** — for each: name, `crudType`, route, auth, where/data clauses,
  select joins, actions, whether an API event is raised. `crudType` is one of
  exactly five: `create` / `get` / `list` / `update` / `delete` — there is NO
  `custom`. Verb-on-resource APIs map to one of the five by what they do to
  the primary object (mutate one row -> `update`; insert a row -> `create`);
  the verb lives in the route. An API that both mutates its primary record
  AND creates a child record (`recordDownload` bumping a counter and
  inserting a metric row) is an `update` on the primary object — the child
  insert is a `createCrudAction` in its workflow, never a second crudType.
  An API whose job is to COMPUTE and return a record that is no row of any
  table (a permission decision `{allowed, reason}`, a price quote, a report
  line) is a `get` (one record) or `list` (rows) on a VIRTUAL data object:
  declare the response shape as an object with
  `objectSettings.basicSettings.virtual: true` and its properties, never a
  throwaway table and never a coincidentally compatible real object (#4727).
  A virtual object stores nothing (no table, model, db layer, index or
  seed); its api's main operation reads nothing and starts from `{}` (get,
  no id route parameter - so give it its own `routePath` whenever the object
  also has a default-routed list, or both take the bare resource path:
  `ROUTE_COLLISION` error) or `[]` (list), and the api's own actions build the
  answer: `addToResponseActions` / a functionCall on a get, a
  `listMapActions` entry with `replacesResult: true` in
  `afterMainListOperation` on a list. create/update/delete apis, relations,
  crud / fetch actions, views and seeds pointing at it, and storage features
  on it (checkout, ledger, membership, projections, geo) are validation
  ERRORS.
  An object you give a create AND an update AND a read to is one somebody
  ADMINISTERS, so decide its removal explicitly: author the `delete` (with
  `useSoftDelete`, the default, it archives rather than destroys) or author
  the archive as an update api that sets a retirement column. Leaving both
  out means rows the API can create and nothing it has can remove — every
  re-run grows the store permanently — and validation says so with
  `CRUD_DELETE_ROUTE_ABSENT` (#4855). Append-only by design is fine; silent
  is not.
- **Optional components** — library functions, realtime hubs, buckets
  (DbBucket small/transactional vs RemoteBucket large/CDN), event
  subscriptions, edge controllers — only those actually needed. New AI agents
  are designed under `agentHub/aiAgents`, never under `services/<svc>/aiAgents`.
- **AgentHarness (a long-running sandboxed agent, designed under
  `agentHub/harnesses[]`)** — only when the spec asks for an autonomous,
  skill-driven agent that keeps a working directory (not for chat or short
  tool-calling, which stay `aiAgents`). In this repo "harness" also means
  the Claude Code customer harness you run in; the AgentHarness is a RUNTIME
  pattern of the generated project. Needs a nodejs project. Set `runtime`
  (`dsh` default, `goose`, `codex`, `claude-code`, `opencode`), a `modelSettings.providerName`
  whose API shape the runtime speaks (a `custom` provider takes `apiFormat`
  `openai` or `anthropic`), skills and documents as paths under
  `harness/<name>/skills|docs|scripts/` that you first add as private
  agentHub service files (service `agentHub`; an
  entry naming no uploaded file is an error), and a tool list. A Kafka trigger runs
  as the M2M service identity: list only `m2mTools` (APIs that allow M2M)
  plus `webTools`, and give a multi-tenant project a `tenantId` MScript.
  Plugins must be pinned and are listed, not yet installed. Read
  `guides/composition/agent-harness.md` before authoring one.
- **Cross-service dependencies** — every other service referenced via
  relations, joins, or calls; record them, but they no longer gate WHEN a
  service builds — every domain service is authored and validated, then
  built together with the platform modules in one wave
  (`project-lifecycle.md` Phase 4.5), regardless of which services reference
  which.

**The spec is a SOURCE, not law.** You are doing the real design work; the
spec carries the intent. When the spec is wrong — an impossible shape, a
validation contradiction, a broken relation, a misused pattern — resolve it:
design what is right, and record the deviation (what the spec said, what you
did, why) in your completion report and the session handoff. Never implement
a known error to stay "faithful", and never stall waiting for a spec fix;
only a genuine re-scoping question goes back to the user.

**Named-item chapters are ARRAYS.** In `blueprint.json`, `services`,
`businessLogic`, `dataObjects`, `properties` and friends are arrays of named
items; an item's name is its `_name` when present, else the name in its basic
settings (`basicSettings.name`, `basics.apiOptions.name`,
`serviceSettings.serviceBasics.name`). Find and edit an item by that name,
never by its array index, and never rewrite a chapter as a keyed object. The
target-shape examples below show keyed objects only to keep them short.

## 3. Editing the blueprint and its semantics

**Import/bootstrap boundary.** Creation-stamped destination bootstrap values
are preserved by a narrow merge only when already present and not nulled.
A full auth/loginDefinition/userSettings/root replacement can remove them;
no server-side automatic preservation is promised. For a sanctioned import,
sanitize source credentials and use narrow merges, or an authorized private
destination-only preservation process with private
presence/agreement readback. Raw absence is unverified because defaults/env
can supply bootstrap. New private pair setup for a never-seeded destination
requires specific owner authorization; existing account recovery uses
supported administration, never reseeding. See `auth-blueprint.md` section 4.

The blueprint is the local file `blueprint.json`; you edit it directly.
Rules for every edit:

- **Edit at the JSON path, one concern at a time.** Read the subtree you
  are about to change, change only that subtree, and leave the rest of the
  file as it was. Never rewrite the whole file from memory.
- **Named items** (`services/x/businessLogic/createUser`,
  `services/x/dataObjects/Order`): when you write an item, write it
  complete. A partially written `properties` array or `actions` store LOSES
  the members you left out; a chapter you do not touch stays as it was.
- **Lists are complete sets.** A named-item chapter (`roleItems`,
  `businessLogic`, `properties`) and a plain-value array (`checkRoles`,
  `absoluteRoles`, tags) hold exactly what the file says. To ADD one member,
  keep every member already there; to REMOVE one, delete only that member.
  Read the array first, and read it back after the edit.
- **Seed rows** (`seedData`): a row's identity is `seedBasics.dataObject`
  plus the declared `seedBasics.matchBy` names and their seeded values. Two
  rows with the same identity are refused with `SEED_ROW_NOT_DISTINGUISHABLE`.
- **Deactivating** an activation block is an explicit `null`, never an
  omission (section 4, "Deactivating things").
- **Rename in place**; never simulate a rename with delete+recreate of a
  populated item, and update every reference to the old name in the same
  edit.
- **Validate after every non-trivial edit:** `mind-set validate
  blueprint.json` (structural), then the semantic validation of an OpenAPPL
  validation tool or compiler when one is available. An edit that leaves an
  error is not done: clear every error at the path it names before calling
  the service done, and act on every warning.
- **Version control is the concurrency guard.** Keep the working folder
  under version control and commit between assets. When another writer
  changed the file, re-read the subtree, re-apply your change on the fresh
  state, and validate again.

## 4. Write order (progression for a new service)

**The target shape.** This is the basic JSON structure of one service subtree:
what a fully-populated `services/<name>` subtree of `blueprint.json` holds and what
your writes incrementally build. You NEVER write this whole document in one
call (see the progression below); it is the mental map. MScript values inside
JSON are always descriptor objects (`{ "js": "..." }`), never bare strings.

```jsonc
{
  "serviceSettings": {
    "serviceBasics":  { "name": "order", "description": "..." },
    // ServiceOptions has NO `serviceRequiresLogin` — it was RETIRED (#1168)
    // and a stray key is stripped without an error. Per-API login is
    // `authOptions.loginRequired`; `serviceAllowsUserToLogin` is a different
    // flag (this service issues logins) and stays false.
    "serviceOptions": { "dbType": "postgresql",
                        "dataModelName": "order", "useSoftDelete": true }
  },
  "dataObjects": {                    // named-item chapter: one submodule per object
    "order": {
      "objectSettings": {
        "basicSettings": { "name": "order", "description": "...", "useSoftDelete": true },
        "authorization": { "dataObjectAccess": "accessProtected",
                           "objectDataIsInTenantLevel": false },
        "compositeIndexSettings": []  // omit when none
        // business-specific opt-in blocks activate patterns here:
        // "checkout": {...}, "subscription": {...}, "ledgerSettings": {...},
        // "membershipSettings": {...}, "invoicing": {...}, "fiscalization": {...},
        // "redisEntityCacheSettings": {...}, "graphProjection": {...}
      },
      "properties": [                 // ARRAY of property chapters; name inside basicSettings
        { "basicSettings": { "name": "title", "type": "String",
                             "isRequired": true, "allowUpdate": true },
          "indexSettings": { "indexedInDb": true, "unique": false } },
        { "basicSettings": { "name": "status", "type": "Enum", "isRequired": true,
                             "enumOptions": ["draft", "submitted"], "isFilterParameter": true } },
        { "basicSettings": { "name": "ownerId", "type": "ID",
                             "isRequired": true, "allowUpdate": false },
          "sessionSettings": { "sessionParam": "userId", "isOwnerField": true } },
        { "basicSettings": { "name": "categoryId", "type": "ID", "isRequired": true },
          // onDeleteAction is REQUIRED — there is no schema default (§7)
          "relationSettings": { "relationName": "orderCategory",
                                "relationTargetObject": "category",
                                "relationTargetKey": "id",
                                "onDeleteAction": "doNothing" } }
      ]
    }
  },
  "businessLogic": {                  // named-item chapter: one BusinessApi per entry.
    // VERIFIED SHAPE (pilot 2026-09-16): a BusinessApi is NESTED into chapters —
    // basics / parameters / controllers / query / actions / workflow. The FLAT
    // form (apiOptions at the API root) is REJECTED with UNKNOWN_PROPERTY; the
    // validator's `allowed` list and reference/ontology/BusinessApi.md are the
    // authority when in doubt.
    "createOrder": {
      "basics": {
        "apiOptions":  { "name": "createOrder", "dataObjectName": "order",
                         "crudType": "create", "apiDescription": "..." },
        "authOptions": { "loginRequired": true }
      },
      "parameters": {
        // `httpLocation` is REQUIRED on every parameter (no schema default,
        // so an omitted one is REQUIRED_FIELD_MISSING). `dataPath` is where
        // the value sits INSIDE that source; it is OPTIONAL and falls back
        // to the parameter's own name. Write it anyway on every parameter:
        // the explicit path is what survives a later rename, and it is the
        // only way to say "this parameter reads a DIFFERENT key".
        "requestParameters": [
          { "name": "title", "type": "String", "required": true,
            "httpLocation": "body", "dataPath": "title" }
        ]
      },
      "controllers": {
        // routePath is FLAT on restSettings — the old `configuration` wrapper is
        // legacy (auto-lifted with a notice, #134): never author it.
        "restSettings": { "hasRestController": true, "routePath": "/orders" }
      },
      "query": {
        "dataClauseItems": [
          { "name": "title",  "value": { "js": "this.title" } },
          { "name": "status", "value": { "js": "this.status || 'draft'" } }
        ]
      }
    },
    "getOrder": {
      "basics": {
        "apiOptions":  { "name": "getOrder", "dataObjectName": "order", "crudType": "get" },
        "authOptions": { "loginRequired": true, "ownershipCheck": true }
      },
      "controllers": {
        "restSettings": { "hasRestController": true, "routePath": "/orders/:orderId" }
      }
      // query{whereClause,selectClause,listOptions,paginationOptions,getOptions,
      // deleteOptions}, actions and workflow join the same nesting as needed.
      // A SortByItem inside listOptions is { "name": <required label>,
      // "property": <field>, "order": "asc"|"desc" }.
    }
  }
  // optional chapters as the design needs them: "library", "edgeControllers",
  // "realtimeHubs", "eventSubscriptions", "dbBuckets", "remoteBuckets",
  // "computeJobs", "waitingRooms", "shoppingCartConfig", "oauthFlows",
  // "graphLayer", "seedData"
}
```

One bundled write per asset — never the whole service in one payload (one
validation error rejects the whole call and errors stop naming the field), and
never per-property writes for a new object (5-10x the calls for nothing).

The prose-documentation fields ride the same bundled writes: `frontendDocument`
(and, on APIs, `testingNotes`) live ONE LEVEL DEEPER than the asset root —
`serviceSettings/serviceBasics`, `objectSettings/basicSettings`, and
`apiOptions` respectively; the truncated paths (`.../dataObjects/<obj>/
frontendDocument`) are rejected as unknown properties. Fill them inline in
each asset's write — a second per-asset pass just for these fields is the
per-property antipattern in different clothes.

1. **Service root** — minimal settings only, no dataObjects/businessLogic yet:
   write `services/<name>` as `{ serviceSettings: { serviceBasics:
   {...}, serviceOptions: { dbType, dataModelName, useSoftDelete } } }`.
2. **Each DataObject — ONE bundled write at the object root**, `objectSettings`
   plus the FULL `properties` array in the same payload:
   - `properties` is a JSON ARRAY of property objects (name inside
     `basicSettings.name`) — the keyed-object form is rejected with "Value
     must be an array"; fix the shape, do NOT fall back to per-property
     writes.
   - Activation is by BLOCK PRESENCE — populate at most one of
     `relationSettings` (foreign-key reference; the property still appears in
     API arrays as normal input), `sessionSettings` (`sessionParam`,
     `isOwnerField?` — auto-injected from session; OMIT from every API's
     arrays), `staticJoin` (auto-resolved from a related row; OMIT from API
     arrays).
   - Enum properties MUST set `basicSettings.enumOptions` (>= 2 values, valid
     code identifiers) directly on basicSettings — there is no `enumSettings`
     block.
   - `basicSettings.isFilterParameter: true` auto-exposes the property as a
     query filter on every `list` API — mark it deliberately, never on
     sensitive/system fields.
3. **Each BusinessApi — ONE bundled write at the API root**
   (`services/<name>/businessLogic/<ApiName>`): `apiOptions` plus ONLY the
   sections the API needs. Omit unused sections — no empty placeholders.
   There is no `autoParams`, no `customParameters`, no `dataClause: {...}`
   object on the API root: inputs are `requestParameters[]`, written columns
   are `dataClauseItems[]` (see §5).
4. **Library functions, realtime hubs, edge controllers, event subscriptions**
   — one bundled write per item at its own named-item path.

Per-section writes (`.../businessLogic/<ApiName>/authOptions`) are reserved for
the fix loop (a validation error naming a single sub-path) and change requests
— never the primary build pattern.

**Creation-stamped destination bootstrap:** preserve
`authentication/loginDefinition/userSettings.superAdminIdentifier` and
`.superAdminPassword` through narrow merges. Omission is safe only when the
destination fields exist and are not nulled; full replacement may discard
them. Dropping `.superAdminPassword` or retaining a redaction placeholder
produces `SUPERADMIN_PASSWORD_MISSING`: root, `loginDefinition` and
`userSettings` replacements are refused; an `authentication` replacement
may persist with the error, and strict auth build refuses that blueprint.
Never echo invented or source-project values. Sanctioned imports and
owner-authorized new-destination setup follow `auth-blueprint.md` section 4;
insert-only seeding does not rotate an existing account.

**Deactivating things.** Omission never deactivates. To turn an activation
block off, set that block to an explicit `null` (switching
forms: null the old block and populate the new one in the same edit). Clear
enums with `basicSettings.enumOptions: null`.

**Exact section names.** Names must match the ontology exactly — invented
names (`staticJoinSettings`, `sessionConfig`, `enumSettings`) are silently
ignored and only surface at validation. When unsure, the referenced-type
ontology is cheaper than a retry.

## 5. Explicit-mode API shape

Every create/update API declares two arrays:

- **`requestParameters[]`** — every caller-supplied input (body, path, query,
  header). Properties auto-injected via `sessionSettings`/`staticJoin` are
  OMITTED. `:paramname` segments in `routePath` auto-bind to `this.paramname`
  (`httpLocation: 'urlpath'`) — redeclare only to override type/transform/
  description. `dataExample` is REQUIRED on every Object-typed parameter
  (consumers, test fillers and forms guess otherwise) and date examples must
  anchor to the current date, not a hardcoded year.
- **`dataClauseItems[]`** — every column the API writes, as `{ name, value }`
  with an MScript `value`: `this.x` lifts the request field, a literal like
  `'draft'` forces a system value (and then do NOT expose a matching request
  parameter), `this.x || 'draft'` defaults on omit. Session/static-join
  properties NEVER appear here — the property-level activation writes them.
  On `create`, every NOT-NULL column must be covered here or by an
  activation block — there is no third path that builds. On `update`,
  partial writes are the correct shape: list ONLY the columns this API
  changes (unlisted columns keep their values, and a value that resolves to
  `undefined` at runtime is skipped at the DB layer, so `this.title` on an
  optional input correctly no-ops when omitted). Do NOT pad the array with
  re-passes of columns the API does not change.

Read APIs never carry `dataClauseItems[]`; they may carry
`requestParameters[]` for filters and extra inputs. On `list` APIs every
`isFilterParameter: true` property is wired automatically — do not redeclare
those; a hard-coded base `whereClause` and the auto-filters and-merge.

**`listOptions` carries a REQUIRED `queryCache` field whenever present** —
omit the whole section or fill the field (verified live). A `SortByItem` is
`{ name, property, order }` (the `name` label is mandatory).

**Routes are explicit.** Always set `restSettings.routePath` — FLAT on
restSettings (the `configuration` wrapper is legacy and auto-lifted with a
notice, #134; the field is `routePath`, not `path`/`url`); the HTTP method derives from
`crudType` (create POST, list/get GET, update PATCH, delete DELETE;
`forcePOSTMethod: true` to force POST). Conventions: `POST /orders`,
`GET /orders`, `GET|PATCH|DELETE /orders/:orderId`, verb style
`POST /orders/:orderId/cancel`, singleton `GET /commissionconfigs/active`,
webhook `POST /webhooks/stripe` (with `loginRequired: false`). A leading
`/v1` is auto-extracted into `apiVersion` — never double-prefix.

**Single-record selector resolution** (get/update/delete), in priority order:
`whereClause.fullWhereClause` -> `whereClause.selectBy` -> non-id `:param` in
the route (auto-selectBy) -> the `:objectId`/`:id` segment -> ELSE the
LATEST-RECORD FALLBACK (most recent row matching scope; the build warns
`LATEST_RECORD_FALLBACK`). The fallback returns 200 with the wrong record —
the most confusing failure class there is. For any non-trivial selection write
`fullWhereClause` explicitly; for intentional "current/latest" semantics set
`fullWhereClause: "{}"` explicitly to opt in and silence the warning.

**`fullWhereClause` field names are NOT validated against the object's
columns.** The validator accepts `{ userId: this.session.userId }` on an
object whose column is `ownerId`, and the API then dies at runtime with a
SQL `column does not exist` 500. Before writing any where clause, confirm
the property names against the object in `blueprint.json` and the resolved
property set below, especially on PATTERN-GENERATED objects, whose column
vocabulary you did not author: the shopping-cart pattern's Cart object
keys its owner as **`ownerId`** (null for guest carts), not `userId`
(pilot: every cart API 500'd until the filter was corrected).

**The campaign store of a multi-tenant cart is service-wide and
platform-operator-only; every write surface on it must be restricted to the
platform operator.** The `{cart}Campaign` object (dynamic promotions) has no
tenant column and the promotion engine applies every enabled row to EVERY
tenant's cart, so a tenant role that writes it sets promotions for all
tenants. The generated `/campaigns` routes already refuse tenant roles; a
write surface YOU author must too: a create / update / delete BusinessApi on
the object, a crud action whose `childObject` is the object, or an agent
`crudScopes` entry naming it (a hub agent assigned to the cart service
included). An `API.<x>` internal call runs as the system with no role gate,
so an api that writes the store must not set `hasInternalCallController`, and
only a platform-operator api may call `API.<x>` on one. Give each one `checkRoles` of `superAdmin` /
`saasAdmin` only (and `absoluteRoles`, if any, from the same roles; a multi-tenant project has no role
named `admin`, #5701),
keep `loginRequired: true` and set `M2MAllowed: false`; otherwise validation
refuses it with `CART_CAMPAIGN_WRITE_NOT_PLATFORM_OPERATOR`. READS are held
to the same rule, because the rows carry every tenant's coupon codes: a get /
list BusinessApi on the object, a fetch / stats / search / elastic / parent
action reading it in any api (a `svc:obj` reference from another service
included), a crudScopes `get_` / `list_` tool bound to such an api, a
`graphQueryAction` whose Cypher (inline, or the `graphLayer.queries[]` entry it
names) reads the store's graph projection (only when you author the store
object with a `graphProjection`), a get / list api whose `dataViewName` names a
DataView sourcing the store (as `mainObject`, an aggregate or a stat
`childObject`, directly or through an upstream view), and the
same internal-call door, are refused with
`CART_CAMPAIGN_READ_NOT_PLATFORM_OPERATOR` unless platform-operator-only. So is
an event notification whose `eventDataSettings.dataViewName` names such a view,
unless every target is a `role` target of `superAdmin` / `saasAdmin` (the view
document rides the notification metadata to every recipient). If
you author the store object yourself, do not give it a `graphProjection`
(`CART_CAMPAIGN_STORE_GRAPH_PROJECTED`: any Cypher on the provider would read
the codes) or `objectDataIsInTenantLevel: true`
(`CART_CAMPAIGN_STORE_TENANT_LEVEL`: the promotion loader ignores it). In a
SINGLE-tenant project an agent `crudScopes` entry on the store must be gated
to the campaign operator (#5834): every `create_` / `update_` / `delete_`
tool bound to an api whose `checkRoles` are operator roles only (`superAdmin`
/ `admin` / `saasAdmin` / `tenantOwner` / `tenantAdmin`, `loginRequired: true`,
`M2MAllowed: false`), and a `get_` / `list_` tool bound to an api only if that
api is restricted the same way; otherwise
`CART_CAMPAIGN_AGENT_TOOL_NOT_CAMPAIGN_OPERATOR`. Every other surface above
is held to the same campaign-operator gate in a SINGLE-tenant project too
(#5885): an authored write api, crud action or internal-call door on the store
is refused with `CART_CAMPAIGN_WRITE_NOT_CAMPAIGN_OPERATOR`, a read surface
(get / list api, read or graph action, DataView-serving api, internal call, an
event notification whose audience is not operator role targets only) with
`CART_CAMPAIGN_READ_NOT_CAMPAIGN_OPERATOR`, and a `graphProjection` on an
authored store with `CART_CAMPAIGN_STORE_GRAPH_PROJECTED`. The
write, read, graph-projection and single-tenant agent-tool and surface codes are
refused at build SUBMISSION even under `skipValidation: true` (which only lifts
the submission gate for ordinary findings; the build worker still fails the
job on any validation ERROR).
Custom code that
calls the campaign dbLayer functions directly (a library function, an edge
controller, an agent `customTools` / `libraryTools` handler) is outside every
framework gate and must check the platform operator itself before the write
(for example `isPlatformOperator(req)` from `common`); so is custom code calling
`LIB.dataViews.<view>` on a view that sources the store, which validation warns
on (`CART_CAMPAIGN_LIB_DATAVIEW_READ`).

**The resolved property set.** An object's columns in the BUILT model are
what you authored, plus what
the system service injects, plus the framework system columns
(`id`, `isActive`, `createdAt`, `updatedAt`, the tenant FK). That holds for
the platform objects too, not just your own: `auth` (`user`, `userSession`,
`givenPermission`, the tenant object, the avatar buckets), `notification`,
`bff` and `agentHub`. So `auth:user` lists `fullname` (or `name`+`surname`,
per `userNameType`), `avatar`, and `mobile` when a mobile identifier is
configured; join against them with confidence. The system-service chapters
(`openappl/compiler/09-system-services.md` and its sub-chapters) and the
derived surface (`openappl/compiler/12-derived-surface.md`) say what is
injected.

**`fullWhereClause` REPLACES, `additionalClauses` COMPOSE.** A
`fullWhereClause` on a get/update/delete API overrides ALL default selector
logic — the framework does NOT auto-add a filter for the route's `:id`
segment on top of yours; the auto-id binding fires only when the whereClause
section is empty. The classic bug:

```js
// ❌ WRONG on GET /conversations/:conversationId — the URL param is IGNORED.
// The query becomes "any conversation owned by this user" and (with the
// latest-record ordering) silently returns the most recent one. Build
// passes, health passes; only a test comparing the returned id catches it.
fullWhereClause: { "js": "{ $or: [{ buyerId: this.session.userId }, { sellerId: this.session.userId }] }" }

// ✅ RIGHT — include the id yourself...
fullWhereClause: { "js": "{ id: this.conversationId, $or: [ ... ] }" }
// ✅ ...or keep the id selection default and layer the access rule as an
// additionalClause — additionalClauses are ALWAYS AND-appended onto
// whatever selectBy / fullWhereClause / the id-binding produced.
```

`ownershipCheck: true` covers the single-owner-field case (id binding AND
owner check are added automatically) but not `$or`-style multi-owner rules —
those need one of the two shapes above.

## 6. Value sources — one source per value

Every stored value has exactly one source; pick it at the PROPERTY level, not
per API:

- **Caller input** — a plain property, listed in `requestParameters[]` and
  `dataClauseItems[]`.
- **Session** — `sessionSettings: { sessionParam, isOwnerField? }`; pair with
  `loginRequired: true`. Never also list it in API arrays, and never write the
  per-API `{ name: 'ownerId', value: 'this.session.userId' }` idiom — the
  property-level activation already writes it; the per-API copy is dead code
  at best.
- **Related row** — `staticJoin` block; same omission rule.
- **Per-API forced/derived value** — an entry in that API's
  `dataClauseItems[]` (`'pending'`, `LIB.now()`, computed MScript). A forced
  literal must NOT have a matching request parameter — do not expose a field
  the server overrides. For caller-input-with-default use
  `this.x || '<default>'` so caller input wins when present.

**Two different `isRequired` gates.** The property's
`basicSettings.isRequired` is the DB NOT-NULL contract; a request
parameter's `isRequired` is the API-contract gate. They are independent:
a DB-required column whose parameter is optional MUST still get its value
from somewhere (a dataClause default, session, join) or the write fails at
the database. And the body validator runs BEFORE the dataClause is built —
so a required request parameter rejects the call with
`errMsg_<field>isRequired` before any `dataClauseItems` literal could fill
it. When a server-supplied value keeps 400-ing: REMOVE the request
parameter (the field leaves the API contract and the dataClause entry
becomes the source) — do not flip the property's `isRequired` off.

**Actor vs target FKs — the naming heuristic.** A NOT-NULL `ID` FK to
`auth:user` whose name is actor-shaped (`ownerId`, `createdByUserId`,
`senderUserId`, `reviewerUserId`, any `*ByUserId`) is almost always
session-injected — give it `sessionSettings: { sessionParam: "userId" }`
even when the spec is silent; omitting the block AND the dataClause entry
is the single most expensive recurring apply failure (nothing populates the
NOT-NULL column and the build/runtime rejects). A target-shaped FK
(`recipientUserId`, `assigneeUserId`, `targetUserId`) is the opposite:
caller-supplied, so a normal `requestParameters[]` + `dataClauseItems[]`
pair and NO session block.

Anti-patterns that always bite: flipping `isRequired: false` to silence a 400
(the validator was right — configure where the value comes from instead);
exposing a request parameter whose value a literal then silently overrides;
repeating a session-derived dataClause entry on every API instead of one
property-level activation; mixing two activation blocks on one property.

> Provenance note: the older Ada doc `property-sources.md` describes a
> `basicSettings.source` enum (`request`/`session`/`customData`/`joined`); the
> current explicit-mode vocabulary is block-presence as written here. When in
> doubt verify against `openappl/spec/PropertyBasicSettings.md`.

## 7. Validation gotchas (cheap to read, expensive to relearn)

Enum values and shapes that cost a full round-trip when wrong:

- `relationSettings.onDeleteAction` (FLAT on `PropertyRelation` — there is no
  `configuration` wrapper) has FOUR values, and it is REQUIRED: there is no
  schema default, so an omitted one is `REQUIRED_FIELD_MISSING`. This is a
  DESIGN decision no validator can make for you — the wrong one is silently
  wrong. What happens to THIS row when the referenced parent row is deleted:
  - `doDelete` — this row is PART OF the parent and is meaningless without it
    (an order item of an order, a ticket of an event).
  - `setNull` — the pointer may go empty and the row stays meaningful. Set
    `basicSettings.isRequired: false` FIRST: on a NOT-NULL column (the DEFAULT
    when `isRequired` is omitted) it is unimplementable and REJECTED with
    `RELATION_SETNULL_ON_REQUIRED_FK`.
  - `restrict` — this row must keep naming the parent, and the parent must not
    be deletable while it does.
  - `doNothing` — this row keeps naming the parent, the parent may still be
    deleted, and this row survives unchanged. Rows are soft-deleted, so the
    kept reference still resolves, to an archived parent. **This is the right
    answer for every history-preserving reference** — a sold ticket naming its
    buyer, an audit row naming its actor, a commercial line naming a product
    that lives in ANOTHER service — and it is the one lanes miss.
  The lawful answers on a REQUIRED FK are `doDelete`, `restrict`, `doNothing`.
- `CompositeIndex.onDuplicate`: `throwError` | `doInsert` | `stopOperation` |
  `doUpdate`.
- `UpdateCrudAction.dataClause` items are `{ dataProperty, dataValue }` — a
  DIFFERENT shape from the `{ name, value }` DataMapItem arrays; mixed up, the
  validator accepts it and the generated code writes nothing.
- `ValidationAction.errorStatus` and every ErrorStatus field: a STRING
  (`"403"`), not a number — and the vocabulary is CLOSED, exactly nine:
  `"400"` | `"401"` | `"403"` | `"404"` | `"409"` | `"422"` | `"429"` |
  `"500"` | `"503"`. `"429"` is a rate-limit or quota refusal that clears
  with time (answered as `TOO_MANY_REQUESTS`); `"503"` is a dependency that
  is down right now (answered as `SERVICE_UNAVAILABLE`, the authored message
  kept). Callers RETRY both, so never use either for a permanent refusal.
  There is no `402`: map a payment-required case to `"402"`'s nearest lawful
  neighbour (`"422"`).
- `ApiAuthOptions.loginRequired` is required on every API.
- `SelectClauseSettings.selectJoins` items are SelectJoin OBJECTS
  (`joinName`, `joinedDataObject`, `properties`, `selector?`), not strings;
  `selector` is `mainKey->joinedKey` (`buyerId->id`) — be explicit when
  multiple relations exist.
- `AiProvider.credentialScopes` (tenant / user keys, "BYOK"): `tenant` and
  `user` are `off` | `optional` | `required`, `costPolicy` is `ownerPays`
  (default) | `saasPays`. `tenant` other than `off` in a single-tenant project
  is an error; any scope on `google`, `azure-openai`, `bedrock`, `ollama` or
  `mock` is an error; `fal` and `custom` warn (no live check, keys stored
  `unverified`). A `required` scope makes the entry's own `apiKey` optional,
  `optional` does not. Leave the block out (or all `off`) unless the spec asks
  for end users or tenants to bring their own AI key; the frontend then needs
  a key screen on `/my-provider-credentials` and must handle the 428
  `AI_PROVIDER_CREDENTIAL_REQUIRED` code. A Kafka- or cron-triggered caller
  has no user level: never bind one to a key-less `user: required` entry.
  The `resource` block (`mode`, `dataObject`, `idFrom`, `managers`, `users`,
  `budget.dailyCostCeilingUsd`) gives a workspace record its own key: the
  object needs a complete `membershipSettings` (and in a multi-tenant project
  must be tenant-level), `idFrom` is a plain `params.` / `session.` path, and
  cron or system callers skip the level. A workspace is never a tenant.
  nodejs services only. The runtime side is in `pitfalls.md` section 7.
- When in doubt about an enum, fetch the referenced-type ontology — cheaper
  than a retry.

**Session guards on anonymous-capable APIs.** Any MScript reading
`this.session.<field>` on an API that can run anonymously must short-circuit
on `this.session` FIRST. Optional chaining is NOT enough for negative checks:
`this.session?.role !== 'admin'` is TRUE for no-session-at-all — inverted
logic. Right: `this.session && this.session.role !== 'admin'`. Equality
checks (`this.session?.role === 'admin'`) are safe with optional chaining
alone. Same rule for `this.params`/`this.headers`.

**Milestone ordering** (verified against the live workflow ontology): the
single-record chain fires `afterStartBusinessApi -> afterCheckParameters ->
afterCheckBasicAuth -> afterBuildWhereClause -> afterFetchInstance ->
afterCheckInstance -> afterBuildDataClause -> afterMain<Crud>Operation ->
afterBuildOutput -> afterSendResponse -> afterApiEvent` — `afterFetchInstance`
(record loaded into `this.<dataName>`) comes BEFORE `afterCheckInstance`
(existence/ownership checks on it). Milestones are PER-CRUDTYPE: `create`
has no fetch/check-instance stages, `get` has `afterCheckInstance` but no
`afterFetchInstance`, `get`/`list` have no dataClause stage — an action
wired onto a milestone the crudType does not have simply never runs,
silently; check the `<Crud>BusinessWorkflow` ontology when unsure.
Pick the EARLIEST milestone that has the context the action needs: a
validation reading only input (`this.body/params/session`) belongs at
`afterCheckParameters`; one reading the loaded record
(`this.<dataName>.*`) MUST be at `afterFetchInstance` or later — earlier,
the record is undefined and the API 500s. Cross-field input validation at
`afterMain<Crud>Operation` is the classic misplacement — by then the row is
committed and there is no rollback (the workflow is NOT a transaction; see
the BusinessWorkflow ontology's failure semantics). `afterSendResponse` and
`afterApiEvent` are SUCCESS-ONLY — never place failure cleanup there.

**Action vocabulary.** Action types are the canonical store names —
`validationActions`, `fetchObjectActions`, `createCrudActions`,
`updateCrudActions`, `deleteCrudActions`, `functionCallActions`,
`apiCallActions`, `interserviceCallActions`, `publishEventActions`,
`sendMailActions`, `addToContextActions`, `loopActions`, `parallelActions`.
There is no `PostAction`/`PreAction`/`CustomAction`. Three choices that get
made wrong: (a) a call between the project's own services is an
`interserviceCallAction` (auto-discovered, M2M-signed); `apiCallAction` is
for EXTERNAL third-party HTTP only. (b) `InterserviceCallAction.
forwardCallerToken: true` runs the downstream API under the inbound
caller's identity (session/role/ownership checks apply — a checkout calling
`createOrder` should run as the buyer); the default `false` runs it as a
service-to-service call (right for cron/audit chains) — and `true` is only
meaningful when the parent API has `loginRequired: true`. (c)
`AddToContextAction` takes a `context` array of `{ contextName,
contextValue }` entries, each binding `this.<contextName>` — there is no
`value`/`contextPropertyName` field on it.

**Every `ValidationAction` REQUIRES a `description`** (verified live — its
absence is a validation error the guide previously did not mention).

**Fully-parametric update APIs (params carried for a LIB action, no
dataClause) hit a validator catch-22**: empty `dataClauseItems` is refused
(`UPDATE_WRITES_NOTHING`) while adding entries is refused when the columns
are `allowUpdate: false`. The escape is `contractOnly: true` on those
parameters — the wire contract and `this.<param>` reads are unchanged, the
parameter just stops implying a column write. The BusinessApiParameter doc
blesses exactly this: `contractOnly` is the sanctioned idiom for parameters an
action (LIB) consumes while the API writes no column from them. Do not set it
on a parameter that should be stored or select the row.

**`FetchStatsAction` result shape is undocumented** (plain number vs
`{ count: n }` varies by stat type) — normalize through an
`AddToContextAction` before any arithmetic or comparison reads it.

**Topic slots: one produce rule, one consume rule** (fw #4606). Four slots
name a Kafka topic and they do NOT all take the same string. The rule that
matters is which SIDE the slot is on:

| slot | side | what to write |
|---|---|---|
| `PublishEventAction.topic` | produce | the topic BARE. The publish door prefixes the project codename, so authoring the fully-prefixed name double-prefixes it. |
| `controllers.kafkaSettings.requestTopicName` | consume (request channel) | the topic your caller publishes to. Its producer is the caller — the mcpbff, an external system, a peer project — so the project is never asked to produce it, and leaving it unset derives `<serviceCodename>-<resource>-<action>-request`. `requestTopicNames` (#4726) lists ADDITIONAL topics for the same api, written the same way: one api, one handler, every topic subscribed - do not author one near-identical api per topic. |
| `eventNotifications[].eventDataSettings.channel` | consume | the WIRE topic of the event you are subscribing to. |
| a `KafkaController` / edge kafka trigger bound to an existing event | consume | same as `channel`. |

On the CONSUME side the project codename is the only optional part: the
subscribe door prefixes `<projectCodename>-` when the rest of the string
names a topic the project actually produces, so
`billing-service-subscription-created` and
`<codename>-billing-service-subscription-created` both resolve. Nothing after
the codename is optional, and that is where the mistake lives: a framework
event's wire name is `<projectCodename>-<serviceName>-service-<event>`, so
writing just `<event>` binds a topic nobody publishes. Derive the wire name
from the producing service in the blueprint with the event-bus rules
(`openappl/compiler/07-event-bus.md`) rather than composing it by feel: route
events exist only for the apis that set `raiseApiEvent`, and explicit
`PublishEventAction`s publish their own topics.

A consumed topic no service of the project produces is reported at design
time (`KAFKA_TOPIC_UNKNOWN_PRODUCER` / `KAFKA_TOPIC_NO_PRODUCER`), EXCEPT on
the request-channel slot above, whose producer is outside the project by
design.

**Whose state does the validation guard?** Classify every ValidationAction:
- caller's ROLE only -> no script at all; declarative
  `authOptions.absoluteRoles` / `checkRoles`;
- the CURRENT row's column -> script reads `this.<dataName>.<field>` at
  `afterFetchInstance`, no fetch needed;
- the PARENT's state or the caller's rights ON the parent -> a
  `FetchObjectAction` at `afterFetchInstance` loading the parent into
  `this.<contextPropertyName>`, SEQUENCED BEFORE the validation that reads it.
  The classic bug is passing the child to a helper that expects the parent —
  case (c) accidentally written as case (b). When a `LIB.<helper>` is
  involved, check its signature under `library/functions/<name>` first.

**Internal-call-only APIs cannot use `onNotFound: complete`**
(`API_ONNOTFOUND_TRANSPORT_UNSUPPORTED`) — use `throw404` and let the
caller's failure log carry the miss.

## 8. Library functions (when the spec needs one)

**The shape first — `LibModule` has exactly THREE fields.** One bundled write
per function at `services/<name>/library/functions/<moduleName>`:

```json
{ "moduleName": "listCartLines",
  "moduleBody": { "js": "module.exports = async function listCartLines(userId) { … };" } }
```

`moduleName` and `moduleBody` are BOTH required; the third, `publishes`, is
an optional list of the Kafka topics the body publishes with
`ServicePublisher` (it defaults to `[]`). Declare every such topic there,
named as it goes on the wire (`<codename>-<service>-service-<event>` in a
service's framework namespace) — the producer census cannot see inside the
body, so an undeclared topic makes its listeners producerless
(`KAFKA_TOPIC_NO_PRODUCER` at design time). Only `functions` and
`edgeFunctions` publish; code that is not a library module declares on
`serviceSettings.serviceOptions.publishes`. Those three are ALL there is:
there is no `description`, no `name`, no `body`, no `moduleExtension`, no
`parameters`/`returns` — a payload carrying them answers one
`UNKNOWN_PROPERTY` per key (a pilot dry-run collected 16 errors from one
invented shape). `moduleBody` is the multi-language envelope keyed by
language/format (`js` / `ts` / `python` / `csharp` / `go` / `rust` / `java` /
`php` for code, `html` / `txt` / `svg` / `ejs` / `json` for assets); nodejs
prefers `ts` then `js`, and a code function with no body for the target
language emits a failing `TODO(lib)` stub plus a warning rather than failing
the build. The same shape serves `library/edgeFunctions`, `library/templates`,
`library/assets` and `library/public`. Document the function in its own body
comment — there is nowhere else to put it.

The body is real source in the service's target language, not translated
MScript. Keep an existing module's JS/TS source while adding its native
`moduleBody.csharp` for .NET. A missing native body is a warning plus a
runtime-failing stub, never a library bridge. Use the current invocation and
DbLayer contracts in the data-layer chapter (`openappl/compiler/04-data-layer.md`),
including typed C# Invoke
metadata where appropriate. Generation/compiler/publication success is not
behavioral parity; inspect missing-body warnings and exercise real callers.

For **Node** bodies, import
priority: **`dbLayer`** (generated per-object CRUD/query/stats helpers — the
answer 95% of the time; keeps PG + ES + Kafka consistent) > **`serviceCommon`**
(`ServicePublisher`, `ServiceIndexer`, `fetchRemoteObjectByMQuery` /
`fetchRemoteListByMQuery` for cross-service reads — never touch another
service's tables; the fetchers return `null`/`[]` on a miss and never throw,
so a silent empty result means the query missed, not that the call worked) >
**`common`** (crypto/JWT/redis/kafka/http utilities) >
**`models`** (raw ORM — bypasses validations, ES sync, events; emergency only).
Always pass the Business API context (`this`) as the last argument of dbLayer
writes so events and traces carry the session. Discover the real generated
names in the data-layer chapter (`openappl/compiler/04-data-layer.md`); do not guess. MQuery filters are
db-agnostic (`{ status: 'active' }`, `{ age: { $gte: 18 } }`). Index naming:
`ServiceIndexer` namespaces every index with the project codename
(`<codename>_<object>`) — the index the service itself reads; the low-level
`ElasticIndexer` takes the name verbatim and refuses an unnamespaced one, so
manual index work goes through `ServiceIndexer` unless you are deliberately
addressing a foreign index by its full name.

**Design-time files (agreement texts, JSON tables, images) are service
files, not assets.** Record each one in the manifest at
`services/<svc>/serviceFiles/manifest`: `path` (such as `legal/terms-v3.md`),
`visibility` (`public`/`private`, default `private`), `contentType`, and the
`size` and `sha256` of the bytes, and keep the bytes with the service (a
manifest entry whose bytes are missing fails the build).
Limits: 10 MB per file, 100 MB per project. A public file is served at
`<service base URL>/service-files/<path>` (HTML/SVG inline under a sandbox
CSP, JS/XML as an attachment); every file is read in the service with the
SYNCHRONOUS `LIB.serviceFiles.text|json|bytes|info|has('<path>')` (no
`await`), for example an `AddToContextAction` value
`LIB.serviceFiles.text('legal/terms-v3.md')`. Use a literal path so
validation can check it (`LIB_SERVICE_FILE_UNKNOWN`). Node.js services only
for the route and the accessor. A new or replaced file reaches the running
service only after a rebuild and a deploy. **Private is not secret**: the
file is committed to the service repo and shipped in its image, readable by
anyone who can read that source or the image. Never put a credential in
one; the upload refuses text that looks like one (`SECRET_IN_SERVICE_FILE`).
Guide: `guides/composition/service-files.md`.

**Scheduled library code is a service cron job.** To run a library function
on a schedule, add `services/<svc>/cronJobs/<name>`:
`{ "jobBasics": { "name", "libFunction", "timeoutSeconds"?, "enabled"?,
"description"? }, "scheduleSettings": { "cronExpression", "runMode"?,
"timezone"?, "runOnStartup"? } }` (two sections; a field straight on the job
is refused). `jobBasics.libFunction` is a `library/functions` moduleName (not an edge function,
CRON_JOB_LIB_FUNCTION_NOT_FOUND); the function receives one `ctx`
(`jobName`, `runId`, `scheduledAt`, `lastSuccessAt`, `trigger`, `signal`) and
succeeds by returning, fails by throwing. One replica runs each tick (a
`sys_cronJobRun` claim row), every run is recorded, and operators read and
trigger jobs at `GET /cron-jobs`, `GET /cron-jobs/:name/runs` and
`POST /cron-jobs/:name/run`. `runMode`: `always` (default), `onceEver` (stops
for good after the first success: the tool for an urgent data move, with an
idempotent function, removed in the next version) or `oncePerStart` (once per
start era: a new build, a new deployment revision such as a rollout restart,
or every replica stopped). Use a Business API
`cronSettings` cron controller instead when the work is API-shaped
(parameters, actions, events); on nodejs a cron controller runs on one
replica per tick (`cronSettings.singleReplica`, default true, claimed in
`sys_cronJobRun`); `"singleReplica": false` and the other languages run it on
EVERY replica. Cron jobs are nodejs-only (CRON_JOBS_LANGUAGE_NOT_PORTED on another
language). Guide: `guides/business-apis/scheduled-business.md`.

## 9. The authoring loop and the completeness gate

For each asset in the §4 order:

1. Draft the payload from the spec + ontology.
2. Apply it to `blueprint.json` as one edit at the asset's path.
3. Run `mind-set validate blueprint.json`.
4. Fix every error it names, at the path it names, before moving on.

After the last asset:

5. The module gate: the semantic validation of an OpenAPPL validation tool
   or compiler, when one is available, over the module (`authentication` or
   `services/<name>`); drive to zero errors; judge warnings deliberately.
   A clean design verdict does not guarantee .NET translator gates emit.
   Keep portable `js` by default and use optional native sources
   deliberately (`guides/mscript/syntax.md`). Supported direct awaited
   Internal API forms from #6546 work on the current generator; do not
   prescribe blanket C# rewrites or warning suppression.
6. **Verify the mounted REST surface** before any build: work out each
   API's EFFECTIVE method+route from the blueprint (the route rules are in
   `openappl/compiler/05-business-apis.md`), then read the
   list itself for the things only a human eye catches: unintended
   calculator routes, single-record APIs that landed without a path
   parameter, a verb route that does not read like the rest. Fix via the
   API's `restSettings` before any build.

   **Check the list for route collisions too** (an OpenAPPL validation
   tool may report them; otherwise check by hand). Each collision has a
   `kind`, a winner `a`, a loser `b`, both routes, and `specificityOrdered`
   (whether the build's specificity sort decides between them):
   - `duplicate` — the same (METHOD, path) twice. `specificityOrdered: false`
     and nothing can pick a winner: whichever registers second is dead. Always
     a fix.
   - `static-under-param` — a static route sits under a sibling's `:param` at
     the same depth (`GET /standings/me` under `GET /standings/:userId`).
     With `specificityOrdered: true` the build's specificity sort registers
     the static route first, so it wins those URLs: that is the intended
     `/me`-style specialization, and a defect only if the parameter was meant
     to carry that value (a user really named "me"). With
     `specificityOrdered: false` the two sit in DIFFERENT routers and MOUNT
     order decides — respell your route so it cannot be reached by the other.
   - `mutual-overlap` — each route covers URLs the other spells out; neither
     is more specific. Respell one.

   The pattern routers mount routes of their own (cart, bucket
   upload/download, payment start/refresh/callback, oauth, ...) with no
   BusinessApi behind them (`openappl/compiler/12-derived-surface.md` lists
   them); they are the pattern working, not a gap; never hand-author twins
   of them. An overlap between YOUR route and one of theirs is the
   `specificityOrdered: false` case above.
7. **Machine completeness gate:** list the spec's inventory (data objects,
   properties per object, APIs, optional components) and diff it against the
   blueprint (`services/<name>` in `blueprint.json`). Every
   spec item must exist in the blueprint; every extra must be intentional.
   Report the diff result explicitly — completeness is proven, not claimed.
8. Report: assets written, validation status, unresolved warnings, gaps
   deliberately left (with reasons), and any placeholder roles or
   cross-service dependencies the orchestration level must resolve.
