# Capability map - WHAT exists and WHERE it lives

Read by the microservice-definitions and service-spec writers (and useful to
every spec writer). You design by MAPPING requirements onto this outline -
never by inventing mechanisms. If a requirement fits no home listed here, put
it under the document's open questions; do NOT design a new mechanism for it.
Names here are design-level family names; the exact configuration keys are in
`procedures/patterns-catalog.md` and the pattern pages `openappl/spec/<Pattern>.md`,
and when a name looks stale against a pattern page, the pattern page wins.

## Project settings (project level)

Native integration PROVIDERS live here, referenced by name from everywhere
else: notification (email / sms / push / whatsapp / telegram, plus the inApp
bell-center store), AI, remote bucket, payment, invoice (the system of record
for the invoicing pattern - `internal` by default, no entry needed), fiscal
(the regulatory submission channel for the fiscalization pattern - always an
integrator, no internal brand), video, mail accounts, AMQP. Credentials are
entered by the user in the project settings - never designed, never asked for
in a document.

**A native provider is not a third-party integration, and the two are not
interchangeable.** Taking card payments is the `payment` provider family plus
a checkout - Stripe is one of its brands, and the whole flow (session, webhook,
order status) is generated. A Stripe INTEGRATION means the opposite: the
project implements that flow itself, call by call. Design an integration only
for a capability no provider family covers, or when the requirement genuinely
is a hand-built flow.

Provider brands: see `procedures/design/canon/provider-shipped-state.md` - a brand the enum
accepts is not necessarily a brand that works.

## Auth service (built-in - configured, never designed)

Registration, login, password reset, email/mobile verification, 2FA, social
login, SSO, API keys, RBAC with custom roles, multi-tenancy, custom user and
tenant properties. Avatars: an automatic built-in db bucket - no decision, no
overload. System notifications (reset and verification codes, login alerts)
are sent automatically - never listed as notification needs.

## Domain services (one per bounded context)

Data objects (properties, relations, session-injected owner fields, soft
delete via `isActive`), Business APIs (exactly five crudTypes), library
functions. Per-service PATTERNS declared in the service spec:

- **bucket** - three tiers: db (minimal, blobs in the database, no provider),
  native (a bucket the hosting platform provides, no provider), remote (professional,
  provider from project settings).
- **payment** (checkout, subscription, marketplace payouts), **realtime**
  (hubs: rooms, messages, presence), **event-subscription** (streams topic
  payloads to the FRONTEND over SSE/websocket - a UI feature, never a
  service-side consumer), **edge-controller**, **membership** (per-record
  access via a member data object), **shopping-cart**, **content-model**
  (declared content types - the framework synthesizes their data objects,
  editorial workflow, i18n, versioning, search), **video-room** (binds a data
  object to a provider video/broadcast surface - control plane only),
  **ledger** (`ledgerSettings` on the balance-owning object: an append-only
  ledger with lots, movement log, two-phase holds, earn/consume/reserve roster,
  maturity and expiry crons - for points, wallets, credits, stock, payout
  balances), **invoicing** (`objectSettings.invoicing` on the object invoices
  are issued FOR: injected `sys_*` invoice, line, credit-note and allocation
  tables, numbering, the draft-open-paid state machine, payment allocation -
  fully functional with NO provider), **moderation** (`objectSettings.
  objectModeration` on the object carrying user-generated content: writes are
  STAGED through a decision provider - one `choice` verdict, `accept` \|
  `reject` \| `review` - with an injected `sys_<X>ModerationReview` queue and
  reviewer accept/reject/queue/submissions apis; `mode: staged` holds the real
  row until accept, `mode: onPlace` writes immediately behind a read-only
  `moderationStatus` gate, for objects whose children need the real id - this
  is THE default answer to "this needs moderation", never a hand-built
  intake/callback pipeline, see "Patterns that absorb whole services" below),
  **fiscalization**
  (`objectSettings.fiscalization` on the fiscal-document-bearing object: the
  regulatory e-invoicing / tax-reporting pipeline through a project fiscal
  provider - a SEPARATE opt-in from invoicing, reporting-only supported,
  jurisdiction TR-first; buyer routing and typing are derived by the
  framework; marketplace payouts can be invoice-gated declaratively via the
  marketplace object's `payoutGate`), **compute-job** (declared heavy
  computation as an async job pipeline), **job-stream** (one Business API as a
  durable observable async job), **waiting-room** (metered admission queue in
  front of ONE public API), **graph-layer** (graph projection plus declarative
  traversal queries), **seed-data** (idempotent bootstrap records).
- Advanced, only when the requirements demand them: event-stream (big-load
  ingest), elastic-log, pdf-generation, oauth-flow, **load-shield** (at most
  one per service - an always-on in-process priority shedder for UNPLANNED
  overload; the waiting-room is for PLANNED stampedes), **enterprise-projection**
  (mirrors one data object onto an SAP/Salesforce object declared in the
  project's enterprise hub).

**Two kinds of pattern.** SERVICE-level patterns are blocks on the service
("this service HAS X"): bucket, realtime, event-subscription, edge-controller,
shopping-cart, content-model, video-room, compute-job, job-stream,
waiting-room, seed-data, event-stream, elastic-log, pdf-generation,
oauth-flow, load-shield. OBJECT-level patterns decorate ONE data object ("this
OBJECT GAINS X"): payment, membership, ledger, invoicing, fiscalization,
moderation, enterprise-projection - their arrangement must name the object
they attach to. graph-layer spans both (service-level queries plus a
per-object projection).

## Patterns that absorb whole services (decomposition-critical)

These declarations GENERATE what would naively be a separate service. NEVER
create a dedicated service for them - place the pattern on the service that
owns the data:

- **payment** - checkout, subscription or marketplace configuration ON the
  order object generates payment records, start/callback APIs and the webhook
  router. The service that owns the order IS the payment service.
- **shopping-cart** - one configuration generates the cart, cart item and
  (with dynamic promotions) campaign-store objects and the basket-to-order
  checkout flow; a coupon is a campaign row, not an object of its own.
- **realtime** - hubs (rooms, presence, persisted messages) are a feature of a
  service; never a websocket gateway or chat service.
- **content-model** - declared content types synthesize a full CMS surface;
  never a CMS service.
- **video-room** - binds a meeting, lesson or event object to a provider media
  plane with join auth, recording and AI transcription; never a
  video-conference backend.
- **compute-job / job-stream** - declared heavy work becomes an async job
  pipeline (submit, queue, worker, progress stream, result); never a worker
  service.
- **waiting-room** - admission control for planned stampedes; never a queue
  service.
- **graph-layer** - graph queries and recommendations on the owning service;
  never a graph service.
- **bucket** - file storage with generated routes; never a file service.
- **ledger** - never a points, wallet, credits, stock or payout-balance
  service, and never hand-designed lot, movement or balance objects.
- **invoicing** - never an invoicing or billing service, and never
  hand-designed invoice, credit-note, numbering or invoice-payment objects.
- **fiscalization** - never a fiscalization service, and never hand-designed
  fiscal document objects, signing flows or submission plumbing.
- **moderation** - `objectModeration` on the object that carries the content
  is THE default answer to "this project needs moderation"; a standalone
  moderation service is the EXCEPTION, justified only by an edge case the
  pattern does not cover (never a peer design choice). What a hand-built
  central service costs and the pattern does not: 9 hand-spelled intake Kafka
  topics where one typo is a silently dead router; a `subjectService`/
  `subjectKind` enum closed over every producer, so each new object is a
  multi-service enum change; an M2M verdict-callback contract (rounds, 409s,
  escalation) every project re-derives; outcome payload keys 5+ consumers
  must read exactly. Under the pattern none of that is designer-authored:
  snapshots stage per owning service (`sys_<X>ModerationReview`), and what
  stays central is config (`decisionProvidersSettings`), the `escalateTo`
  analysis agent and a BFF queue/audit view - never a service holding copied
  content.

**Kafka eventing is implicit.** Any Business API with `raiseApiEvent: true`
publishes its outcome on a DERIVED topic (see `procedures/design/canon/event-envelope.md`,
"Topic strings"). The field defaults to `false` (patterns 1.93.0): every
api a consumer listens to sets `raiseApiEvent: true` explicitly, and reads
(get / list) leave it off unless a consumer needs them. Row events
(`-dbevent-` and `elastic-index-` topics) publish for every object by
default; an internal object nothing consumes (a log table) may set
`objectSettings.basicSettings.publishDbEvents: false`, which validation
refuses on any object a view, hub, subscription or notification reads. **Consuming another service's events is NOT a pattern**: it
is a Business API whose trigger is kafka (`trigger: kafka <exact topic>` in
the spec's API list). Never declare event-subscription for it - that pattern
is the frontend stream above, and it applies nothing service-side.

## Platform services (each designed by its OWN spec - never embedded in a domain service)

- **notifications** - the delivery engine: event-triggered, templated, per
  channel via project-settings providers. Channels are email, sms, push,
  whatsapp, telegram AND `inApp` - a per-user PERSISTED in-app notification
  store (the bell / notice center) with read/unread state and list/mark-read
  APIs, materialized by the notification service. An in-app notification
  store is a BUILT-IN capability, not an open question: never create a domain
  notification object or a notification service for it. Services only DECLARE
  needs; the notification-definitions document designs them.
- **bff** - cross-service read views (DataViews, aggregates, stats). Services
  only DECLARE view needs; cross-service reporting lives here. How a view is
  read: `procedures/design/canon/dataview-access.md`.
- **AI has TWO homes - choose by whether the AI must DO things or just THINK
  once about its input:**
  - **In-service `AiCallAction` (no agent - the default for simple semantic
    work).** A one-shot, tool-free, stateless transform (classify, extract,
    summarize, score, rewrite) whose result the SAME Business API consumes: a
    direct prompt-to-provider call inside the API workflow. It is a workflow
    action, not an AI agent - no agent object exists anywhere. Prefer it for
    single-shot semantic work.
  - **agent-hub (agentic AI only).** For AI that must DO things - use tools,
    read another service's live state, reason over multiple steps,
    collaborate with other agents, or improve over a feedback loop. Exactly
    TWO integration patterns:
    - **event (service out of the loop):** a service API with
      `raiseApiEvent: true` publishes; the hub agent's kafka controller
      consumes the derived topic; the agent DELIVERS ITS RESULT BY CALLING a
      designated M2M Business API on the service as a tool. An agent cannot
      publish Kafka events - there is no response topic.
    - **call (service waits):** the Business API embeds `agentCallActions` and
      uses the result in its next steps.
    - Prefer **event**: it decouples the service from AI latency and
      availability. Choose **call** only when the business logic cannot
      proceed without the AI result inside the same request.
  - **Litmus test:** a single semantic verdict on the input at hand (an
    eligibility check, a classification, a score) is an `AiCallAction`;
    genuine agentic work is agent-hub. **Content moderation on a write is
    NEITHER of these - it is `objectModeration`** (above), whose verdict
    comes from the bound decision provider, not a hand-written AiCallAction;
    the two AI homes still apply to the pattern's OWN `escalateTo` analysis
    step (a `call`-pattern agent-hub agent that writes the human-readable
    reason) and to any other one-shot AI need the project has.

## Cross-cutting contract (how layers learn about each other)

Every service spec DECLARES its needs in structured sections -
`## Notification Needs`, `## BFF DataView Needs`, `## AI Agent Needs` - and
the platform specs EXTRACT them. A need not declared in a service spec does
not exist downstream.
