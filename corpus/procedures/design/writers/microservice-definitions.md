# Writer guide: microservice-definitions

The keystone spec: which domain services the project has, what each owns, how
they talk, which distributed flows (sagas) cross them, and which agentic AI
the system needs. Every service spec, every blueprint and every event flow
inherits the boundaries, ownership, contracts and sagas set here, and the most
expensive mistakes are the ones only a re-decomposition can fix. So this is a
JUDGMENT task: reason about the whole system at once and make it coherent.
Where a trade-off is real (a boundary that could go either way, choreography
vs a synchronous dependency, one saga or two), decide deliberately and state
the one-line reason.

The canon files below are either framework facts you cannot derive (envelope
shapes, topic naming) or failure lessons of earlier projects. Treat them as
constraints and spend your judgment on the decomposition and the cross-service
coherence. Get the dependency map and the contracts RIGHT, and say what you
deliberately leave loose for the service specs to refine.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-description-report`, `prd`, `use-cases`,
  `project-basic-setup` (read its `## Flags` - above all `expectedTraffic` and
  `tenancyModel` - and its roles).
- Supplementary: the project codename (the blueprint's `codename`) - every
  topic string is prefixed with it, lowercased.
- Canon: `procedures/design/canon/capability-map.md`,
  `procedures/design/canon/event-envelope.md`, `procedures/design/canon/roles.md`,
  `procedures/design/canon/provider-shipped-state.md`.
- Reference: `procedures/patterns-catalog.md` (what each pattern absorbs; the
  big-load family) and the pattern pages `openappl/spec/<Pattern>.md` for exact names.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `microservice-definitions` in
`procedures/design/pipeline.json`; write each exactly as given.

- `## Overview`
- `## Traffic & Scalability`
- `## Services`
- `## Sagas`
- `## Event Contracts`
- `## AI Agents`

Beyond the heading list, the document is structurally checked: `## Services`
must hold a `json`-fenced array of `{ "name": ... }` objects (readiness and
the service-spec fan-out parse it; a prose-only roster breaks every later
stage), and `## Event Contracts` must be a markdown table. `## Sagas` and
`## AI Agents` carry `- (none)` when the project has no saga or no agent
hub.

## Document skeleton

````markdown
# Microservice Definitions

## Overview
<short narrative of the service decomposition>

## Traffic & Scalability
<the expectedTraffic tier (as read from project-basic-setup ## Flags), the
service-count budget it implies, and - for bigLoad - WHICH services carry
which big-load patterns and why>

## Services
```json
[
  {
    "name": "order",
    "content": "Responsibilities: ...\nData objects: Order, OrderItem\nInter-service: references catalog:Product.\npatterns: payment (Order is the order object), shopping-cart"
  }
]
```

## Sagas
### saga: <name>
...

## Event Contracts
| Producer (service.api) | Topic | Emission | Payload keys | Consumer | Outcome applier |
|---|---|---|---|---|---|

## AI Agents
| Agent | Responsibility | Trigger | Tool services | Delivery | Modality |
|---|---|---|---|---|---|
````

## Decomposition

Draw the boundaries from domain cohesion, pattern absorption and the traffic
tier - never from a fixed service count.

**Absorb-patterns rule.** Before adding a service, check the capability map's
"Patterns that absorb whole services": payment, carts, realtime, CMS-style
content, video, background compute, waiting rooms, graphs and file storage are
PATTERNS on the data-owning service, never services of their own. Big-load
capacity lands as patterns on the right owners (event-stream with its hot,
cold and analytics stores, elastic-log, waiting-room with load-shield,
compute-job and job-stream).

**Boundary heuristics:**

- **Data that changes together lives together.** Objects mutated in the same
  business transaction belong to one service.
- **A boundary is wrong when it forces chatty synchronous calls or a
  cross-service transaction.** If two candidate services would call each
  other on most requests, or commit together, merge them.
- **Cross-service reads are cheap; cross-service writes are expensive.** Reads
  are served by static joins (replicated to the search store) and BFF views -
  never a reason to merge services. Writes have exactly ONE owner per data
  object; every other service raises events for the owner to apply.
- **Three mechanisms, in preference order** - name the one each cross-service
  dependency uses (in the service's `Inter-service:` line and, for event flows,
  in the Event Contracts table):
  1. **Event** (the default, for division of labor): the owner raises the
     event, the reactor consumes and applies.
  2. **Remote fetch** (`fetchObjectAction` from the shared read model) to read
     a sibling's DATA mid-workflow - stale-tolerant reads only.
  3. **Synchronous interservice call** - LAST resort, only when a service needs
     a sibling to PERFORM an action and use its result in the SAME request (or
     a strong-consistency transaction). A data read or a fire-and-forget
     action as a sync call is the distributed-monolith smell; split a would-be
     sync action into event halves whenever no synchronous response is owed.
- **A domain with its own queue, audit trail and admin decision surface is a
  SERVICE, not a pattern.** The absorb-patterns rule is about pattern-shaped
  concerns; it does not mean collapsing whole domains into one service.

**Traffic-tier budget.** Read `expectedTraffic` from project-basic-setup
`## Flags` - never re-ask it, never infer a different tier (if it is genuinely
absent, proceed as `medium` and say so in `## Traffic & Scalability`):

| expectedTraffic | Custom-service target | Big-load pattern family |
|---|---|---|
| low | about 2 (merge cohesive domains up to the size cap) | no |
| medium | about 4 | no |
| high | one service per domain | no |
| bigLoad | one service per domain | yes - assign per service in `## Traffic & Scalability` |

Targets are budgets, not quotas; two rules override them at EVERY tier:

- **The size guardrail overrides upward:** a service that would exceed about
  20 Business APIs or about 5 data objects is split, even at `low`. One
  oversized service makes its blueprint too large to author reliably.
- **The absorb-patterns rule overrides downward:** never pad the count with
  pattern-shaped services, even at `high` or `bigLoad`.

**`## Services` rules:**

- camelCase names, no "Service" suffix.
- No auth, user, role, tenant, bff, reporting, dashboard, notification or
  payment service - those are platform-level or patterns. Decompose only the
  DOMAIN. The BFF service (historical name `bff`) is the DataView host: it
  declares and maintains cross-service read models; ordinary services'
  business APIs serve them. It is never a frontend-facing service and never
  a candidate boundary here.
- Data-object names are globally unique across services; cross-service
  objects are referenced as `serviceName:ObjectName`.
- Each `content` states the responsibilities, the data objects, the
  inter-service contracts (with their mechanism) and a `patterns:` line - the
  candidate patterns this decomposition implies for the service (advisory
  input to the service spec's `## Required Patterns`, which makes the final
  declaration). For `bigLoad` projects the affected services' `patterns:`
  lines name the big-load patterns assigned in `## Traffic & Scalability`.
  Write `patterns: (none)` when none apply.
- A saga that changes an auth-owned role declares it as a NEED for a scoped
  M2M auth API (roles canon), never a generic role setter.

## Sagas - name every multi-step distributed flow

A saga is a business flow whose labor is distributed across services and
time: no single API owns it, so it needs a NAMED owner here for bookkeeping
and verification. It does not change generated code - each actor stays purely
choreographic - it is the design's view over that choreography, so later
stages design their part against the whole.

Name a saga for every flow that crosses **at least two services AND at least
two steps**, or that has a pending/waiting state or a compensation leg. A
one-hop event (produce, one consumer applies, done) is not a saga - leave it
a plain Event Contracts row. One H3 per saga, `### saga: <name>`:

- **Trigger** - the user action or API that starts it.
- **Participants** - each service and its role in this flow.
- **Steps** - the ordered happy path until the flow closes; each step names
  its hop mechanism: `<from service.api> --<event|fetch|call>--> <to
  service.api> (effect)`.
- **Discipline** (the saga OWNS these; every participating API honors them):
  the single idempotency-key scheme used across ALL steps (a
  `(contentId+op+round)` form); each PENDING state and the timeout sweeper
  that unsticks it; the ordering guard (version or round); and compensation
  or convergence.
- **Branches / failure legs** - appeal, escalate, timeout - as sub-flows.

No multi-step distributed flow: `## Sagas` with `- (none)`. The sagas are the
plan and the Event Contracts table is its wiring - they must agree, and every
event flow either names its saga or is standalone.

## Event Contracts - every cross-service event flow

One row per cross-service event flow the design depends on; this is the
loop-closure contract every later document implements and is checked
against. Columns: `Producer (service.api) | Topic | Emission | Payload keys |
Consumer | Outcome applier`.

- **Emission** is `derived` or `explicit` (event-envelope canon section 2); a
  row promising keys the produced record does not carry is `explicit`, and a
  topic never mixes the two.
- **Topic** follows the event-envelope canon section 3: derived, lowercase,
  prefixed with the lowercased codename; for a non-CRUD-named producer API,
  write the API name beside the topic and treat the string as an estimate.
  The consumer subscribes to the producer's string byte for byte.
- **Every row has a real consumer** (an event notification, a subscription, a
  hub agent, a kafka-triggered API); a publish kept for a future or external
  consumer says so in the row. A topic cycle names the saga that owns it and
  the condition that terminates it.
- **Payload keys** are BARE keys in backticks (`` `status` ``,
  `` `contentCreatorUserId` ``); the consumer column names the SURFACE, and
  the implementing stage applies the prefix per the envelope canon. Rows whose
  consumers need IDENTITY fields - ownership, appeal rights, notification
  targeting - name those keys, and the producer carries them on EVERY path
  that emits the topic, including AI and automated paths with no user session
  (the producer looks the owner up and stamps it). Consumers, notification
  targets and agent data mappings may only reference keys named here.
- **Value vocabulary:** for every enum-like payload key (decision, outcome,
  status, contentType) declare the COMPLETE value set next to the key
  (`decision in {auto_approve, auto_reject, escalate, admin_approve,
  admin_reject}`). Every producer emits only these values; every consumer
  accepts all of them. One dialect per project.
- **Role audiences need no ids in the payload.** A row whose audience is a
  whole role (all admins, all moderators) names that role in the consumer
  cell: the notification layer fans out to a role audience itself. Only a
  data-dependent subset (the admins of one organization, a content's
  followers) needs its ids stamped into the payload by the producer. Never
  route an admin notice through the event's user or owner fields (that
  delivers it to the moderated user).
- **Media URLs:** a payload key named `...Url` / `...Urls` carries fetchable
  signed or storage URLs, never file or record ids.
- **The applier cell names the mechanism exactly:** `kafka:
  <consumerService>.<apiName>` (a kafka-triggered Business API on the consumer
  that mutates the target object) or `interserviceCall:
  <producerService>.<apiName> -> <consumerService>.<apiName>`. A websocket
  event subscription is a UI stream, never an applier; vague cells ("service
  handles it") are invalid.
- **Shared-topic consumers skip, never error:** when one topic carries several
  content types or decision kinds, each consumer filters with condition guards
  that SKIP foreign events (a validation error as a filter faults the consumer
  on every foreign event). Note it in the consumer cell.
- **Follower fan-out needs ONE named mechanism:** if followers are notified,
  the row names how their ids reach the message (e.g. `interserviceCall:
  project.publishPhase -> social.getFollowerIds (stamps followerUserIds[] into
  the payload)`).
- **Moderation is `objectModeration` on the owning object, not an event
  pipeline.** The default for "this object's writes need moderation" is the
  pattern's own staged-write + decision-provider + reviewer-surface machinery
  (`procedures/design/canon/capability-map.md`, "moderation") - it needs NO intake
  topic, NO outcome-application topic, and NO Event Contracts row at all: the
  decision happens synchronously inside the create/update request, through
  `DecisionProviderRegistry`, not through Kafka. The only Event Contracts
  entries it ever needs are the reason-writer's: when `wantReason` is set, a
  reject/review verdict calls the `escalateTo` agent-hub agent in `call`
  pattern (no topic, no M2M callback - the api waits for the analysis
  in-request-adjacent, see `agent-hub-spec.md`). Name the moderated object and
  its `policy` in the service spec; do NOT add an intake/outcome row for it.
  **The exception** - a standalone moderation service with its own
  intake/outcome rows - is justified only for a need the pattern cannot
  cover: moderating something that is not a DataObject write at all (a live
  video/audio stream, a third-party feed with no owning service), or a single
  review surface spanning many unrelated object kinds beyond what a BFF
  queue/audit view can aggregate. State which exception applies; "the team is
  used to a central moderation service" is not one. If media is moderated (in
  either the pattern or the exception), the row/escalation target names a
  multimodal agent and carries the media URL; otherwise it states
  `text-only moderation`.
- **Appeals** (when in scope): an appeal-resolution API updates the appeal
  status, and the table has appeal rows in both directions (submitted ->
  admins; outcome -> appellant).
- **Async discipline** for every flow whose consumer MUTATES state, declared
  once per saga (a one-hop flow names it in its applier cell):
  deterministic idempotency keys `(contentId + operation + round/version)` -
  never time- or random-based, never the id alone, rotated on a new round;
  dedup plus a state guard on apply (apply only in the expected state;
  duplicates and foreign-state events skip); an ordering guard (a stale
  redelivery never overwrites newer state); a timeout owner (a cron sweeper)
  for every pending state; compensation or convergence, stated.

## AI Agents - the system-level draft roster

Sketch the agentic AI at system level HERE, so the AI architecture shapes the
services top-down. The roster is a DRAFT: the service specs refine it for their
own needs and the agent-hub spec reconciles the final roster; each change
there carries a one-line rationale. `## AI Agents` with `- (none)` when the
project has no agent hub (`hasAgentHub: false`).

List ONLY genuinely agentic agents - AI that must DO things: call tools or
other services' APIs, read live cross-service state, reason over several
steps, collaborate, or improve over a feedback loop. A one-shot, tool-free
semantic call (classify, extract, summarize one input the API holds) is an
in-service `AiCallAction` owned by that Business API, not an agent - do not
list it. One row per agent:

- **Trigger** - `event: <producer.api -> topic>` (autonomous; preferred) or
  `call: <service.api>` (synchronous; the API waits for the result).
- **Tool services** - the OTHER services whose M2M APIs the agent calls as
  tools; naming them is a contract that those services expose those APIs as
  M2M. `(none)` when the trigger payload suffices.
- **Delivery** - for event triggers, the M2M callback Business API on the
  owning service the agent calls with its result; for call triggers,
  `in-workflow return`.
- **Modality** - `text` or `vision` (vision when it reads image or media
  URLs).
- Unify overlapping needs into one shared agent rather than near-duplicates.

## Completeness check

- `## Services` holds a parseable `json` array; every entry has `name`,
  `content` with responsibilities, data objects, inter-service line and
  `patterns:` line.
- The service count follows the tier budget and both overrides; no
  pattern-shaped or platform-level service.
- Every multi-step distributed flow is a named saga whose steps agree with the
  Event Contracts rows.
- Every Event Contracts row: lowercase codename-prefixed topic, emission,
  bare payload keys with value sets, a real consumer, an exact applier.
- `## AI Agents` lists only agentic AI, or `- (none)`.

## Output

Write the document to `design/microservice-definitions.md` (writer contract
section 4). Carrying the service plan into the blueprint's
`projectSettings.servicePlan` is a later blueprint step, not the writer's
job.
