# Writer guide: service-spec

One spec per domain service of the `microservice-definitions` roster, stored
as `service-spec-<key>` (the key is the roster name in kebab case:
`orderCore` -> `order-core`). It is the complete architecture of ONE service - the
single input its blueprint is authored from, and the blueprint implements
exactly what it says, no more, no less. Every architectural decision not made
here is made badly or not at all downstream. All service specs of a project
are written in one parallel round, after the auth spec.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `prd`, `user-stories`, `use-cases`, `microservice-definitions`
  (this service's roster entry, the Event Contracts rows it touches, the
  sagas it participates in, the AI Agents draft), `project-basic-setup`
  (tenancy, roles, flags - respect them verbatim).
- The target service: the roster name the running procedure hands you.
- Supplementary: the provider snapshot (`projectSettings` of `blueprint.json`
  when the blueprint exists, otherwise the `## Providers` section of
  `project-basic-setup`) - the provider instances the project really has, by name.
  The `auth-spec` (when the project has authentication) is the permission
  canon: its `## Access Control` says whether PBAC is on, which permission
  groups exist and which objects carry membership with which member roles.
- Canon: `procedures/design/canon/capability-map.md`,
  `procedures/design/canon/event-envelope.md`,
  `procedures/design/canon/dataview-access.md`,
  `procedures/design/canon/route-surface.md`,
  `procedures/design/canon/provider-shipped-state.md`.
- Reference: `procedures/patterns-catalog.md` and the pattern pages `openappl/spec/<Pattern>.md` - the exact
  `DataTypes`, action types, hook milestones, pattern configuration keys and
  enum literals every statement uses. Read the pattern page of every pattern
  you declare before writing its arrangement.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `service-spec` in `procedures/design/pipeline.json`; write
each exactly as given. The first eight are read by machine (one item per
bullet, `- (none)` when empty); the last three are required free-form
chapters.

- `## Required Patterns`
- `## Data Objects`
- `## Business APIs`
- `## Depends On Services`
- `## Notification Needs`
- `## BFF DataView Needs`
- `## Side-effects & Integrity`
- `## AI Agent Needs`
- `## Service Settings`
- `## Pattern Arrangements`
- `## Events`

## Document skeleton

Write the sections in this order:

```markdown
# Service: <name>

## Service Settings

## Required Patterns
- <pattern>

## Pattern Arrangements
### Pattern: <pattern> - <object or block>

## Data Objects
- <DataObjectName> - <one-line purpose>
### <DataObjectName>

## Business APIs
- <apiName> - <one-line purpose> - trigger: rest | kafka <exact topic> | cron <schedule>
### <apiName>

## Depends On Services
- <serviceName>

## Events
### Published
### Consumed

## Side-effects & Integrity
- <rule> -> <mechanism>

## Notification Needs
- <eventName> -> <role(s) notified> - <why>

## BFF DataView Needs
- <ViewName> - <main object + what it joins in> - <why a materialized view>

## AI Agent Needs
- <needName> - pattern: event|call - <trigger API + payload> - <result + how it returns>

## Library & Seeds

## Open Questions
```

`## Library & Seeds` is optional (omit it when empty); `## Open Questions`
collects every `OPEN` item.

A spec is **extraction + decision + declaration**: extract everything in the
requirement documents and project specs that concerns THIS service; decide
its full architecture in ontology vocabulary; declare the patterns it needs
and the cross-cutting needs (notification, BFF views, AI) the platform specs
discover by reading this document.

## Per-section rules

### `# Service: <name>` - identity and mission

One paragraph: the bounded context, what the service owns, what it explicitly
does NOT own (sibling services, platform modules), and the user stories / use
cases it serves by id.

### `## Service Settings`

One bullet per decision, with a one-line rationale where not the default:
`dbType` (postgresql default; say why if mongodb), `useSoftDelete`, the M2M
policy (normally NONE: every M2M caller is an authenticated internal service;
specify `allowedM2MClients` / `blockedM2MClients` only when the requirements
demand caller restriction - enforced at runtime, block wins over allow),
`secureEvents` (only for events crossing trust boundaries), custom variables
and packages if any.

### `## Required Patterns`

One per-service pattern per bullet, `- (none)` when none. ONLY from these
per-service patterns (capability map): bucket, payment, realtime,
event-subscription (a FRONTEND stream only), edge-controller, membership,
shopping-cart, content-model, video-room, ledger, invoicing, fiscalization,
compute-job, job-stream, waiting-room, graph-layer, seed-data - plus, only
when the requirements demand them, event-stream, elastic-log, pdf-generation,
oauth-flow, load-shield, enterprise-projection. Object-level patterns
(payment, membership, ledger, invoicing, fiscalization, enterprise-projection)
name the object they decorate in `## Pattern Arrangements`.

NEVER declare oauth, notification, agent-hub, ai-agent or kafka-events: auth,
notifications and agent-hub are separate platform services, all AI agents are
designed under agent-hub (a one-shot semantic transform is an in-workflow
`AiCallAction`), inter-service eventing is automatic (`raiseApiEvent`), and
consuming another service's events is a Business API with `trigger: kafka`.
Declare a pattern only when the service genuinely needs it.

- **Ledger smell rule:** a balance that accrues in discrete lots and drains
  under a policy (points, wallet, prepaid credits, stock on hand, seller payout
  accrual; anything with FIFO, expiry or holds) is the **ledger** pattern
  (`ledgerSettings` on the owner object) - NEVER hand-designed lot, movement or
  balance objects, a transaction log or a FIFO library.
- **Invoicing smell rule:** invoices, billing, credit notes, receivables,
  payment terms or e-invoicing are the **invoicing** pattern
  (`objectSettings.invoicing` on the object invoices are issued for) - NEVER
  hand-designed invoice, line, credit-note, numbering or invoice-payment
  objects or routes. It works with NO provider. A Merchant-of-Record payment
  provider (Paddle, Lemon Squeezy) already invoices the sale - never spec your
  own invoice for those captures. Regulatory fiscalization (e-fatura /
  e-arsiv, government submission) is the SEPARATE **fiscalization** pattern -
  never designed fiscal objects, signing flows, submission clients or a
  buyer-taxpayer branch: the framework routes by buyer lookup.

### `## Pattern Arrangements`

One H3 per declared pattern, its configuration IN ONTOLOGY VOCABULARY (keys
and enum literals from the pattern's ontology page). **A declared pattern with
no arrangement is a spec defect.** Depth by example:

- **payment** - the order object, the property bindings (order id, amount,
  currency, status, owner), the result map (bucket -> status literals), the
  order-item relation (`orderForeignKey` = the ORDER-side property, usually
  `id`; `orderItemLocalKey` = the ITEM-side foreign key - never swapped),
  lifecycle hooks (trigger + one-line intent; a hook that calls a same-service
  API via `await API.<apiName>({...})` needs that API specced as a fully
  parametric Business API with an internal-call controller - internal calls
  run as the system, so no session-injected params and no ownership check),
  the idempotency strategy.
- **nodejs / rust internal-call tenant scope** - a BusinessApi action (and,
  on nodejs, a hook) that has a caller session and wants the caller's tenant explicitly uses
  `await API.<apiName>(params, { session: this.session })`. Ledger internal
  APIs on a tenant-scoped owner object need it too. The optional second
  argument exists on nodejs and rust only; omitted sessions stay null with no inheritance
  through AsyncLocalStorage or the running manager. The call keeps its
  trusted system role/ownership bypass, so spec the caller's access gate on
  the wrapper. Provider webhook hooks with no session keep explicit-param
  system calls.
- **shopping-cart** - every sub-section decision incl. `orderCreationMode`
  (`none` = freeze-only checkout: spec the service's own purchase-flow API as
  the bridge that reads the checked-out cart and creates the order), property
  mappings, guest carts (guest-to-login rotates the owner slot, no merge), VAT
  rates in PERCENT, and NO stock-reservation promise (capacity is enforced by
  the purchase flow).
- **membership** - the membership object, keys, status check, role grants.
- **ledger** - the owner object with its identity columns (multi-store or
  multi-asset dividers are owner columns plus a unique composite index, never
  per-asset objects), the unit scale mode, the consumption policy, the
  maturity / expiry / reservation blocks with concrete values, roster
  overrides - AND the session wrapper APIs (spend, balance) specced as real
  Business APIs in `## Business APIs`; the generated roster stays internal.
- **invoicing** - the invoice-bearing object (and its source object when fed
  from another object in the same service), the property bindings, the issue
  policy with its guard (`onSourceCreate` is wired automatically - declare the
  policy, never an action pair to drive it), line relation, numbering and
  collection decisions, lifecycle hooks. The injected `sys_*` tables and
  generated invoice routes are never specced.
- **fiscalization** - the bearing object, `jurisdiction` (`TR` is the shipped
  policy), seller and buyer party bindings, `submitPolicy`
  (`onInvoiceFinalized` REQUIRES the invoicing block on the same object;
  reporting-only objects state `manual`), submit guard, internet-sale bindings
  for e-commerce shapes; a marketplace whose payouts are invoice-gated states
  `payoutGate` in its payment arrangement. A Turkish internet sale states HOW
  the goods travel (`carrierMode`, VUK 509 makes the carrier party mandatory):
  `carrierCompany` with a carrier-company settings object (one row per
  shipping company: legal title, VKN/TCKN, address) that the order references
  (`carrierDataObject` / `carrierRefProperty` plus its title and tax id
  columns, and the order's tracking number column), or the carrier title + tax
  id statics for a single-carrier shop; `selfDelivery` when the seller ships
  with its own vehicle or courier; `noShipment` for services and digital
  goods (state it: an empty mode on a block that binds no carrier, shipment
  date or tracking number is read as `noShipment` with a warning, and on a
  block that binds any of them as `carrierCompany`). A carrier name alone is
  not a carrier: the design is refused
  (`FISCAL_INTERNET_SALE_CARRIER_UNBOUND`). The internet-sale block is
  object-level: every row of that object is fiscalized as an internet sale,
  so an object that sells both in store and online is specced as two objects
  (or two fiscalization configurations). A tenant-level carrier settings
  object is read only within the order's tenant; carrier companies shared by
  every tenant belong on a non-tenant-level object (a tenant-level carrier
  object under an order without a tenant is refused). The platform does NOT
  fiscalize a customer's return of a sale (maintainer ruling 2026-10-07,
  #6660): spec that as the ordinary `sys_*CreditNote` (`issueCreditNote`)
  plus the outside-platform document (the consumer's signed e-Arsiv return
  section or a gider pusulasi for an e-Arsiv sale; the buyer issues the IADE
  for an e-Fatura buyer) - never a seller-issued IADE invoice back to the
  platform's own customer. The IADE return-ROW shape (own lines, a column
  holding the ORIGINAL row's id, e.g. `originalOrderId`, set by the return
  flow, plus `originalRefProperty` naming that column and a `documentTypeMap`
  that classifies the row, e.g. `source.originalOrderId ? 'creditNote' :
  'invoice'`) is specced only when the fiscalizing party ITSELF is returning
  goods it received (e.g. to its own supplier): GIB requires the original's
  serial on every IADE document, a TR map yielding `'creditNote'` without
  `originalRefProperty` is refused at design time, and a credit note whose
  original row has no single issued invoice is refused.
- **bucket** - tier (db / native / remote), size and mime limits, access
  levels as literals (`readAccess` / `writeAccess` / `deleteAccess` plus check
  and absolute roles; check roles apply only under mode `roles`;
  `deleteAccess` has no check-roles field, so a staff-only delete is
  `adminOnly`), owner object. An owner-scoped read ("the user sees their own
  files") is the db tier plus `readAccess: 'private'` - never a read-auth
  script owner check (the read gate sees no file record) and never `private`
  on a remote or native tier (no uploader is recorded). The tier follows the
  access requirement.

Worked example (shape, not content):

```
### Pattern: bucket - evidenceFiles
- tier: db (owner-scoped reads required -> only the db tier records the
  uploader; scans and PDFs fit the db-tier cap)
- owner pairing: dataObjectName: `claim`, relationProperty: `claimId`
- authorization: readAccess: 'private'; writeAccess: 'roles' with
  writeCheckRoles: [agent, admin]; deleteAccess: 'owner'
- limits: max 10 files per claim (a ValidationAction on the attach API),
  mime: image/*, application/pdf; maxFileSizeMb: 10
```

### `## Data Objects`

First the machine-read bullet list, one line per object. Then one H3 per
object with: purpose and access decision (`dataObjectAccess` literal plus the
tenant-level statement), soft-delete override if any; **the property table**:

| name | type(+isArray) | required | allowUpdate | default | index/unique | relation(target, onDelete) | session/staticJoin | filter/search | notes |
|---|---|---|---|---|---|---|---|---|---|

Types are `DataTypes` literals; enums list their exact option strings in the
project casing; owner fields are marked `isOwnerField` with their
`sessionParam`; denormalized fields state their static-join source;
cross-service relations use `service:objectName` (the object half is the data
object's own lowerCamelCase name: `customer:customer`). Never list the auto
fields (`id`, `isActive`, `createdAt`, `updatedAt`). Then composite indexes
(uniqueness and one-per-X rules land here, each with its `onDuplicate`
literal) and the cache decision for hot objects.

Built-in objects are REFERENCED, never redeclared (`auth:user` relations and
session-injected owner fields); tenant scoping is automatic, never a
hand-declared tenant foreign key.

`onDeleteAction` follows the SHAPE of the relation (the ontology's decision
rule), never which option sounds least destructive. `isRequired` defaults to
true and `setNull` on a required foreign key is rejected at build time
(`RELATION_SETNULL_ON_REQUIRED_FK`): a required key takes `doDelete` (this row
is PART OF the target), `restrict` (the target may not go while this row names
it) or `doNothing` (the target may go; this row survives naming it). A
`setNull` row says `no` in the required column.

| name | type | req | upd | default | index | relation | session/join | filter | notes |
|---|---|---|---|---|---|---|---|---|---|
| reviewerId | ID | yes | no | - | indexedInDb | auth:user, doDelete | isOwnerField (sessionParam: userId) | filter | injected from session; the review is part of its author |
| planId | ID | yes | no | - | indexedInDb | billing:plan, restrict | - | filter | a plan in use may not be deleted |
| lastEditedByUserId | ID | no | yes | - | - | auth:user, setNull | - | - | nullable first, then setNull |

**A reference that can point at more than one kind of object** is decided
HERE: an `xId` whose target depends on a sibling `xType` gets no `relation`
(say so in notes) and an Enum discriminator listing every type. State in
`## Side-effects & Integrity` that resolving it is one fetch PER type; a value
derived from the target is read from that target's own record, and a derived
value that lands in a REQUIRED column needs an answer for every branch.

### `## Business APIs`

First the machine-read bullet list with the trigger note (omit it only for
plain REST). Then one H3 per API with its flow plan:

- `crudType` (create | update | get | list | delete - no others), target
  object, purpose, `raiseApiEvent` decision;
- **trigger** - rest with an EXPLICIT route, kafka `<exact derived topic>`, or
  cron `<expression>`:
  - **State an explicit REST route for every rest API** (`POST /projects`,
    `PATCH /phases/:phaseId/reorder`); the blueprint copies it verbatim.
  - **A second API of a crudType on the same object MUST carry a distinct
    route** - a data object gets one default route per crudType, and a second
    API that resolves to it ships unreachable with a green build.
  - **Routes of different data objects must not overlap.** At the same method
    and segment count, no other object's `:param` may cover your literal
    segment and yours may not cover theirs (validation rejects it:
    `STATIC_ROUTE_SHADOWED_BY_PARAM`). Ordering is not a remedy; rename the
    odd route (`/meetings/by-group/:authGroupId` ->
    `/meetings-by-group/:authGroupId`). Exempt: a static route beside the
    parametric route of the SAME object (`GET /tasks/my` next to
    `GET /tasks/:taskId`).
  - **Kafka-triggered APIs** are kafka-only: state `rest: none
    (hasRestController: false)` and give no route (a default REST controller
    needs an id segment the event cannot supply). Declare ONLY the payload
    keys the API consumes (every unread key is a `PARAM_UNUSED` defect; the
    full key list lives in `## Events`). A mapping step whose result the write
    consumes is scheduled at `afterCheckParameters` - the data clause is
    evaluated before later milestones, so a late producer writes `undefined`
    (`ACTION_CONTEXT_READ_BEFORE_PRODUCED`).
- **auth** - loginRequired, `checkRoles` / `absoluteRoles`, permissions,
  `ownershipCheck` (main object only; parent or scope ownership is a
  permission check with scope fields), the M2M flag (mark M2M callback APIs
  explicitly - the agent-hub contract depends on them). **Know the permission
  canon before you gate anything** - read the auth spec's `## Access
  Control`: with PBAC off the permission resolver is never generated and a
  `permissionCheck` denies every caller. Cite only permissions the auth spec
  declares. Otherwise gate on roles and on the MEMBERSHIP ROLE - "only an owner or admin of
  this organization" is a `membershipCheckAction` with `requiredRoles`
  compared against the object's role field, never a `checkFor` expression
  reading a member role. Finer granularity is a finer member role, not a
  permission group. Only when the auth spec is absent, or silent on the
  permission a rule genuinely needs, name the permission and mark it `OPEN`
  under `## Open Questions` ("needs PBAC: `listing.approve`") so the
  permission canon is revisited - never cite an undeclared permission as a
  settled gate.
- **parameters** - `name | type | location | required | notes`; types match
  the bound property.
- **query plan** - ONLY the blocks valid for the crudType (data clause for
  create/update; select for get/list; where for get/list/update/delete; get
  options for get; list options and pagination for list; delete options for
  delete): select-by / where with additional clauses and their intent ("approved
  OR own" is ONE `$or` clause), projection, sort, search and joint filters,
  data-clause entries for computed or injected values.
- **actions** - `hook milestone | action type | name | purpose`, names
  verbatim from the ontology. Every side effect the requirements imply for a
  mutation API appears here (audit writes, counters, status propagation,
  events, cross-service calls).
- **response / test notes** - shape deltas, testing hints.

```
### approveClaim
- crudType: update - object: Claim - admin approves a pending claim -
  raiseApiEvent: true
- trigger: rest - PATCH /claims/:claimId/approve
- auth: loginRequired, checkRoles: [admin]
- parameters: claimId | ID | urlpath | required
- query plan: selectBy claimId; where: status == 'pending'; dataClause:
  status = 'approved', decidedAt = now
- actions:
  | hook | action | name | purpose |
  |---|---|---|---|
  | afterCheckInstance | SimpleCheck | guardPending | reject non-pending |
  | afterMainUpdateOperation | UpdateCrudAction | bumpApprovedCount | counter on owner profile |
- response: updated Claim; event carries claimId, ownerUserId, status
```

### `## Depends On Services`

One service name per bullet, `- (none)` when none.

### `## Events`

- **Published** - one entry per API that emits an event, with its emission
  mechanism (`derived` or `explicit`, event-envelope canon section 2) and its
  BARE payload keys, the topic string (section 3) and the consuming surface.
  Copy identity keys from the msd Event Contracts table verbatim; the producer
  populates every named key on every path, including AI and M2M callback
  paths (look the owner up and stamp it). `...Url` keys carry fetchable
  signed URLs, never file ids.
- **Consumed** - a mirror entry for every `trigger: kafka` API, stating the
  producer's mechanism. A kafka-triggered API unwraps the envelope: its params
  bind the record's BARE key (`old.<prop>` for an update's pre-change row).

Both sides of every Event Contracts row this service touches appear here.
**Saga awareness:** for each msd saga this service takes part in, know your
role and step, honor the saga's declared discipline (its one idempotency-key
scheme, the pending-state timeout owner, the ordering guard) and write a
`saga: <name>` note on the participating events and APIs. If your closer view
shows the saga draft is wrong for your part, revise it and flag the change.

### `## Side-effects & Integrity`

For EVERY rule the requirements imply, a `- rule -> mechanism` line whose
mechanism REFERENCES the actions, composite indexes and cron APIs declared
above BY NAME: uniqueness -> composite unique index; cross-entity updates on
success -> the named action or the consumer that closes the loop; admin and
role gates per API; ownership and parent-ownership checks; retention and
timeout jobs -> cron APIs with schedule. Copy this service's rows from the msd
Event Contracts table here (keep the payload keys) and assign each an
implementing mechanism. Anything you cannot assign is marked `OPEN`.

### `## Notification Needs`

One entry per business event this service raises that should notify someone:
`- <event> -> <role(s)> - <why>`. EXCLUDE the notifications the platform sends
itself (password reset, verification codes, login alerts). An entry that
notifies a whole role (all admins) names the role - the notification layer
fans out to it; an entry that notifies a data-dependent set of users (an
organization's admins, followers) means THIS service's producing API stamps
their ids into the event payload and `## Events` lists that key. Never expect
the notification layer to find admins through the event's user or owner
fields. `- (none)` when none.

### `## BFF DataView Needs`

Per denormalized cross-service read view this service (or a notification
about it) needs: view name, main object and what it joins, and why a
materialized view beats a local query. `- (none)` when none.

### `## AI Agent Needs`

The msd `## AI Agents` roster is the DRAFT for this service; start from it
(expose the M2M tool APIs, raise the events, build the callback APIs its
agents name) - then RETHINK it against this service's real needs, and make
every deviation explicit with a one-line rationale (the agent-hub spec
reconciles all revisions). For each place AI works for this service, first
decide WHERE it belongs - does the AI need to DO things, or just THINK once
about its input?

- **In-service `AiCallAction` - no agent (the default).** A one-shot,
  stateless, tool-free transform whose result the SAME Business API consumes.
  Declare it as an AI step inside that API (provider and structured output);
  no agent object exists anywhere.
- **agent-hub agent, pattern event.** Only when the AI must DO things (tools,
  another service's live state, several reasoning steps, collaboration, a
  feedback loop) AND the calling API can complete now and absorb the result
  later: declare the raising API (`raiseApiEvent: true`), the payload, the M2M
  callback Business API on THIS service the agent calls with its result
  (listed in `## Business APIs`, marked M2M), and the timeout / fallback
  owner.
- **agent-hub agent, pattern call.** Same agentic needs, but the business
  logic cannot proceed without the result in the same request: the API embeds
  `agentCallActions` - say WHY.

Agents never publish response events. `- (none)` when the service needs no
AI.

### `## Library & Seeds` (optional)

Library functions (name, language, one-line contract) referenced by
function-call actions or pattern handlers; seed data entries (object, match-by
key, values intent).

### `## Open Questions`

Every `OPEN` item from the document. A concept the ontology cannot express
lands here - never invented, never paraphrased into pseudo-configuration.

## Hard rules

- **This document designs the SERVICE (backend) only.** Never design screens
  and never state that a frontend is out of scope. Respect
  `project-basic-setup` exactly - use its role names verbatim.
- **Do not design other services**; reference them only through their
  contracts in `microservice-definitions`.
- **Providers** are referenced BY NAME from the provider snapshot; only
  shipped brands (provider-shipped-state canon); no credentials.
- **Enum casing** is project canon: one casing per enum, passive status forms.
- **Topic strings** are derived and lowercase; consuming an event is a
  Business API with `trigger: kafka <exact topic>`, never a pattern.

## Completeness checklist

- File features: the full attachment lifecycle (create / list / delete APIs)
  AND count limits as validations - a bucket alone enforces no counts.
  Owner-scoped file reads map to the db tier with `readAccess: 'private'`.
- Search: every searchable text field appears in the search / full-text plans
  of the property tables.
- Public access: with no BFF, visitor-accessible read APIs exist for every
  public surface (`loginRequired: false` with fixed approved-only clauses).
- Social integrity: self-action guards, duplicate guards (unique composite
  indexes), target-role validations.
- Every Event Contracts row this service touches is in `## Events` and
  `## Side-effects & Integrity`, and every identity key it names is populated
  by this service's producers on every path.
- Content moderation on this service's own objects is `objectModeration`
  (`objectSettings.objectModeration`), not a hand-designed pipeline: declare
  the object, its `policy` and the other block fields; the pattern emits the
  review queue, the timeout (`timeoutMs`, enforced by the engine, no sweeper
  to design) and the accept/reject/queue/submissions apis. Design a hand-built
  moderation pipeline ONLY for the standalone-service exception
  (`microservice-definitions.md`, "Moderation") - and only then do the next
  two rules apply:
  - AI moderation pipelines have a deterministic TIMEOUT SWEEPER - a cron API
    (cadence within the AI timeout window) that moves stale pending items to
    the manual queue with a record and an event.
  - Moderation or escalation queues this service owns have an ADMIN decision
    API for items escalated but not appealed, raising the same outcome event
    as the AI path.
- Child-object list APIs take the parent id as a required parameter, and every
  declared filter or search parameter is used in the query plan.
- Owner visibility: logged-in users see approved content PLUS their own
  pending or rejected items (one `$or` clause) - hand-design this clause only
  on an object with NO `objectModeration` block. On a moderated object it is
  automatic: `mode: staged` has no unapproved real row to leak (the author's
  own pending/rejected view is the injected `listMy<X>ModerationSubmissions`
  api, not a clause on the real object's list), and `mode: onPlace` gets the
  framework's own `moderationStatus = accepted` OR-author visibility gate on
  every read path - do not re-author either.
- Appeals (when in scope): a resolution API that UPDATES the appeal status,
  plus notification needs in both directions.
- Ledger coverage: every points / wallet / credits / stock / payout-accrual
  requirement maps to the ledger pattern, with session wrapper APIs for spend
  and balance and idempotency keys derived from business facts.
- Every declared pattern has its arrangement; every M2M callback named in
  `## AI Agent Needs` exists in `## Business APIs` marked M2M; every mechanism
  in `## Side-effects & Integrity` names something declared above.
- A topic's message shape is identical across all its publishers; every topic
  string is lowercase.

## Output

Write the document to `design/service-spec-<key>.md` (writer contract
section 4), where `<key>` is the roster name in kebab case.
