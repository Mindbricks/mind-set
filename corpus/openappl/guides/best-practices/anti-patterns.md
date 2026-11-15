---
title: Anti-patterns
---

# Anti-patterns

A list of things that look reasonable on first read but bite you later.
Linked to the right pattern wherever one exists.

## Data modeling

### Boolean flags instead of `Enum`

`isApproved`, `isRejected`, `isPending` should be one `status` field.
See [Data modeling tips](data-modeling-tips.md).

### JSON stored in `Text` columns

`DataTypes` has no `JSON` type. A structured value you store and return
as a whole (a webhook payload, provider metadata) belongs in an
`Object` property, kept as one JSON document; don't serialize it into a
`Text` column and parse it back. An `Object`'s keys are not typed or
validated, so fields you filter, sort or relate on get their own
properties or a child data object. See
[Data modeling tips](data-modeling-tips.md).

### Soft-delete as a state machine

`isActive: false` is *tombstone*, not "archived". Don't shoehorn
lifecycle into deletion.

### Premature normalization

A `User.address` with five fields doesn't need its own `Address` data
object. Promote later if the address goes places.

### Speculative indexes

Adding an index "just in case" slows writes for no current benefit. Add
when a real query proves the need.

## API design

### The "god API"

`POST /doStuff` taking a `mode` parameter. Each mode becomes its own API.

### Bidirectional CRUD overload

A single `deleteOrder` API that switches between soft-archive, hard
delete, and cancel based on a `mode` parameter. Three separate APIs
is clearer — each one's permission gate, validation chain, and event
emission can be reasoned about independently.

### Public APIs without verification

A BusinessApi with `basics.authOptions.loginRequired: false` is for
webhooks and machine-to-machine callbacks. Pair it with
[`VerifyWebhookAction`](../../spec/VerifyWebhookAction.md) unless
the endpoint is genuinely internet-public.

### Returning unbounded lists

A `list`-crudType API with `defaultPageRowCount: 10000` is a
denial-of-service waiting to happen. Cap pagination at a sane value
(50–200), and cap aggregation results similarly. `defaultPageRowCount`
is honoured by the generated service; the runtime clamps a page to 1000
rows whatever the blueprint says, and `listOptions.topPick` bounds the
ranked set on top of that.

`paginationOptions.paginationEnabled: false` does NOT unpage a list: it
is retired and ignored. The one opt-out is
`paginationOptions.unpaged: true`, which answers the WHOLE filtered set
in one response. It is bounded by a hard runtime ceiling,
`UNPAGED_LIST_MAX_ROWS` (default 10000 rows): above it the api refuses
with `422 UNPAGED_LIST_TOO_LARGE` rather than answer a truncated set.
The ceiling does NOT apply to an SSE stream (`responseMode: 'stream'`),
which sends the whole set chunk by chunk. Keep unpaged lists off
external transports (the validator warns: `UNPAGED_LIST_REST_EXPOSED`
for REST, `UNPAGED_LIST_EXPOSED` for SSE, gRPC or MCP) and use them for
internal, kafka and cron readers that genuinely need every row.

## Workflow

### Auth check inside action body

Put `PermissionCheckAction` first. Don't read `@session.role` inside an
`ArrowFunctionAction` to decide whether to proceed.

### Fetch-modify-write without atomicity

A counter that does Read → Compute → Write loses updates under
contention. Write `{ $inc: n }` (or the guarded `{ $incIf: { by, when } }`)
as the column's `dataClause` value instead: the database does the
arithmetic in one statement, and a guard that does not hold answers a
typed 409. Hand-written SQL for the same thing is worse still — it
bypasses the Elasticsearch projection and the db events, and has to
know the physical table name. See
[Numeric mutation](../mscript/numeric-mutation.md) and
[Race conditions](../workflow/race-conditions.md).

### Try/catch as control flow

You won't write `try/catch` in MScript anyway, but: using
`onActionError: "completeApi"` on a step that's really a happy-path
validation is a smell. That option exists for genuinely optional
side effects (best-effort logging, fire-and-forget telemetry); when
the step is a gate, leave `onActionError` at the default
(`throwError`) and let a `ValidationAction` fail loudly.

### An LLM call where a decision would do

An `AiCallAction` whose JSON answer is only branched on (a category, a
yes/no, a routing target) pays for generated text and parses it back
into a value. A [`DecisionAction`](../../spec/DecisionAction.md) answers
the same typed question in a few hundred milliseconds with no text to
parse; keep the language model for the cases the decision is unsure
about (`escalateTo`) or for when a human reads the answer. The reverse
mistake is a judgement that MScript could compute exactly: write the
rule. See [The decision layer](../capabilities/decision-layer.md).

### Parallel for the sake of parallel

`ParallelAction` adds setup/teardown cost. For 2 sequential reads where
the second uses the first's output, sequential is faster.

## Events

### Subscribers in the topic name

`orders.order.created.toReporting` — wrong. Subscribers don't show up
in topic names. See [Kafka topic naming](kafka-topic-naming.md).

### Tenant in the topic

One topic per tenant explodes topic count. Put tenant in headers /
payload.

### Versioned topic names

Add fields; don't rename. Run two topics during migrations if a real
break is unavoidable.

## Permissions

### Role explosion

A role for every combination of features (`editor-with-billing-no-export`).
Use a permissions array + ABAC rules instead.

### "I'll skip auth everywhere"

If you find yourself reaching for `authOptions: { loginRequired: false }`
on many APIs, you're working around the auth model. Reconsider —
share tokens, an API-key flow, or a public-facing service user
account is usually safer.

### A decision as an access check

A decision provider's probability has no rationale and no stable
answer to "why was this denied", so it never decides who may see or do
something. Validation refuses a permission, membership or
object-permission check that reads `this.decisions`, a fuzzy filter on
an access-bearing column, and a `decisionSource` on a column an access
check reads (`DECISION_ON_AUTHZ_SURFACE`). Use a decision to flag or
route for a human, and the permission system to deny. See
[The decision layer](../capabilities/decision-layer.md#1-a-decision-never-makes-an-authorization-call).

## System architecture

### Microservices because microservices

For a new project, fewer services is right. Move from one to two when
the data lifecycle, access patterns, and deploy cadence diverge — not
before. See [Service boundaries](service-boundaries.md).

### Speculative cross-service relations

Two services with foreign keys both ways probably want to be one
service. Cross-service relations are real cost; don't pay it
speculatively.

### A hand-built moderation service

A central moderation service with per-producer intake topics, a
`subject` enum over every producing service and a verdict-callback
contract is justified only by an edge case the pattern does not cover
(see the guide's list). For "this project needs moderation", enable
[`objectModeration`](../capabilities/object-moderation.md) on the object that
carries the user content instead; it stages writes, queues reviews and
injects the reviewer apis per owning service, and a BFF DataView over the
review tables gives a cross-service queue when one is needed. Do not
hand-design a moderation status column or an accept / reject api pair on
such an object either.

## Extending and testing

### Reaching for implicit generation

The language is explicit: every API, every relation, every action must
be declared. If you find yourself fighting validation errors with the
assumption that "the compiler will figure this out implicitly," it
won't. Declare what you want explicitly; shorter blueprints rarely beat
correct ones.

### Mocking the database in integration tests

Service tests that mock the data layer past the unit-test boundary stop
catching real bugs (unique-index violations, soft-delete oversights,
transaction interleavings). Test CRUD semantics against a real database
instance with a temporary schema, not a mock.

### Oversized bulk actions

A `*BulkCrudAction` that processes "every row in the table" in a
single workflow run will eventually time out, OOM, or hold a lock too
long. Cap the per-run batch at a few thousand rows, drive iteration
via cron, and emit a Kafka event between runs so consumers see
incremental progress. Lists of 10k+ rows belong on a stream, not in a
single action's `dataClause`.

### Library functions for one-call helpers

A 4-line library function used in exactly one BusinessApi just moves
code further from where it runs. Use `ArrowFunctionAction` inline.
Extract to a library function only once a third caller appears.

### Bypassing the data layer from a library function

Writing to the database directly from a library function, around the
generated data layer, bypasses its Elasticsearch indexing, Kafka events
and soft-delete handling. Reach for it only for genuinely
storage-native operations (custom aggregations, one-off batch
migrations); the default is the data layer.

## Configuration

### Options for a mode you did not choose

Some keys are read only in one mode of their pattern: a bucket's
`readCheckRoles` only under `readAccess: 'roles'`, a `SendWhatsAppAction`'s
`templateVariables` and `templateLanguage` only with a `template`, a
property's `fulltextSearch` only while `indexedInElastic` is on. In the
other modes the key does nothing, and nothing fails. Validation reports
such a key with the warning `INERT_OPTION` (a few older checks keep their
own code, such as `CONTENT_MODERATION_INERT_OPTION` or the cart's
`SHOPPING_CART_REMOTE_MODE_LOCAL_ONLY_SETTING`, with their established
messages). The `INERT_OPTION` message names the key, the mode field and its
current value, and the mode that reads the key; `details.remedy` lists the
fields that clear it. Remove the key, or switch
the mode. A value equal to the pattern default is never reported.

## See also

- All the linked best-practices pages.
- [Pattern reference](../../ontology/index.md) for the *what*; this section is the *what not*.
