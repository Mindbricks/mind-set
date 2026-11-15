---
title: Object content moderation
---

# Object content moderation

A first-class **staged-write moderation** pattern. Decorate ANY DataObject
with `objectSettings.objectModeration.enabled: true` and the generated service stages
that object's create/update writes behind a decision provider, an injected
review queue and a reviewer surface - no object is too specialized for this,
and it is not limited to the content layer: a listing, a profile edit, a
support reply, an event are all equally valid hosts.

**The core decision: the real object never carries a moderation status and
never shows unapproved data.** An insert or update on a moderated object
lands as a JSON snapshot in an injected system object with status `pending`;
the real row is only created or updated when the snapshot is accepted. While
an update is pending, the real row keeps serving the previously approved
state; a pending insert has no real row at all. Content moderation, not an
authorization gate - the verdict never feeds a `permissionCheck`.

**Also searchable as:** objectModeration, ObjectModeration, content moderation, staged writes,
review queue, moderation queue, automatic moderation, pre-publication review.

This guide is the sibling of [The decision layer](decision-layer.md): the decision layer is the
general-purpose family (a provider you configure once, a [`DecisionAction`](../../spec/DecisionAction.md)
you place in a workflow); object content moderation is the ready-made application of that family to
"may this write be published". How the two relate, and what the provider measurements do and do not
support, is in [Relation to the decision family](#relation-to-the-decision-family).

> **Reference:** [`ObjectModeration`](../../spec/ObjectModeration.md) ·
> [`ContentModeration`](../../spec/ContentModeration.md) ·
> [`PropRefer`](../../spec/PropRefer.md) ·
> [`DecisionProvider`](../../spec/DecisionProvider.md) ·
> [`DecisionCapabilities`](../../spec/DecisionCapabilities.md) ·
> [`DecisionProviderConfig`](../../spec/DecisionProviderConfig.md)

## This is THE default answer to "this project needs moderation"

When a project needs to moderate user-submitted content, reach for
`objectModeration` on the owning object first. A standalone, hand-authored
moderation service is the EXCEPTION, justified only by an edge case the
pattern does not cover - never a peer design choice.

What a hand-built central moderation service costs, that the pattern
eliminates entirely:

- several hand-spelled intake Kafka topics, one per producer, where a single
  misspelling is a silently dead router;
- a `subjectService`/`subjectKind` enum closed over every producing service,
  so every new moderated object is a multi-service enum change;
- an M2M verdict-callback contract (rounds, 409s, escalation rules) that
  every project has to re-derive from scratch;
- outcome payload keys that every consumer must read exactly, with no
  compiler or validator checking the agreement.

Under the pattern, none of that is author-written: snapshots stage per
owning service (`sys_<X>ModerationReview`), and what stays central is
configuration (`projectSettings.decisionProvidersSettings`), the
`escalateTo` reason-writing agent, and - when a cross-service queue view is
genuinely needed - a BFF DataView over the per-service review tables, never
a service that holds copied content.

## Enabling it

```json
{
  "objectSettings": {
    "basicSettings": { "name": "listing" },
    "objectModeration": {
      "enabled": true,
      "mode": "staged",
      "providerName": "mainDecision",
      "policy": "Listings must describe a real item for sale; no contact details, no offensive language.",
      "confidenceThreshold": 0.8,
      "moderatedProperties": ["title", "description", "price"],
      "reviewerRoles": ["moderator"],
      "exemptRoles": [],
      "wantReason": true,
      "escalateTo": "moderationAnalyst",
      "userMessageMode": "llm",
      "onProviderError": "failToReview"
    }
  }
}
```

`enabled: true` is the on switch; everything else defaults (see the
[`ObjectModeration`](../../spec/ObjectModeration.md) specification for every
field and its default). `providerName` must name an entry under
`projectSettings.decisionProvidersSettings.decisionProviders[]` - there is no
fallback, and an unresolvable name is a design-time error
(`OBJECT_MODERATION_PROVIDER_NOT_FOUND`). `policy` is required: it is the
plain-language instruction the verdict is judged against.

### The whole blueprint, end to end

Three pieces cooperate: the decision provider entry (project level), the
`objectModeration` block (on the object), and - only when you want written
reasons - the AI agent that writes them.

```json
{
  "projectSettings": {
    "decisionProvidersSettings": {
      "decisionProviders": [
        {
          "name": "mainDecision",
          "provider": "typesafe",
          "configuration": { "apiKey": "<decision provider API key>", "model": "jev-1.13.0" }
        }
      ]
    }
  },
  "agentHub": {
    "aiAgents": [
      {
        "agentBasics": {
          "name": "moderationAnalyst",
          "description": "Explains why a listing was held or rejected.",
          "executionMode": "task",
          "modality": "text"
        },
        "modelSettings": {
          "providerName": "mainOpenai",
          "model": "gpt-4o-mini",
          "systemPrompt": "You receive a submitted listing, the moderation verdict and the policy. Explain to a moderator which part of the policy the listing breaks, and write one polite sentence for its author."
        }
      }
    ]
  },
  "services": [
    {
      "serviceSettings": { "serviceBasics": { "name": "market" } },
      "dataObjects": [
        {
          "objectSettings": {
            "basicSettings": { "name": "listing" },
            "objectModeration": {
              "enabled": true,
              "providerName": "mainDecision",
              "policy": "Listings must describe a real item for sale; no contact details, no offensive language.",
              "moderatedProperties": ["title", "description"],
              "reviewerRoles": ["moderator"],
              "wantReason": true,
              "escalateTo": "moderationAnalyst",
              "userMessageMode": "llm"
            }
          },
          "properties": [
            { "basicSettings": { "name": "title", "type": "String" } },
            { "basicSettings": { "name": "description", "type": "Text" } },
            { "basicSettings": { "name": "soldCount", "type": "Integer" } }
          ]
        }
      ]
    }
  ]
}
```

Every create and update api the `market` service declares on `listing`
is now moderated; nothing in the api definitions changes. The agent's
provider (`mainOpenai` above) is an ordinary `aiProvidersSettings` entry. For local work with no
key, declare the provider entry with `"provider": "mock"` (see
[A missing key never decides](#a-missing-key-never-decides)
for what the mock may decide where).

### The pieces

| Piece | Where | What it is |
|---|---|---|
| [`ObjectModeration`](../../spec/ObjectModeration.md) | `objectSettings.objectModeration` | the block itself; inert until `enabled: true` |
| [`PropRefer`](../../spec/PropRefer.md) | each `moderatedProperties` entry | a property of the same object, optionally `property:alias` (the alias is ignored) |
| `ObjectModerationMode` | `mode` | `staged` (default) or `onPlace` - [where the write lands](#mode-staged-vs-mode-onplace) |
| `ObjectModerationProviderErrorPolicy` | `onProviderError` | `failToReview` (default) or `failToReject` |
| `ObjectModerationUserMessageMode` | `userMessageMode` | `generic` (default) or `llm` |
| [`DecisionProvider`](../../spec/DecisionProvider.md) | `projectSettings.decisionProvidersSettings.decisionProviders[]` | the provider entry `providerName` names; its [`DecisionCapabilities`](../../spec/DecisionCapabilities.md) carry the `probabilityDriftBand` the threshold is checked against |
| an AI agent | the service's `aiAgents[]` or the agent hub | the `escalateTo` target that writes reasons ([two-tier reasons](#two-tier-reasons)) |

### Fields and defaults

| Field | Default | Notes |
|---|---|---|
| `enabled` | `false` | the on switch; a disabled block is not validated |
| `mode` | `staged` | `onPlace` only when a child needs the parent's real id |
| `providerName` | - | required; must name a declared decision provider |
| `model` | the provider entry's model | a pinned version only (`DECISION_MODEL_NOT_PINNED`) |
| `policy` | - | required; the rule the verdict is judged against |
| `confidenceThreshold` | `0.8` | in (0, 1]; below it a verdict goes to `review`; keep it out of the provider's drift band ([why](#what-the-measurements-say-and-do-not-say)) |
| `moderatedProperties` | every user-writable property | leave system-driven fields (a `soldCount`) out |
| `exemptRoles` | none | trusted authors whose writes land directly |
| `reviewerRoles` | the platform operator | who may decide held rows |
| `wantReason` / `escalateTo` | `false` / none | the reason-writing agent |
| `userMessageMode` / `genericMessage` | `generic` / "Your submission is being reviewed." | what the author is told |
| `onProviderError` | `failToReview` | a failure never publishes |
| `timeoutMs` | `5000` | one provider decision; a timeout is a provider failure |

`policy` is the plain-language rule, not a prompt: there is no system
message and no example slot. Write it the way you would brief a human
moderator in two sentences.

## The decision

The pattern asks the bound decision provider ONE fixed question: a `choice`
named `verdict` over `accept` | `reject` | `review`. There is no fourth
literal and no `escalate` value - `review` IS the escape option ("a human
should decide"), and a verdict whose confidence falls below
`confidenceThreshold` is routed there regardless of its raw value. The
decision is synchronous, inside the create/update request:

- **accept** continues to the REAL write in the same request - hooks, events
  and the 201/200 answer are exactly a direct write's, and the response also
  carries the moderation row id.
- **reject** / **review** answer **202** with
  `{ "moderation": { "id", "status", "message" } }`. Nothing is written, and
  the post-write stages and the api event do not run.
- A provider transport failure (overload, rate-limit, timeout) routes to
  `review` by default (`onProviderError: failToReview`; `failToReject` is the
  only alternative) with the failure named on the row, and never publishes
  anything.

The review row stores the decision - value, confidence, the per-option
probabilities when the provider reports them, and the pinned model version -
and **nothing ever re-derives it later**. The decision itself is
reproducible across identical requests; the reported probability is not, so
a re-derived verdict could legitimately disagree with the one already acted
on.

### What the caller sees

An accepted create answers exactly like an unmoderated one (`201` with the
record), with the moderation row's id beside it. A held or rejected write
answers `202` and writes nothing (in `staged` mode):

```text
{ "moderation": { "id": "8f0c…", "status": "review", "message": "Your submission is being reviewed." } }
```

`status` is `review` or `rejected`, and `message` is the `genericMessage` at
response time (an `llm` message is written later, see
[two-tier reasons](#two-tier-reasons)). A client must not treat a `202` as
success-with-no-body or navigate to a record that was never created. The
author follows the submission through
`listMy<X>ModerationSubmissions` (see [the injected apis](#the-injected-apis)).

### The threshold and the drift band

`confidenceThreshold` decides when the provider may act alone. The provider's
decision is reproducible across identical requests but its confidence is
not: confident answers (0.97 and up) move by 0.01 or less, mid-confidence
answers of every question type by up to 0.10. A threshold in that
mid-confidence region can send the same submission to `review` on one run
and decide it on the next. The validator warns
(`OBJECT_MODERATION_THRESHOLD_IN_DRIFT_BAND`) when the threshold lies within
the bound provider's `probabilityDriftBand` of 0.5 - 0.2 for the typesafe
brand, so any threshold strictly between 0.3 and 0.7 - the same check
[`DecisionAction`](../../spec/DecisionAction.md) makes as an error. The
band covers the three-option verdict too, whose top-option confidence lies
between 1/3 and 1. Here it is a warning because the default, `0.8`, is
outside the band and moderation routes doubt to `review` anyway; the `mock`
brand is deterministic and has no band.

## Human review

`reviewerRoles` (default: the platform operator - `admin`/`superAdmin`,
`saasAdmin` in a multi-tenant project) may decide a `review` row. The engine
refuses a reviewer deciding their own submission
(`MODERATION_SELF_DECISION`, 403) - moderation and authorship are always two
different people. `exemptRoles` (default: none) bypass the gate entirely for
trusted authors (a staff account, never "the author of their own content").
Trusted system transports (cron, internal calls) bypass the gate like every
other user-facing check. An update that touches none of the configured
`moderatedProperties` writes straight through - unset, every user-writable
property counts, so a property driven only by system logic (a sale
incrementing `soldCount`) must be left OUT of the list, or it would re-queue
the object for review on every sale. "Touched" means the request WROTE a
value for the property: a field the caller omitted (the generated update
clause carries it as `undefined`) does not count, while a value that is sent
unchanged still does - the engine judges what was written, not what changed.
A `moderatedProperties` entry may use the `property:alias` PropRefer form;
the alias is ignored on both sides (validation and runtime read the same
property name).

### Writes the moderation seam never sees

Only the object's own author-defined create/update BusinessApis (and, on a
content model's objects, the generated editorial create / update apis) run the
seam. These paths write the object WITHOUT a verdict; the validator names
the first kind, the authored CrudActions, in
`OBJECT_MODERATION_UNSTAGED_WRITE_PATH` (a warning):

- a `createCrudAction` / `updateCrudAction` / `createBulkCrudAction` /
  `upsertBulkCrudAction` in ANY api's workflow - they write through the db layer;
  in `staged` mode the row is not staged, in `onPlace` mode it lands as
  `accepted` (the column default);
- an internal `API.<createX>()` call from another api's workflow - the
  internal controller is a trusted system transport by design;
- any other compiler-generated api on the object: injected apis never run
  the seam (the content editorial create / update apis are the one exception,
  see [Content models](#content-models)), and an object written ONLY by such
  apis gets no review table and no seam at all;
- custom code, lib functions and edge functions writing the db layer directly.

Route user content through the object's own api, or accept the bypass
knowingly.

### A missing key never decides

When a decision provider's credential is missing, the generated service substitutes
a stand-in that answers every question **undecided** (see
[Every question can come back undecided](decision-layer.md#every-question-can-come-back-undecided)).
An undecided verdict is held for a human on every slot, with
`transportFailure: 'undecided:credentialMissing'` (log event
`ModerationUndecidedHeld`), whatever `onProviderError` says - nothing
failed, so `failToReject` does not apply. A service whose decision-provider key is absent
therefore fills the review queue rather than publishing or refusing
anything on its own.

A declared `"provider": "mock"` entry answers deterministically. Outside an
explicit non-production slot (the same slot test the mock directives
use: `CONFIG_ENV` and `SERVICE_CONFIG` both set, both non-prod, agreeing) its
verdict NEVER auto-accepts and never auto-rejects either: the submission is
held with `transportFailure: 'mockFallback'` (log event
`ModerationMockFallbackHeld`). On test and preview slots the declared mock
decides; `[[mock-decision verdict=undecided]]`
drives the undecided hold there.

### What a gRPC caller sees

A moderated create/update with a gRPC controller answers through the same
resource message a plain write does, plus one field: the response message of
every moderated write api declares
`ModerationOutcome moderation = 1000 { string id; string status; string message; }`
(a fixed tag far above the declaration-order numbering of the object's own
fields, so adding a property never moves it; an api without objectModeration
emits a byte-identical proto).

- **Held** (`staged`, verdict `reject` / `review`, a provider failure, the
  production mock): gRPC status `OK`, and the message carries ONLY
  `moderation` (`id` = the review row, `status` = `rejected` / `review`,
  `message` = the author-facing text); every resource field is empty, because
  nothing was written. The response's initial metadata also carries
  `x-moderation-status` and `x-moderation-id`, so a caller compiled against an
  older proto (or one that never reads the field) can still tell a hold from a
  write. This is the gRPC counterpart of REST's `202`.
- **Written** (a `staged` accept, every `onPlace` verdict): the record as for
  any write, with `moderation.id` / `moderation.status` beside it (and
  `moderation.message` for an `onPlace` reject / review). No moderation
  metadata: the write was made.

On an `onPlace` object the record's `moderationStatus` column carries the
same verdict as its label (`accepted` / `rejected` / `review`): the resource
message declares every Enum column as a `string` holding the label (see
[gRPC controllers - Enum fields](../business-apis/grpc-controllers.md#enum-fields-cross-as-their-label);
a client compiled against an older proto, which declared it `int32`, must be
regenerated).

The field rides only the protos of the moderated create / update apis; a
`get` or `list` of the same object, and every api of an unmoderated object,
keep their proto unchanged. An [`InterserviceCallAction`](../../spec/InterserviceCallAction.md)
that reaches a moderated write over gRPC loads a copy of the TARGET's proto,
`moderation` field included, so the calling workflow reads the outcome the
same way: a hold parks a response whose resource fields are empty (proto
defaults) beside `moderation`, so test `moderation.status` before using the
record. An interservice call is moderated like any other caller, machine
token or forwarded user alike; only cron and `API.*` internal calls bypass
the seam.

### Other transports

The seam runs at one point of the shared pipeline, after
the data clause is built, so every transport of a moderated create / update
meets it except the trusted ones (cron, `API.*`): a REST `202`, the gRPC
outcome above, the same `{ moderation }` body on a Kafka controller's
response topic (a `202` is not a rejection, so it is published like any
applied outcome), and on an SSE controller the `202` envelope (`events`
mode) or a `done` frame carrying `moderation` with zero chunks (`stream`
mode). Nothing is written on a hold, whatever the transport.

### Supported backends

The engine, the write seam and the read gate are generated only for the
target languages a compiler has implemented. On any other language
the block is REFUSED at design time (`OBJECT_MODERATION_LANGUAGE_UNSUPPORTED`):
that language would inject the review table and the reviewer apis and then
publish every moderated write unstaged. The supported surfaces are data
objects, realtime hubs and notification consumers; ContentModel editorial
writes are gated separately, through injected content/item writers and
reviewer replay on PostgreSQL and MongoDB. See
[the compiler specification](../../compiler/index.md) for which languages a
compiler supports.

## One pending submission per target

Staging an update SUPERSEDES every `pending`/`review`/`applyFailed` row
already open for the same target: they move to `superseded`, with
`supersededBy` pointing at the row that replaced them (an `applyFailed` row
is decidable, so leaving it open would let a reviewer re-accept stale
content over the newer approved content). Superseded rows stay in the queue's history and
are never deleted - visible, not silently dropped. An insert has no target
and never supersedes anything.

## Accept replays the author's write

Accepting a row does not write a canned copy of the snapshot: it REPLAYS the
original write through the object's own create/update api, as the author,
so every hook, event and hand-written workflow action fires exactly as it
would have on a direct write. On an update, the current row is re-fetched
first (gone means `applyFailed: targetGone`) and the pre-write access checks
re-run fail-closed against the author before the approved snapshot is
applied. Rejecting writes nothing, ever.

## Review row statuses

| Status | Meaning |
|---|---|
| `pending` | staged, the decision is still running |
| `review` | waiting for a human (a `review` verdict, a low-confidence verdict, or a provider failure) |
| `rejected` | refused, by the provider or a reviewer; nothing was written |
| `accepted` | written to the real object (`appliedAt`, and the written row's id in `targetId`) |
| `applyFailed` | accepted, but the MAIN write failed (`applyError`) - a reviewer may accept again (a retry, e.g. once a unique conflict is cleared) or reject. A failure AFTER the main write committed (a post-write stage, the output stage) is NOT this: the content is live, so the row is `accepted` with the post-write error recorded in `applyError` |
| `applying` | an accept is writing the row right now (`applyingSince`) |
| `superseded` | a newer submission for the same target replaced it |

A reviewer can accept or reject `pending`, `review` and `applyFailed` rows.
Every decision CLAIMS the row first with one conditional write, so two
reviewers accepting the same row at once replay it exactly once; the other is
answered `409`. The EXIT from a claim is conditional too (it matches the
claim that claimer made), so a slow accept whose stale claim was taken over
can no longer overwrite the taker's outcome. A reject without a
`userMessage` keeps an LLM-written author message when `userMessageMode` is
`llm`, and falls back to `genericMessage` only when there is none. The
review table's own db-level Kafka events never carry the replay blobs
(`paramsJson`, `contextJson`, `authorSessionJson`) or the `analysis`. The accept's claim (`applying`) always ends in `accepted` or
`applyFailed`; only a process that dies mid-write leaves `applying` behind,
and such a row stays in the queue and can be decided again once its
`applyingSince` is more than ten minutes old - check the target first, the
earlier attempt may have written it.

## Two-tier reasons

Reject/review reasons are optional and two-tier. With `wantReason: true`,
`escalateTo` names an AI agent (the service's own `aiAgents[]` or a hub
agent) that is called through the agent hub with
`{ snapshot, verdict, policy }` and returns a string (the analysis) or
`{ analysis, userMessage }`. The analysis is persisted on the review row and
visible to reviewer roles only; the author sees either the fixed
`genericMessage` or the agent's `userMessage`, per `userMessageMode`
(`generic` | `llm`). The escalation agent WRITES the reason - it never
re-decides the verdict.

The agent runs AFTER the response, bounded in time, so it never slows the
author's write and never changes a row's status. The `202` therefore always
carries `genericMessage`; in `llm` mode the agent's `userMessage` replaces it
on the review row when it arrives (unless a reviewer has already decided the
row), and the author reads it through `listMy<X>ModerationSubmissions`. An
agent failure leaves the row as it was - the verdict stands without a
written reason.

## `mode: staged` vs `mode: onPlace`

`staged` (the default) is the shape described above: the real row never
exists until accept. Some objects carry CHILD rows that need the parent's
REAL id before moderation can finish (an `event` whose wizard flow creates
`eventTicketType` rows against the event id) - staged mode cannot support
that by definition, because the parent is only a queue snapshot until
accepted.

`mode: onPlace` writes the real row immediately. Moderation state then lives
in an injected, compiler-managed, read-only `moderationStatus` column on the
real object (never author-defined); the review queue, decision record,
escalation analysis and the accepted-snapshot audit still live in the SAME
`sys_<X>ModerationReview` table in both modes - the modes differ only in
WHERE the write lands.

Choose `onPlace` when, and only when, a child object needs the parent's real
row id before the parent is accepted. Otherwise use `staged` - it never
exposes unapproved data, which `onPlace` can only approximate through a read
filter.

```json
{
  "objectSettings": {
    "basicSettings": { "name": "event" },
    "objectModeration": {
      "enabled": true,
      "mode": "onPlace",
      "providerName": "mainDecision",
      "policy": "Events must describe a real, lawful gathering with a date and a place; no contact details in the description.",
      "moderatedProperties": ["title", "description"],
      "reviewerRoles": ["moderator"]
    }
  }
}
```

The wizard that creates `eventTicketType` rows against the new event's id
keeps working: the event row exists from the first request, hidden from
everyone but its author and the privileged readers until it is accepted.

### What onPlace injects on the host object

| Column | Type | Who writes it |
|---|---|---|
| `moderationStatus` | Enum `pending` \| `accepted` \| `rejected` \| `review`, default `accepted` | the moderation engine only |
| `moderationAuthorId` | ID, filled from the session (`userId`) on create - injected only when the object declares no owner field (`sessionSettings.isOwnerField`) | the create pipeline, from the session |

Both are read-only through every normal api: `moderationStatus` is never a
request parameter and is dropped from every update's write set; an authored
property of either name is refused (`OBJECT_MODERATION_STATUS_COLUMN_TAKEN`),
and a create/update api that binds a request parameter or writes a
`dataClauseItems` entry under either name is refused too
(`OBJECT_MODERATION_MANAGED_COLUMN_WRITTEN`). The author column is NOT an
owner field - it arms no ownership check; moderation is content policy, not
authorization.

The column's default is `accepted` on purpose: a write the engine does not
moderate - a trusted system transport, an `exemptRoles` caller, an authored
db-layer action (`createCrudAction` / `updateCrudAction`), and every row that
existed before the column was added to a live table - is by definition
published, exactly as a bypassed staged write reaches the real row. On
MongoDB a pre-existing document carries NO value and matches
nothing until backfilled: adopting `onPlace` on a populated Mongo collection
needs a one-off `moderationStatus = 'accepted'` backfill.

### The onPlace write

The gate is the staged gate: trusted transports and `exemptRoles` write
through untouched, and an update that touches none of the
`moderatedProperties` (a `soldCount` bumped by a sale) writes through and
NEVER changes `moderationStatus`. A moderated create, or an update that
touches a moderated property on an approved row, is decided synchronously
and the ONE write carries the verdict: `accept` → `accepted`, `reject` →
`rejected`, `review` / low confidence / provider failure → `review`
(`failToReject` → `rejected`). This is a revert-to-pending,
decided synchronously: an edit to approved content re-decides it in the same
request, and unless the new verdict is accept the row leaves public view
until a reviewer accepts it - the row can never stay public on a moderated
edit without a fresh verdict. `pending` itself is never observed on the real
row (it is reserved for an asynchronous decision path). The response is
the normal 201/200 with the real row, plus
`moderation: { id, status, message? }` (the message rides a rejected or
review verdict). A `review` or `rejected` row EXISTS, hidden by the read gate
below, so a public page genuinely shows fewer items right after an edit than
before it.

The engine-owned verdict is written with the content edit; caller-supplied
status and author claims remain protected. A `fetchStatsAction` conjoins
target moderation visibility with authored and tenant conditions before
local, remote or bucketed aggregation, so a hidden parent counts zero for
non-privileged callers who are not its author.

Human accept on an onPlace review row flips the real row's
`moderationStatus` to `accepted` through the host's own db-layer update - so
db events, the Elasticsearch projection and graph projections see it - and
records the decision; reject flips it to `rejected`. It is a claim plus a
status flip, never a replay: the content is already on the row. The
accepted-snapshot audit is the review row's `dataJson`, the data clause as
submitted. A newer MODERATED update supersedes the older rows, so an
accepted row's moderated properties are exactly what the reviewer saw -
with the exceptions the seam never sees: a write by an `exemptRoles` caller
or a trusted system transport, an authored CrudAction, or a direct db-layer
write can change the content after the snapshot without opening a review
row, and an accept then flips the status over content nobody reviewed.
Keep those paths off moderated properties, or re-moderate through the
object's own api. A
row whose insert is still being written (no `targetId` yet) answers `409`;
a vanished target or a failed flip leaves `applyFailed` (`422`), decidable
again.

### The onPlace read gate

Every generated read of the object's rows that the generated service controls gains
an automatic visibility gate for NON-PRIVILEGED callers:
`moderationStatus = accepted`, OR the row's author is the caller (the author
sees their own `pending` / `review` / `rejected` rows). Privileged = the
object's `reviewerRoles` (with `admin` respelled to `saasAdmin` in a
multi-tenant project), the roles the service treats as automatically
absolute (`superAdmin`, and `tenantOwner` where the tenant filter rides), and
trusted system transports (cron, internal calls). Author-defined
`absoluteRoles` are NOT privileged here. An unapproved row appearing in an
anonymous or other-user list is a defect, not a nice-to-have.

Gated - every one of these runs with the calling request's identity and
the same predicate (one rule, several readers):

- the object's own `list`, `get`, `update` and `delete` apis - the term is
  conjoined onto the raw MQuery exactly where the tenant term is, so it
  lowers to SQL, Mongo and a `dataViewName` (Elasticsearch) read alike; an
  id-addressed `get` resolves its row by query so it cannot read past the
  gate, and an update or delete fetches its instance through the same query,
  so a non-privileged caller who is not the author meets a 404 on a hidden
  row (a public counter api cannot hand out a `review` row's content);
- `selectJoins` that embed the object's rows in another api's response (local
  and remote): a row the caller may not see is dropped from the join;
- the `/geo/<object>/<field>/*` quartet: non-privileged callers see
  `accepted` rows only - the author's-own-rows arm is NOT on the map
  surface, so the author's own pending rows are hidden there too; the author
  reads them through the list api;
- a `jointFilters` entry of ANOTHER object's list that narrows by the object:
  the term is conjoined onto the id pre-selection query, so a hidden row can
  no longer be probed through the other object's rows; a `membershipFilters`
  entry whose `dataObjectName` is the
  object: the collected ids are narrowed through one gated read of the
  object, so a hidden row never scopes the list;
- author-defined read actions targeting the object from any api, in any
  service: `fetchObjectAction`, `fetchStatsAction` (the aggregate runs over
  the rows the caller may see) and `fetchParentAction` (a gated parent is
  resolved by query, never by a bare id read) conjoin the term onto their
  MQuery, on the local db-layer and on the remote Elasticsearch projection
  alike; `searchObjectAction` and `fetchFromElasticAction` wrap their raw ES
  body in a non-scoring `bool.filter` (and `knn.filter`) built from the same
  predicate;
- the object's recommendation lists (`recommendationSettings`, the
  `/<items>/recommendations/<list>` and `/<items>/:<item>Id/recommendations/<list>`
  routes): every candidate is hydrated
  through the same term with the calling session, so a list (and its
  anchor) serves exactly the rows the object's own `get` would serve to that
  caller;
- a `staticJoin` whose `jointSource` is the object (the main create's join
  and a `createCrudAction`'s fill alike): the source row is read through the
  gate with the CREATING caller's identity, and a row they may not see joins
  as absent - the property stays unset and `staticJoin.defaultValue`, when
  declared, fills it - exactly as a missing source row does. What this
  cannot close is a creator who may SEE the hidden source (its author, a
  reviewer or operator, a trusted cron or internal transport) copying its
  content onto a child that is itself unmoderated and public; see the warned
  residue below;
- a BFF `DataView` over the object: a view whose `mainObject` is the object
  carries `moderationStatus` and the author column in its projection
  AUTOMATICALLY (added to an authored `properties` list, like the tenant
  column; a whole-source projection has them anyway), so the consuming api's
  query-side gate always has its columns; a view `aggregate` whose child is
  the object projects the two columns into the embedded rows, and the
  consuming api (`apiOptions.dataViewName`, stored or read-time) drops the
  embedded rows the caller may not see - a one-to-many aggregate keeps its
  accepted (plus own) rows, a single embedded row the caller may not see is
  unset, the shape the aggregator leaves when no child matched. A single
  (`oneToMany: false`) aggregate over the object embeds the first ACCEPTED
  candidate when there is one, so a hidden first hit never masks an accepted
  sibling; only when no candidate is accepted does the first hit stand (seen
  by its author and privileged readers, dropped for everyone else).
  Privilege on every one of these cross-object reads follows the TARGET
  object's tenancy: `tenantOwner` is privileged only on a read that pins a
  tenant-level target's tenant column (a fetch / stats / parent action's own
  tenant pin), never because the READING api happens to be tenant-scoped - a
  select join, a filter pre-selection, a staticJoin copy and embedded view
  rows pin nothing, so there `tenantOwner` reads the accepted-or-own set like
  any other role.

REFUSED at design time:

- a view `stat` whose `childObject` is the object
  (`OBJECT_MODERATION_UNGATEABLE_VIEW_STAT`): a stat is a number computed when
  the view document is indexed, with no caller, so it would count hidden rows
  for everyone and nothing at the reading side can filter a number per row.
  A caller-gated count is a `fetchStatsAction` on the consuming api;
- declared graph and enterprise projections of the object
  (`OBJECT_MODERATION_UNGATEABLE_PROJECTION`): the projection side carries no
  moderation columns, so a `graphQueryAction` or enterprise read cannot be
  gated there. Remove the projection block, or use `mode: staged`. Graph
  projection activates by block presence; enterprise projection declares its
  model/object references. Neither schema has an `enabled` switch;
- a detected `global` aggregation in a `fetchFromElasticAction` body over
  the object (`OBJECT_MODERATION_UNGATEABLE_GLOBAL_AGGREGATION`): Elasticsearch
  runs its bucket over the whole index, ignoring the gated query. Remove the
  global bucket and aggregate within the caller-gated query, use a
  `fetchStatsAction`, or use `mode: staged`. The validator parses the static
  object body and its `aggs` / `aggregations` trees, including nested buckets
  and `js` source wrappers. A query property or bucket name called `global`,
  metadata, comments and script strings are not global aggregation operators.
  A later opaque spread or unknown computed key can make an earlier static
  global uncertain. In that case `OBJECT_MODERATION_UNCERTAIN_GLOBAL_AGGREGATION`
  warns that the operator may survive, naming the action body; it does not
  claim that the resulting request definitely contains it. A final static
  replacement that proves removal stays clean. Undefined-valued operators
  (including inline `void 0`) are omitted by JSON and are not refused.
  Fully opaque dynamic bodies are outside this static check; it does not
  execute authored MScript.

NOT gated - the validator WARNS with `OBJECT_MODERATION_UNGATED_READ_PATH`,
naming each surface (this list is exactly what the validator detects), and
the author accepts the exposure knowingly or removes the surface:

- an internal-call controller on the object's own `get` / `list`: `API.*`
  is a trusted transport (privileged by design), and relaying its result to
  a public caller is the relaying api's - the author's - responsibility;
- the `staticJoin` residue: the copy is gated with the creating caller's
  identity, but a creator who may see the hidden source - its author, a
  reviewer or the platform operator, a trusted cron or internal transport -
  still copies it, so the public child row carries the parent's `review` /
  `rejected` title (the event-wizard case). The remedy the warning names is
  enabling `objectModeration` on the child too.

Documented, NOT detected by the validator:

- Kafka db events: a consumer receives every row, unapproved ones included -
  events are a system channel, not a read path. The `moderationStatus`
  column IS in the payload, so a consumer filters on it;
- notifications: an event notification rendered from an onPlace object's
  event payload, or from a DataView document over it, delivers the row's
  content to its recipients whatever its status - the notification service
  renders a system channel, it does not read through a caller's gate;
- a moderated MEMBERSHIP object (an onPlace object that is itself the
  `membershipObjectName` of another object): membership filters and
  membership checks read its rows as an authorization scope, not as content,
  and a hidden membership row still scopes - the gate is a content gate and
  does not ride that read;
- custom code: a lib or edge function reading the db layer, the Elasticsearch
  projection or `LIB.dataViews.<name>()` directly reads past every generated
  gate, exactly as custom code writes past the seam.

The onPlace host's `moderationStatus_idx` shadow column is stripped from the
host's own responses only; it is deliberately kept out of the project-wide
internal-column registry so that enabling onPlace on one object changes no
other object's or service's generated managers.

A `dataViewName` read of the object itself (the object's own `list`/`get`
api bound to a view) is gated, and since the view projects
`moderationStatus` and the author column automatically the term always has
its columns - a view authored before that rule, still indexed without them,
matches nothing until it is re-projected (the same as for the tenant column). The
same holds for EMBEDDED rows: a stored view indexed before the rule carries
its aggregate rows of the object without the two columns, so the read-time
gate hides every one of them from a non-privileged caller until the view is
re-projected (the BFF's index-repair admin api, or the boot backfill).

## The injected apis

Per moderated object `<X>` (in a route, `<x>` is its name lower-cased):

| Api | crudType | REST route | Who |
|---|---|---|---|
| `list<X>ModerationQueue` | list | `GET /<x>moderationreviews` | reviewer roles - the queue, filterable by status (`review`, `applyFailed`, `applying`, ...) |
| `get<X>ModerationReview` | get | `GET /<x>moderationreviews/:id` | reviewer roles - one review row with its decision record |
| `accept<X>Moderation` | get (forced POST) | `POST /<x>moderationreviews/:id/accept` | reviewer roles - replays the write; answers `{ moderation, record }` |
| `reject<X>Moderation` | get (forced POST) | `POST /<x>moderationreviews/:id/reject` | reviewer roles - optional body `reason` (reviewers only) / `userMessage` (shown to the author); answers `{ moderation }` |
| `listMy<X>ModerationSubmissions` | list | `GET /my<x>moderationsubmissions` | the author - their own rows (an ownership check), status + message only, never the decision record |

So `listing` gets `GET /listingmoderationreviews`, `POST
/listingmoderationreviews/:id/accept` and `GET /mylistingmoderationsubmissions`.
None of the five has a gRPC controller, and the four reviewer apis are
hidden from MCP (`blockMcp`). Accept answers `403` (`MODERATION_SELF_DECISION`) on the
reviewer's own submission, `409` when the row is no longer decidable, and
`422` when the replayed write fails (the row is then `applyFailed`); reject
answers the same `403` and `409`.

The reviewer reads project away the replay-only columns (`paramsJson`,
`contextJson`, `authorSessionJson`); the author's own read is narrower still
(`id`, `targetId`, `kind`, `status`, `dataJson`, `userMessage` and the
timestamps).

## The review row

`sys_<X>ModerationReview` is a compiler-generated object of the owning
service, one row per moderated write (the staged snapshot in `staged` mode,
the decision record and audit in `onPlace` mode). It is tenant-level exactly
when its host object is, so a review row is confined to the tenant the
content belongs to. Only the moderation engine writes it; there is no
create, update or delete api over it.

| Column | What it holds |
|---|---|
| `targetId` | the host row an update targets (an onPlace insert's row once written); null for a staged insert |
| `kind` | `insert` or `update` |
| `apiName` | the create / update api the write came through; an accept replays through it |
| `status` | the [review row status](#review-row-statuses) |
| `dataJson` | the write as submitted: the data clause after every parameter, permission and ownership check ran against the author |
| `paramsJson`, `contextJson`, `authorSessionJson` | engine-only replay input (the author's identity fields, never a token); never returned by any api and never on an event |
| `authorId` | the submitting user; the owner column of `listMy<X>ModerationSubmissions` |
| `decisionValue`, `decisionConfidence`, `decisionProbabilities`, `decisionModel` | the decision as the provider returned it |
| `decidedBy` | `provider`, `mock` (the mock brand, declared or the missing-credential stand-in) or `human` |
| `transportFailure` | the provider failure that routed the row to `review` (or `rejected`), e.g. a timeout; `undecided:<reason>` for an undecided verdict; `mockFallback` for a declared mock's verdict on a production slot |
| `analysis` | the `escalateTo` agent's analysis; reviewers only, never on an event |
| `userMessage` | what the author sees |
| `decidedAt` | when the provider or a reviewer decided the row |
| `reviewerReason`, `reviewerId` | a human decision |
| `appliedAt`, `applyError`, `applyingSince`, `supersededBy` | apply and supersede bookkeeping |

The engine also logs each step under a stable event name: `ModerationStaged`,
`ModerationDecided`, `ModerationTransportFailure`, `ModerationApplied`,
`ModerationApplyFailed`, `ModerationEscalated` / `ModerationEscalationFailed`,
and `ModerationMockFallbackHeld` for a production mock hold.

## Hub messages and outbound notifications

A RealtimeHub message and the content of an outbound notification are not
DataObject writes, so the write seam above never sees them. `contentModeration`
applies **the same moderation** to them - it is objectModeration on two more
surfaces, not a second mechanism:

| | `objectModeration` | `contentModeration` |
|---|---|---|
| Where it is declared | `objectSettings.objectModeration` | `realtimeHubs[].contentModeration`, `notificationService.eventNotifications[].contentModeration` |
| The question | ONE `choice` question `verdict` over { accept, reject, review }, `policy` as its instructions | the same |
| Below `confidenceThreshold` (default 0.8) | `review` | the same |
| Provider failure | `onProviderError`: `failToReview` (default) / `failToReject` | the same - never delivered on a failure |
| Undecided verdict (e.g. a missing key) | held for a human (`transportFailure: undecided:<reason>`) | the same |
| Declared mock's verdict on a production slot | held for a human (`transportFailure: mockFallback`) | the same |
| Reasons | `wantReason` + `escalateTo`, `userMessageMode` | the same (`userMessageMode` matters on a hub only) |
| The review row | `sys_<X>ModerationReview` | `sys_<hubName>HubMessageModerationReview` per hub, ONE `sys_NotificationModerationReview` for the notification service - same columns |
| Reviewer apis | `list`/`get`/`accept`/`reject`/`listMy...` | the same names on those tables (no `listMy...` for notifications: they have no author) |
| What a reviewer's accept does | replays the write through its api | DELIVERS the held content (the room receives the message, the recipients the notification) |
| Validation codes | `OBJECT_MODERATION_*` | the same codes, plus the three surface-only ones below |

The generated service installs the decision manifest for each surface, so
a hub-only service and the notification service get it
like any moderated object's service.

### Hub messages

```json
"realtimeHubs": [{
  "hubBasics": { "name": "chat" },
  "messageSettings": { "messageTypes": ["text", "image"] },
  "contentModeration": {
    "enabled": true,
    "providerName": "mainDecision",
    "policy": "No insults, no spam, no contact details.",
    "messageTypes": ["text"],
    "exemptRoles": ["moderator"],
    "reviewerRoles": ["moderator"]
  }
}]
```

Every message a USER sends - the socket `hub:send` and the REST
`POST <hub>/:roomId/messages` alike - is judged after every check the door
makes of its own (joined, send permission, block and silence, message type,
rate limit, size, content schema), so a message the door would refuse never
costs a provider request, and before anything is stored or broadcast. One
provider request per message; the state the provider sees is
`{ surface: "hub:<hubName>", data: { messageType, content } }`.

| Verdict | Socket sender | REST sender | The room |
|---|---|---|---|
| accept | delivered as usual | `201 { data: <message> }` | receives `hub:messageArrived` |
| review | `hub:messageHeld { roomId, messageType, moderation: { id, status: "review", message } }` | `202 { moderation }` | nothing - the message is not stored and not broadcast |
| reject | `hub:error { code: "MESSAGE_MODERATION_REJECTED", moderation }` | `202 { moderation: { status: "rejected" } }` | nothing |
| no review row could be written | `hub:error { code: "MESSAGE_MODERATION_UNAVAILABLE" }` | `503 MESSAGE_MODERATION_UNAVAILABLE` | nothing - retry |

The sender is never handed a delivery frame or a stored record for a message
that was not delivered. A held message stays held until a reviewer decides it
(`accept<Hub>HubMessageModeration`): the accept stores it and broadcasts it as
`hub:messageArrived` to the room, the sender's own sockets included, with its
original send time; a reject delivers nothing. The sender cannot decide their
own message (`MODERATION_SELF_DECISION`, 403), and reads where their held
messages stand through `listMy<Hub>HubMessageModerationSubmissions`.

What is not judged:

- messages the hub itself authors (HubLogic `serverMessages`, auto-bridged
  data events, scheduled ticks): they carry no user;
- a message type a HubLogic `messageHandler` processes: its script decides what
  is broadcast, and may rewrite it, so the door never judges it - listing such a
  type is refused (`CONTENT_MODERATION_HANDLED_MESSAGE_TYPE`); judge inside the
  handler if it needs it;
- types left out of `messageTypes` (null = every other type of the hub);
- a sender holding an `exemptRoles` role.

The hub's own human queue (`guardrails.globalModeration` / a `moderated` hub
role, decided in-room with `hub:approve` / `hub:reject`, see
[Realtime](realtime.md#message-approval-queue)) still applies after an
`accept`: decision moderation runs first, and an accepted message then follows
the hub's own rules. With `globalModeration` on, the socket door also sends its
usual `hub:messagePending` (with no `messageId`) ahead of `hub:messageHeld`.

**Latency.** The verdict is on the delivery path of every judged message:
the provider's round-trip (250-400 ms for an isolated call) is added
once per message. The generated service's own share was measured at about 0.1 ms per
message (30 sends through the real hub controller and engine with a
zero-latency transport); with an injected 50 ms round-trip the added time was
53 ms. The accepted row is written after the broadcast, off the delivery path.
Two messages of one sender that take different decision times may arrive out
of order.

### Outbound notification content

```json
"eventNotifications": [{
  "eventNotificationBasics": { "name": "commentNotified", "jobType": "email" },
  "template": { "name": "commentMail", "subjectTemplate": "New comment", "bodyTemplate": "<%= text %>" },
  "contentModeration": {
    "enabled": true,
    "providerName": "mainDecision",
    "policy": "No insults, no contact details, no links to unknown sites."
  }
}]
```

The RENDERED content is judged - what would be sent, after every render check
(missing locals, a failed render) - right before the first send or store, on
every channel (email, sms, push, inApp, telegram, whatsapp; a WhatsApp
template send is judged with its template parameters). Each distinct rendered
content of an event is judged ONCE, however many recipients it fans out to (a
shared render is one decision; per-language variants or `renderPerRecipient`
are one decision per distinct text).

- **accept** - sent unchanged.
- **review** - HELD: nothing is sent and nothing is stored. ONE
  `sys_NotificationModerationReview` row records the content and every
  recipient it covers, and each recipient's notification-log row says
  `queued` and names the review row. A reviewer's accept
  (`acceptNotificationModeration`) sends the stored content to the stored
  recipients through the same delivery path a direct send uses (contact
  lookups, device tokens, stored in-app rows), without judging it again.
- **reject** - never sent; each recipient gets a failed delivery row naming
  the review row.
- **a provider failure** follows `onProviderError` and is never sent; a
  decision that cannot be reached, or a hold that cannot be recorded, is not
  sent either and says so on the delivery rows.

A notification has no author session: `exemptRoles` and `messageTypes` are
ignored there (`CONTENT_MODERATION_INERT_OPTION`, a warning), there is no
`listMy...` api, and the self-decision guard does not apply. The review table is
service-level like every notification table, and its reviewer apis admit the
union of the moderated events' `reviewerRoles`.

Not covered: the direct `send*Action`s of a Business API (`SendMailAction`,
`SendSmsAction`, `SendPushNotificationAction`, `SendWhatsAppAction`). They call
the provider inside the request with author-written content; moderating them
needs a hold-and-resend path of their own.

### Content models

A `ContentModel` synthesizes real DataObjects (`{name}Content`, `{name}Item`,
`{name}ContentVersion`), so its writes are moderated by the same mechanism:
`contentModeration` on the model is an `ObjectModeration` block (the same
fields, defaults and codes) that the compiler applies to the objects the model
synthesizes. Nothing new to learn and no parallel interception: the generated
editorial create / update apis (`createArticleContent`, `updateArticleContent`,
and the item twins) run through the moderation seam like any authored write.

```json
"contentModels": [
  {
    "contentBasics": { "name": "article" },
    "fields": [{ "name": "title", "type": "shortText" }, { "name": "excerpt", "type": "longText" }],
    "bodySettings": { "format": "markdown" },
    "childSettings": { "fields": [{ "name": "label", "type": "shortText" }] },
    "contentModeration": {
      "enabled": true,
      "providerName": "mainDecision",
      "policy": "Articles must be on topic; no insults, no advertising, no contact details.",
      "reviewerRoles": ["editorInChief"]
    }
  }
]
```

What the generated service does with it:

- **Which objects.** `{name}Content` is moderated, and `{name}Item` too when the
  model has child items: an FAQ's questions and answers, a landing page's
  sections, a menu's labels are all content, and they live on the item rows.
  `{name}ContentVersion` never is: its snapshots are written by the content
  layer from rows that already passed moderation.
- **Which fields.** `moderatedProperties` names model fields, `body` or `seo`,
  or child-item fields. Each object judges the listed names it carries, and an
  object that carries none of a non-empty list is not moderated. Null (the
  default) judges each object's content: the record's declared fields, `body`
  and `seo`; the item's declared fields and `body`. Editorial metadata (locale,
  order, parent item) and the workflow columns the transitions own (status,
  publishedAt, slug, currentVersion) are never judged, so a reorder or a locale
  move does not send content back to the queue.
- **The editorial path.** A `review` or `reject` verdict holds the write: the
  editorial api answers `202 { moderation }`, nothing is written, the live
  record (a published one included) keeps its content, and no version snapshot
  is taken. A reviewer's accept (`acceptArticleContentModeration`, the usual
  [injected apis](#the-injected-apis)) replays the write through the same
  editorial api as its author, so the content guards (the singleton rule, locale
  assignment, the slug freeze), the `everyUpdate` version capture, the
  `editsResetApproval` reset and the events run once, exactly as for a direct
  save. The review row is a claim, so a second accept is refused (409) and
  never writes twice.
- **Author-defined apis** on the content or item object are moderated the
  same way; every other compiler-injected api is not.
- **Only `mode: staged`.** `onPlace` is refused on a content model
  (`OBJECT_MODERATION_CONTENT_ON_PLACE`): the delivery routes, the publish and
  schedule transitions, the scheduler and the preview tokens read the content
  rows through the content layer, outside the onPlace read gate, so an
  unapproved record could be published and served. Staged never holds an
  unapproved real row.
- **What stays outside the seam**: the content transitions (publish, archive,
  restore, `restoreVersion`, which copies a snapshot of content that already
  passed), the item reorder (it moves `order` only), and an authored CrudAction
  that writes the content object through the db layer
  (`OBJECT_MODERATION_UNSTAGED_WRITE_PATH`, a warning).

The block is refused on a target language the compiler does not support
(`OBJECT_MODERATION_LANGUAGE_UNSUPPORTED`),
and declaring an object under a synthesized name yourself is already refused
(`CONTENT_MODEL_DATA_OBJECT_CONFLICT`), so there is exactly one place the
moderation of a content model is configured.

**The publish transition is not moderated, by decision.** Publishing moves
content that its writes already put through moderation from draft to live; it
changes visibility, not content. Judging the same content again would ask the
same question of the same state, and the decision is reproducible across
identical requests - a second verdict could only differ by drift-band noise.
The editorial workflow (`ContentApprovalSettings`) is the human gate for
publication. A stricter policy for what may go public is a
[`DecisionAction`](../../spec/DecisionAction.md) on the publish api, not a
second moderation.

### Validation codes of the surfaces

The `OBJECT_MODERATION_*` codes above apply with the same meaning (provider,
pinned model, policy, threshold range, drift band, reasons, escalation target,
llm message, roles, language support). Only the surface can get these wrong:

| Code | Meaning |
|---|---|
| `CONTENT_MODERATION_MESSAGE_TYPE_NOT_FOUND` | hub: a `messageTypes` entry is not a message type of the hub |
| `CONTENT_MODERATION_HANDLED_MESSAGE_TYPE` | hub: a `messageTypes` entry is processed by a HubLogic handler, which the door never judges |
| `CONTENT_MODERATION_INERT_OPTION` (W) | notification: `exemptRoles` / `messageTypes` set, which a notification ignores |

## Relation to the decision family

Object content moderation is built on [the decision layer](decision-layer.md)
but is not a [`DecisionAction`](../../spec/DecisionAction.md). It calls the
bound decision provider directly with one compiler-owned `verdict` question,
because the question, its options and what happens to each answer are the
compiler's, not the author's. The rule of thumb:

- the question is "may this write to this object be published?" - use
  `objectModeration`; you do not need a `DecisionAction` for it;
- a workflow branches on a judgement you design (route, classify, score, gate)
  - use a `DecisionAction`.

What the two share, so it is not restated here: the provider entry and its
credentials (`DECISION_PROVIDER_<NAME>_*`), the deterministic `mock` brand,
the pinned-model rule (the same `DECISION_MODEL_NOT_PINNED` code), the
escape option (`review` is the verdict's escape option and is always
offered), and the rule that a decision never makes an authorization call -
the verdict never feeds a permission check, which is why
`DECISION_ON_AUTHZ_SURFACE` is not raised on a moderated object.

### Similar posture, different spelling

The two surfaces take a similar posture and spell it differently on purpose:
`DecisionAction`'s values are generic across every workflow,
`objectModeration`'s name the moderation outcome. Low confidence is the one
row where the defaults differ.

| Situation | `DecisionAction` | `objectModeration` | Shared posture |
|---|---|---|---|
| The provider fails or times out | `onProviderError`: `failClosed` (default), `failOpen`, `defaultAnswer` | `onProviderError`: `failToReview` (default), `failToReject` | a failure never publishes and never widens; moderation has no fail-open value at all |
| The answer is below `confidenceThreshold` | `onLowConfidence`: `passThrough` (default), `escalate`, `reject`, `defaultAnswer` | no field: always `review`, a human decides | objectModeration never acts on a low-confidence verdict alone (it always goes to review). DecisionAction's default `passThrough` keeps the answer and flags it in `_meta.lowConfidence` for the workflow to read; choose `escalate`, `reject` or `defaultAnswer` to get moderation's posture. |
| `escalateTo` | an `aiCallActions[]` / `agentCallActions[]` entry that explains or re-decides | an AI agent that writes the reason only and never re-decides | the language model takes the part the calibrated provider cannot: prose |
| The threshold sits in the drift band | `DECISION_THRESHOLD_IN_DRIFT_BAND` (error) | `OBJECT_MODERATION_THRESHOLD_IN_DRIFT_BAND` (warning) | keep the threshold out of the band (0.2 for typesafe) around 0.5 |

### What the measurements say and do not say

The provider figures below come from measurements against a pinned
`jev-1.13.0` model of the `typesafe` brand. Each is stated with its limit,
because each is easy to over-read.

- **The decision is reproducible across identical requests; the probability
  is not.** Repeated identical requests (12 per question, 18 questions across
  noul, choice and score) returned the same decision every time, while the
  probability or confidence moved by up to 0.10 for mid-confidence answers
  and by 0.01 or less for confident ones. That is why the review row
  STORES the decision (value, confidence, probabilities, model) and nothing
  ever re-derives it: a re-derived verdict could legitimately disagree with
  the one already acted on.
- **The escape option works.** A forced choice with no escape option
  answered a WRONG option at confidence 0.51; the same state with an escape
  option answered correctly at 1.0. The model signals the mismatch rather
  than bluffing - which is why `review` is always one of the verdict's
  options.
- **`probabilityDriftBand` is 0.2 for the typesafe brand.** That is twice the
  worst spread measured across noul, choice and score questions, so
  any `confidenceThreshold` strictly between 0.3 and 0.7 is inside it. For
  moderation this is a warning; for a `DecisionAction` it is an error.
- **Calibration was checked on 45 hand-labelled cases** across three question
  shapes. That is enough to say the provider is not overconfident, and no
  more: it is not a reliability curve, so `confidenceThreshold` is a
  policy choice, not a guaranteed error rate.
- **Latency:** 250-400 ms for an isolated call, p50 270 ms at bounded
  concurrency. No provider latency above ~400 ms has been measured; slower
  figures seen in early runs were queueing in the measuring harness. The
  `timeoutMs` default (5000) leaves wide headroom. The timeout is enforced by
  the moderation engine today (the provider request itself keeps running
  after it fires).
- **The published per-minute rate is not a rate budget.** The provider
  publishes 1,200 requests per minute, but it is not enforced: 1,500 requests
  were sustained at ~4,965 per minute with no `429`. Do not size capacity on
  the published figure; when a `429` does arrive it is a provider failure and
  follows `onProviderError`.
- **The 255-option choice ceiling is not a safety limit.** A choice with 121
  options was answered correctly at full confidence; the untested risk is
  semantically overlapping labels, not their count. (The moderation verdict
  has three options, so this matters only for your own `DecisionAction`
  choices.)
- **The provider cannot answer outside the declared options** - the verdict
  is always `accept`, `reject` or `review`. That is not the same as "it
  cannot be wrong": inside the options it can still pick the wrong one,
  which is what the threshold and the human review are for.

## What the author does NOT do

Never hand-design a moderation status column, a moderation queue table, an
accept/reject pair, or an intake/outcome Kafka pipeline for an object that
carries `objectModeration` - all of it collides with, or duplicates, the
injected surface. Validation refuses the block on auth-service objects and
compiler-managed `sys_` objects (`OBJECT_MODERATION_ON_SYSTEM_OBJECT`): those are
written by the generated service itself, and staging them would hold back its
own bookkeeping.

## When a standalone moderation service is still justified

Build a dedicated moderation service only when the need falls OUTSIDE what
this pattern covers - for example, moderating something that is not a
DataObject write at all (a live video/audio stream, a third-party feed with
no owning service), or a single review surface that must aggregate many
unrelated object kinds beyond what a BFF DataView over several
`sys_<X>ModerationReview` tables can already do. State the specific edge
case; "the team is used to a central moderation service" is not one.

Two cases that look like edge cases and are not:

- **Content models.** A `ContentModel` synthesizes real DataObjects; its
  `contentModeration` block (an `objectModeration`) moderates the editorial
  create / update apis of its content and item objects (see
  [Content models](#content-models)).
- **Realtime hub messages and outbound notifications.** Use
  `contentModeration` on the hub or the EventNotification (see
  [Hub messages and outbound notifications](#hub-messages-and-outbound-notifications)):
  the same verdict, threshold, review row and reviewer apis, applied to
  content that is not a DataObject write.

## Validation codes

Every check runs only while `enabled` is true. W = warning; everything else
is an error.

| Code | Meaning |
|---|---|
| `OBJECT_MODERATION_PROVIDER_NOT_FOUND` | no `providerName`, or it names no declared decision provider |
| `DECISION_MODEL_NOT_PINNED` | the `model` override is a floating tag |
| `OBJECT_MODERATION_POLICY_MISSING` | no `policy` |
| `OBJECT_MODERATION_THRESHOLD_RANGE` | `confidenceThreshold` outside (0, 1] |
| `OBJECT_MODERATION_THRESHOLD_IN_DRIFT_BAND` (W) | `confidenceThreshold` within the provider's `probabilityDriftBand` of 0.5 |
| `OBJECT_MODERATION_REASON_WITHOUT_ESCALATION` | `wantReason` with no `escalateTo` |
| `OBJECT_MODERATION_ESCALATION_TARGET_NOT_FOUND` | `escalateTo` names no agent of the service or the agent hub |
| `OBJECT_MODERATION_LLM_MESSAGE_WITHOUT_REASON` | `userMessageMode: llm` without `wantReason` |
| `OBJECT_MODERATION_UNKNOWN_ROLE` | a `reviewerRoles` / `exemptRoles` entry is not a declared role |
| `OBJECT_MODERATION_PROPERTY_NOT_FOUND` | a `moderatedProperties` entry is not a property of the object |
| `OBJECT_MODERATION_RESERVED_PROPERTY` | the object declares a property named `moderation`, the response key |
| `OBJECT_MODERATION_ON_SYSTEM_OBJECT` | the block is on an auth-service or `sys_` object |
| `OBJECT_MODERATION_LANGUAGE_UNSUPPORTED` | the service's target language is not supported by the compiler for the moderation engine |
| `OBJECT_MODERATION_NO_WRITE_API` (W) | no create and no update api on the object: nothing is moderated |
| `OBJECT_MODERATION_UNSTAGED_WRITE_PATH` (W) | an authored CrudAction writes the object past the seam |
| `OBJECT_MODERATION_STATUS_COLUMN_TAKEN` | onPlace: an authored property named `moderationStatus` / `moderationAuthorId` |
| `OBJECT_MODERATION_MANAGED_COLUMN_WRITTEN` | onPlace: an api or action writes a compiler-managed column |
| `OBJECT_MODERATION_UNGATED_READ_PATH` (W) | onPlace: a read surface the gate does not cover (the NOT-gated list above) |
| `OBJECT_MODERATION_UNGATEABLE_VIEW_STAT` | onPlace: a DataView stat over the object |
| `OBJECT_MODERATION_UNGATEABLE_PROJECTION` | onPlace: a declared graph or enterprise projection |
| `OBJECT_MODERATION_UNCERTAIN_GLOBAL_AGGREGATION` | onPlace: an earlier static global bucket may survive a later opaque spread or computed key |
| `OBJECT_MODERATION_UNGATEABLE_GLOBAL_AGGREGATION` | onPlace: a detected global bucket in a fetchFromElasticAction body over the object |
| `OBJECT_MODERATION_CONTENT_ON_PLACE` | `mode: onPlace` in a ContentModel's `contentModeration` (staged only) |

The gRPC behaviour of a moderated write is described in its own subsection
above. At runtime, a reviewer deciding their own submission is refused with
`MODERATION_SELF_DECISION` (403), and a row another reviewer is already
deciding answers `409`.

## See also

- [The decision layer](decision-layer.md) - the family this pattern is built on: providers,
  question types, where a decision attaches
- [`DecisionAction`](../../spec/DecisionAction.md) - an author-defined decision inside a workflow
- [`ObjectModeration`](../../spec/ObjectModeration.md) - every field, generated from the pattern
- [`ContentModeration`](../../spec/ContentModeration.md) - the same block on hub messages and notification content
- [Realtime hub](realtime.md) - the hub's own in-room human approval queue
- [BFF service](../system-services/bff.md) - DataViews over a moderated object, and the
  cross-service review-queue view
- [Agent hub](../system-services/agent-hub.md) - where the `escalateTo` agent runs
- [Kafka controllers](../business-apis/kafka-controllers.md) - db events carry every row, unapproved
  ones included
