# Patterns catalog — basic vs business-specific

Read after the ontology overview (`openappl/ontology/`). This catalog answers two questions:
which patterns exist, and **when you must learn one** — before shaping the
architecture, or only at build time from its ontology doc.

Rules of use:

- **Basic patterns** are in every project; their working knowledge is baked
  into the fixed core procedures (`blueprint-authoring.md` and the Faz 1+
  guides) — you do not need extra reading beyond the ontology while writing.
- **Business-specific patterns** are opt-ins driven by the domain. Each has a
  one-sentence summary here. Most are fully manageable from their ontology doc
  read at build time (`openappl/spec/<Pattern>.md`); the ones flagged
  **[architecture-first]** change the shape of a good design — read their
  guide (or at minimum their pattern page plus a corpus search) BEFORE you
  finalize data objects and APIs, because retrofitting them means redesign,
  duplicated hand-built machinery, or both.
- Names below are ontology key names; when a name looks stale against the
  live ontology, the ontology wins (`openappl.json` and `openappl/spec/`).

## 0. Need -> pattern selector

The design-time entry point: match the REQUIREMENT to the pattern, then read
the pattern's row below (and its guide when flagged). Adapted from the
platform's structure guide; verify names against the live ontology.

| The product needs... | Reach for | Note |
|---|---|---|
| Charge one-time for something (orders, purchases) | `checkout` (objectSettings opt-in) | [architecture-first] — decorates YOUR order object; how-to: `howto-payment-flow.md` (cart + checkout + hooks + refund + preview ladder) |
| Recurring billing / plans | `subscription` (objectSettings opt-in) | [architecture-first] - how-to: `howto-subscription.md` (planCode binding, plan catalog provisioning, quota ledger, renewal vs charging, preview ladder) |
| Multi-vendor selling, split payments | marketplace family + provider interlocks | [architecture-first] |
| Balances, earnings, credits, holds | `ledgerSettings` (objectSettings opt-in) | [architecture-first] — NEVER hand-build a ledger |
| Invoices / regulatory e-invoicing | `invoicing` + `fiscalization` | [architecture-first] |
| Moderate user-submitted content before it is visible/applied | `objectModeration` (objectSettings opt-in) | [architecture-first] — THE default; a standalone moderation service is the exception, not a peer design |
| Cart, promotions, limited stock, reservations | `shoppingCartConfig` (service opt-in) | [architecture-first] |
| Tiered/membership access to a resource | `membershipSettings` + `membershipCheckAction` | |
| File upload/storage — small, transactional | `dbBuckets` | [architecture-first] Case-1/2 choice |
| File upload/storage — large, CDN-served | `remoteBuckets` + bucket provider | [architecture-first] Case-1/2 choice |
| Server-rendered PDFs (invoices, reports) | `pdfTemplates` (library) | |
| A content platform (articles, media, comments) | content-model presets | prebuilt object families |
| Live chat, presence, collaborative rooms | `realtimeHubs` | |
| Push server events to subscribed clients | `eventSubscriptions` | |
| Queue/waiting-room for contended drops | `waitingRooms` (service opt-in) | |
| Async/batch/AI/media processing | `computeJobs` | |
| Hot-row read caching | `redisEntityCacheSettings` (objectSettings) | |
| A custom endpoint no CRUD shape fits | `edgeControllers` | LAST resort — prefer BusinessApi + actions |
| Per-customer/workspace data isolation | multi-tenancy (tenantSettings + per-object scope) | [architecture-first] — settle BEFORE any object |
| Graph traversal, recommendations, networks | `graphLayer` / `graphProjection` | [architecture-first] |
| Append-only searchable audit/event log | `elasticLogs` (projectSettings) | |
| A conversational AI agent with tools | `agentHub` aiAgents (+ `AiCall`/`AgentCall` actions) | designed in the platform wave |
| Read / reply from a real mailbox (the project's own inbox) | `mailAccount` family | the domain IS email, or mail-to-tasks |
| Each user or tenant connects their OWN mailbox | `mailAccount` template, `ownerScope: user` / `tenant` | nodejs only; the how-to `howto-mail-to-tasks.md` |
| Each user or tenant brings their OWN AI key (BYOK) | `AiProvider.credentialScopes` | nodejs, python, rust (user, tenant, workspace levels); dotnet, java, golang (user and tenant levels); never a key column or custom variable; `pitfalls.md` section 7 |
| Each workspace (company, team) has its OWN AI key its admins set and its members use; users belong to several workspaces | `AiProvider.credentialScopes.resource` on the workspace data object (needs its membership) | the workspace object in a nodejs, python or rust service, called from nodejs, python or rust; never a tenant, never a key column; `pitfalls.md` section 7 |
| Sandbox accounts in preview / stage, live in production, a mock where no sandbox exists | Sandbox / Live credential sets + `credentialMode` | the provider family's pattern page |
| Social login flows per service | `oauthFlows` | project-level toggles cover the common case |
| Cross-service read models, dashboards, search lists | BFF DataViews | platform wave, from `bff-spec` |
| Notify users on business events | notificationService | platform wave, from `notification-definitions` |
| Run on a schedule / react to a Kafka event | BusinessApi `cronSettings` / `kafkaSettings` | basic machinery, not an opt-in pattern |
| Run a library function on a schedule, once per tick across replicas; a run-once data move | Service `cronJobs` (`runMode: onceEver` / `oncePerStart`) | nodejs only; recorded runs + admin routes; see scheduled-business |

**A need with NO row here may be a pattern NEWER than this bundle.** The
Language grows continuously: search the corpus (`openappl/`, `procedures/`,
`guides/`) and `openappl.json` FIRST, before concluding the language cannot
do it or designing it by hand; read hits in full.

## Basic patterns (every project — fixed guides in the corpus)

| Pattern | What it is |
|---|---|
| DataObject + DataProperty | The data model: objects, typed properties, activation blocks (`relationSettings`, `sessionSettings`, `staticJoin`), indexes, composite indexes. |
| BusinessApi | One endpoint: five crudTypes, transports (REST/cron/Kafka/SSE/gRPC), query clauses (MScript), request parameters, dataClauseItems, action workflow. |
| authentication module | Login identifiers, verification services, 2FA, roles and access control, social logins, user/tenant properties — project-level, not per-service. |
| MScript | The expression language of clauses, conditions, formulas and action parameters (`openappl/compiler/08-mscript.md`). |
| Actions + workflow milestones | Validation/fetch/child-CRUD/function-call/interservice-call/publish-event/notification actions sequenced on the milestone chain. |
| Event subscriptions + raiseApiEvent | Kafka events between services and topic->client bridges. |
| Library functions | Custom Node.js functions callable as `LIB.fn(...)` (dbLayer import rules in the coding guides). |
| Seed data | Bootstrap records per service. |
| BFF DataViews | Materialized cross-service read models — designed in the system-service wave AFTER domain services. |
| notificationService | Outbound notification wiring — also a system-service-wave artifact. |

## Business-specific patterns (opt-in, domain-driven)

**Payment & commerce**

- **[architecture-first]** `checkout` (objectSettings opt-in) — decorates YOUR
  order object with the full one-time payment flow (payment records, start/
  refresh/callback APIs, provider webhooks); you design the domain order,
  the pattern adds the payment layer — never hand-build payment plumbing.
  Concretely, do NOT hand-add what the pattern already emits: a payment-id
  field on the order, a webhook route, payment-status callback APIs, or the
  `sys_<X>Payment` / `sys_paymentCustomer` / `sys_paymentMethod` objects —
  hand-authored twins collide with the injected surface. See the real
  injected routes in the derived surface (`openappl/compiler/12-derived-surface.md`).
  What you DO still design: the domain order fields,
  and payout/withdrawal flows (not part of checkout) — but seller BALANCES
  go to `ledgerSettings`, never a hand-built ledger.
  **Activation ORDER when refunds are in play (two-stage)**: RefundAction
  validates against the checkout block (`PAYMENT_NOT_CONFIGURED`), while
  `lifecycleHooks` statically require the internal hook APIs to exist.
  Neither can go first in one write — so (1) merge the checkout
  configuration WITHOUT `lifecycleHooks`, (2) author the refund-bearing /
  hook APIs, (3) merge the hooks last (pilot-verified recipe).
- **[architecture-first]** `subscription` (objectSettings opt-in) — recurring
  billing lifecycle bound to a data object (plans, renewal, cancel flows);
  how-to: [howto-subscription.md](howto-subscription.md).
- **[architecture-first]** marketplace/split-payment family — multi-vendor
  orders where payment splits per seller; provider interlocks matter
  (provider registry at `projectSettings.paymentProvidersSettings`).
- **[architecture-first]** `ledgerSettings` (objectSettings opt-in) — decorate
  a balance-style object and the framework generates lots, movement log,
  reservation holds and earn/consume/reserve APIs; NEVER hand-design a
  transfer-ledger/balance object family.
- **[architecture-first]** `invoicing` (objectSettings opt-in) — accounts-
  receivable invoice lifecycle on a data object, provider-optional.
- **[architecture-first]** `fiscalization` (objectSettings opt-in) — the
  regulatory pipeline (classify/transform/sign/submit/reconcile) on top of
  invoicing, jurisdiction policies compiled into code.
- **[architecture-first]** `shoppingCartConfig` (service opt-in) — cart /
  checkout / promotion engine with capacity reservation; generates the cart
  object family.
- `membershipSettings` (objectSettings) — resource access via a membership
  join table (tiers, member roles); pairs with `membershipCheckAction`.
- **[architecture-first]** `objectModeration` (objectSettings opt-in, #4704) —
  staged create/update writes through a bound decision provider (accept /
  reject / review), an injected `sys_<X>ModerationReview` queue, and
  reviewer accept/reject/queue + author submissions apis — THE default
  answer to "this needs moderation" on ANY DataObject, not a content-layer
  special case. `mode: staged` (default) holds the real row until accept;
  `mode: onPlace` writes immediately behind a read-only `moderationStatus`
  visibility gate, for objects whose children need the real row id before
  moderation completes. Two-tier reasons (`wantReason` + `escalateTo`) name
  an agent-hub agent that WRITES the reason, never one that decides. NEVER
  hand-build an intake/outcome Kafka pipeline, a subjectService/subjectKind
  enum, or an M2M verdict-callback for this — that is the exact machinery
  the pattern replaces; a standalone moderation service is justified only by
  an edge case the pattern does not cover (see
  `procedures/design/canon/capability-map.md`, "moderation").

**Files & content**

- **[architecture-first]** `dbBuckets` / `remoteBuckets` — complete file
  components (metadata object + upload/download routes + CRUD), NOT raw blob
  storage; the architectural choice is Case 1 (files hang off a record — the
  bucket's auto object IS the file table) vs Case 2 (files are first-class
  domain entities — a parallel domain object is legitimate), and DbBucket
  (small, transactional, in-DB) vs RemoteBucket (large, CDN, provider at
  `projectSettings.bucketProvidersSettings`). Three traps: in Case 1 do NOT
  design a parallel file object — the bucket's auto metadata object IS the
  file table; in Case 2 STILL configure `ownerDataObject`, pointed at the
  PARENT record (the meeting, not your domain file object) — it is the
  expected default and the validator warns when missing (legit exceptions:
  global/system buckets); and the metadata rows are created by the bucket's
  own upload route — the upload endpoint IS the create, so never author a
  create API for (or POST records into) the `<name>File` metadata object.
  Extra columns on a RemoteBucket's `<name>RemoteFile` metadata object (a
  lifecycle `status`, a FK to the record the file will belong to) go in
  `remoteBucketSettings.additionalColumns` (full DataProperty entries; a
  required one needs a default because the upload writes only the base
  columns) and are then written through CRUD actions on that object - needing
  one is not a reason to design a parallel file object (#4821).
  Thumbnails / resized copies of uploaded images: declare
  `bucketBasics.imageVariants` on the RemoteBucket (created on upload,
  recorded as `variants.<name>.url` on the file row and in its events, served
  by `?variant=<name>` on the download route, deleted with the original,
  backfilled by an admin route) - never a business API that resizes with a
  hand-added `sharp` and stores a parallel `*ThumbUrl` field.
  Full decision guide pending the file-uploads how-to; ontology covers the
  fields.
- `pdfTemplates` (library) — server-rendered PDFs (invoices, reports).
- content-model presets — prebuilt content-platform object families
  (see `howto-content-editorial.md`). Nodejs generates missing
  editorial CRUD under `/content-editor/<kebab-name>`; create a draft, edit it
  by id, then publish through `/content/<kebab-name>/:id/transition`. Configure
  actual project editRoles/publishRoles: with none declared only the platform
  operators (superAdmin + admin; multi-tenant superAdmin + saasAdmin; a
  tenant-level model adds tenantOwner + tenantAdmin) edit and publish. On a
  multi-tenant project `contentBasics.contentIsInTenantLevel` makes a model
  each tenant's private content (default: shared by every tenant).
  Use `contentBasics.editorialApis: none` to opt out. See the [content editorial guide](howto-content-editorial.md).

**Realtime, flow control & compute**

- `realtimeHubs` — Socket.IO/SSE rooms with subscription rules, presence,
  history.
- `waitingRooms` (service opt-in) — queue/waiting-room flow control for
  contention-heavy operations (drops, limited capacity).
- `computeJobs` — async/batch/AI/media compute workloads with resource
  profiles (`projectSettings.computeSettings` for defaults).
- `redisEntityCacheSettings` (objectSettings) — hot-row entity caching with
  TTL.
- `edgeControllers` — hand-written custom REST endpoints outside the CRUD
  pattern (last resort; prefer BusinessApi + actions).

**Data & intelligence**

- **[architecture-first]** multi-tenancy (`authentication.loginDefinition.
  tenantSettings` + per-object tenant scope) — decides tenant injection on
  every object and API scope; must be settled before any object is designed.
- **[architecture-first]** `graphLayer` / `graphProjection` / `graphEdge` —
  project objects and FKs into a graph DB (provider at
  `projectSettings.graphProvidersSettings`) for traversal queries.
- `elasticLogs` (projectSettings) — append-only, ES-searchable event logs
  with `WriteToElasticLog` / `FetchFromElasticLog` actions.
- `aiAgents` (`agentHub` — never under a service for new designs) —
  conversational agents with tool access; `AiCall` / `AgentCall` actions for
  in-workflow AI.
- `mailAccount` family — full mailbox/account machinery (IMAP/SMTP-style
  flows): the project's own inbox, or a TEMPLATE (`ownerScope: user` /
  `tenant`) each user or tenant connects their own mailbox to.
- `oauthFlows` (per service) — social-login flows beyond the project-level
  toggles.

## How-to guides

Business-specific patterns have task-shaped how-to guides next to this file:
`procedures/howto-payment-flow.md`, `procedures/howto-subscription.md`,
`procedures/howto-content-editorial.md` and `procedures/howto-mail-to-tasks.md`.

Until a topic's how-to exists, the order of authority is: its ontology doc
-> a corpus search -> the compiler specification (`openappl/compiler/`). When a pattern
you need is flagged [architecture-first] and has no guide yet, budget a
reading pass BEFORE the design step and record what you learned in the
project memory.
