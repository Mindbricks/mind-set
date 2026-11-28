---
title: Kafka controllers
---

# Kafka controllers

A **Kafka controller** turns a `BusinessApi` into a Kafka consumer:
when a message lands on a configured topic, the API runs with the
message payload as its input. Used for asynchronous processing,
integration-driven workflows, and reactive pipelines that span
services.

Distinct from auto-generated DataObject lifecycle events (which fire
on every create/update/delete and are published by the generated service
without explicit config) - Kafka controllers are the **inbound**
side.

## ApiKafkaSettings: the per-API toggle

Lives at `BusinessApi.controllers.kafkaSettings`. Configure the consumer
and opt into dead-lettering with these fields (see
[Outcomes](#outcomes-applied-completed-miss-rejected-dead-lettered)):

```json
{
  "controllers": {
    "kafkaSettings": {
      "hasKafkaController": true,
      "requestTopicName":   "order.created",
      "responseTopicName":  "order.processed",
      "deadLetterEnabled":  true,
      "deadLetterTopicName": "order.created-deadletter"
    }
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `hasKafkaController` | | Toggle. Set to `true` to enable the consumer. |
| `requestTopicName` | yes | Kafka topic to listen to - the **main** topic, written literally: a framework topic (for example the DB-level `<projectCodename>-<serviceName>-service-dbevent-order-created`) or any other topic string. See [Topic names are literal](#topic-names-are-literal). It stays required when `requestTopicNames` lists more topics. |
| `requestTopicNames` | | Additional topics the same API listens to. Default `[]`. See [One API, several topics](#one-api-several-topics). |
| `responseTopicName` | | If set, the API publishes its response to this topic. Omit for fire-and-forget. Only an **applied** outcome is published here; a rejected message never rides the response topic. |
| `deadLetterEnabled` | | Default `false`. When `true`, a message the API pipeline **rejects** (`httpStatus >= 400`) is published to the dead-letter topic with the original payload and the problem body. Off, the service emits no dead-letter publishing at all for this API. |
| `deadLetterPerTopic` | | Default `false`. With `deadLetterEnabled: true` and no explicit `deadLetterTopicName`, derive one default dead-letter topic per incoming topic. An explicit name always wins and stays shared. |
| `deadLetterTopicName` | | Topic for the dead-lettered messages. Unset means `<wireRequestTopicName>-deadletter`, derived from the topic **as it goes on the wire**: if a `PublishEventAction` in this project authors the request topic, the [project scope](../best-practices/kafka-topic-naming.md#the-wire-name-is-project-scoped) applies to the dead-letter name too, so the pair stays in one namespace. A name you set here is not re-derived (no suffix, no composition; it is used exactly as written), but it is still published through the normal publish door, which scopes an authored topic of your project and leaves any other string alone: a name that is itself one of your `PublishEventAction` topics goes on the wire as `<projectCodename>-<name>`; any other name goes on the wire verbatim. The topic census reports the string that reaches the wire in both cases. Ignored unless `deadLetterEnabled` is `true` - naming it without the flag raises the `KAFKA_DEAD_LETTER_TOPIC_INERT` warning at design time, because nothing would be published to it. |

The fields are flat - older blueprints that used a nested
`configuration: { ... }` wrapper are still accepted on input but
lifted to the flat shape at validate time.

### One API, several topics

A blueprint that routes N near-identical topics into the same handling
logic lists the extra topics on ONE api instead of authoring one
BusinessApi per topic:

```json
{
  "controllers": {
    "kafkaSettings": {
      "hasKafkaController": true,
      "requestTopicName":  "orders-eu",
      "requestTopicNames": ["orders-us", "orders-apac"]
    }
  }
}
```

- **The effective topic list** is `requestTopicName` (or the generated
  default request topic when it is unset) followed by the
  `requestTopicNames` entries, exact-match de-duplicated with the order
  kept: an entry equal to `requestTopicName` changes nothing, and `[]` (what
  a saved blueprint carries for every api) is a single-topic api.
- **Subscriptions:** every topic of the list is subscribed with its own
  consumer group (see [The consumer group id](#the-consumer-group-id)) while the
  handler and the API logic exist once. In multi-topic mode the API receives
  the incoming subscription topic as `this.kafkaTopic` and
  `this.request.kafkaTopic`. These are controller-owned values, independent of
  a producer's payload fields. For example, an MScript expression
  `this.kafkaTopic === 'orders-eu' ? 'EUR' : 'USD'` can select the mapping.
  The name is the declared subscription topic, before any deployment alias
  mapping. Single-topic controllers do not supply this context binding.
  For APIs also exposed over REST or another
  transport, guard the value: those calls do not set `this.kafkaTopic`.
  No request parameter or `httpLocation` is needed: `this.kafkaTopic` is a
  service-bound MScript context value, available before parameters and
  workflow actions run. Do not declare a parameter or action context slot
  with that name on a multi-topic API (`KAFKA_TOPIC_CONTEXT_SHADOWED`). The same
  validation guard refuses a
  generated parameter field named `kafkaTopic` (including writable data
  properties and URL parameters), or a row-result alias named `kafkaTopic`.
  For example, an API on a data object named `kafkaTopic` conflicts on a
  create/get/update/delete; its list alias `kafkaTopics` does not conflict.
- **Shared channels:** the `responseTopicName` stays shared by all topics.
  An explicit `deadLetterTopicName` is used for every topic; by default the
  dead-letter topic stays derived from the main topic
  (`<wireRequestTopicName>-deadletter`). Set `deadLetterPerTopic: true` to
  derive the default from each incoming topic instead (see below).
- **Logs and dead-letter records** name the topic the message actually came
  in on in their `topic` field.
- **Validation:** each entry must be a valid Kafka topic name
  (`KAFKA_TOPIC_NAME_INVALID` at `requestTopicNames[i]`, a blank entry
  included) and a non-string entry is refused. The list check removes only
  exact duplicates as an autofix, retaining the first occurrence and order.
  Kafka topic names are case-sensitive: `Orders` and `orders` are distinct
  topics and both remain in the list.
- **Design-time census:** the boot-time topic pre-create, the
  `KAFKA_TOPIC_REQUEST_CHANNEL_NO_PRODUCER` warning, the topic graph and the
  producer-payload checks (`KAFKA_CONSUMER_*`, `CONSUMER_ROW_KEY_*`) see every
  topic of the list: the api's parameters are judged against each topic's
  producers in turn.

Support for the extra topics and for the per-topic dead-letter flag depends on
the compiler and the target language. See
[the compiler specification](../../compiler/index.md).

### Per-topic dead-letter streams

Keep the shared default by leaving `deadLetterPerTopic` false or unset.
To replay each stream back to its own request topic by name, set
`deadLetterEnabled: true` and `deadLetterPerTopic: true`, and omit
`deadLetterTopicName`. For the example above, the defaults become
`orders-eu-deadletter`, `orders-us-deadletter`, and `orders-apac-deadletter`.
For request topics authored by this project, the project scope is applied
before the suffix, for example `shop-orders-us-deadletter`. The topic census
includes every stream, so provisioning and ACLs can cover them before the
first rejection. Both rejected and partially applied messages use this rule;
the record's `topic` still identifies the incoming subscription topic.
An explicit `deadLetterTopicName` overrides the flag and serves all topics.
The flag alone does not enable publishing. Single-topic output is unchanged.

### The consumer group id

Each Kafka-controller API consumes in its own consumer group:

```
<SERVICE_CODENAME>-<requestTopicName>-<apiName>
```

`SERVICE_CODENAME` is the lowercased `<projectCodename>-<serviceName>-service`.
`requestTopicName` is the name **as authored** (the
topic is the bare name, not its `<projectCodename>-` wire form), and the
whole id is made legal for the broker: a character outside
`[a-zA-Z0-9._-]` becomes `_`, and an id over 255 characters is cut and
suffixed with a hash. One group per service AND per applier API is
what lets every consuming service, and every applier API in one service,
see every message, while replicas of one service share their applier's
group and split its partitions.

This id carries the project codename, like every other listener
family, whose group is `<SERVICE_CODENAME>-<listenerName or topic>`, and unlike
the external-feed group `feed-<SERVICE_CODENAME>`. Older deployments used
`<serviceName>-<requestTopicName>-<apiName>` without the prefix; a compiler
that changes the group id is expected to carry committed offsets over from the
legacy group so a rolling upgrade does not replay or lose messages (see
[the compiler specification](../../compiler/index.md)). Update lag dashboards,
ACLs and alerts to the new group id when you move an existing deployment. Old
replicas may still process and commit in the legacy group while new ones
consume in the new group; cross-group duplicate side effects are possible,
so handlers must tolerate at-least-once delivery.

### Where a new consumer group starts, and when a listener can miss events

Consumer behaviour that matters to an author (Kafka-controller APIs, notification
and feed consumers, agent `kafkaControllers`, socket and event-subscription
consumers):

- **Restart.** A group id is the same on every boot, so a restarted service rejoins
  the same group and resumes at its committed offset. Events published
  while it was down are delivered after the restart; nothing committed is
  delivered again.
- **First join.** A group that has never committed on a partition (a
  listener added to a service, a service deployed for the first time, a
  listener or API renamed) starts at the **build's generation time**: the
  first offset at or after the instant the build was generated. Events
  published after the build was generated and before the listener's first
  successful start (a deploy that stayed down for hours, a listener that
  mounts late) are delivered once. Events older than the build are not
  read. The look-back is bounded by a configurable maximum (default seven
  days, Kafka's default retention): a build older than that looks back only
  that far. A replica that joins after a sibling does not rewind a partition
  the sibling has already consumed and committed.
- A listener that reads its topics from the beginning (a read-model listener
  that rebuilds a view) is unchanged: it starts at the earliest retained message.
- A deployment can switch the whole service back to the earlier behaviour
  (a group with no committed offset starts at the end of the log and never sees
  what was published before its first join).

A listener can still miss, or see again, events in these cases:

- **Renamed listener or API.** The new group is a first join: it reads
  from the build time, so events the OLD group already handled between
  that build's generation and the old deployment's stop are delivered
  again. A rename whose handler is not idempotent should be deployed with
  the old deployment stopped close to the build, or with the start-at-end
  switch for that deploy.
- **The first join could not read offsets.** When the offset read fails or
  takes too long, the listener logs `KafkaFirstJoinLookbackSkipped` once and
  starts at the end. A Kafka-controller API is stricter: when its offset
  carry-over read fails the mount fails and is retried instead of starting at
  the end.
- **Older than the look-back.** An event published before the build's
  generation time (or before the look-back cap, or outside the topic's
  retention) is not delivered to a new group.
- **A partition added while the listener runs.** It reaches the group
  through a later rebalance, not a first join, so it is not sought: it
  starts at the end of the log.
- **Expired group offsets.** Kafka drops the committed offsets of a group
  that has been empty for `offsets.retention.minutes` (seven days by
  default); the next start is a first join again.

A first join is logged as `KafkaFirstJoinLookback` with the group, the
look-back instant and every sought `topic[partition]@offset`.

## How it interacts with the rest of the API

A Kafka-triggered API behaves like any other `BusinessApi` once
running:

- Its `parameters.requestParameters` define the expected payload
  shape; the Kafka message body is parsed against them.
- Its `actions` (the typed action store) run as the workflow steps.
- Its `workflow` block is executed in the same lifecycle milestones
  used for REST.
- If `responseTopicName` is set, the response shape is whatever the
  workflow finally produces (typically through
  `AddToResponseAction`).

The same `BusinessApi` can carry REST, gRPC, and Kafka controllers
simultaneously by populating multiple `controllers.*Settings` blocks
- same handler, multiple entry points.

### Auth on the Kafka entry: `requiredCallerKind`

A Kafka dispatch runs the same auth pipeline as the other entries, with
one transport rule: it counts as a **machine caller** for
`authOptions.requiredCallerKind`. No human stands behind a consumed event,
and platform-published events (dbEvents, route events) carry no
`x-m2m-token`, so a Kafka-only API declared
`requiredCallerKind: "machine"` is processed:

| `requiredCallerKind` | event `actor` names a user | event names no user |
|---|---|---|
| `any` (default) | processed | processed |
| `machine` | processed | processed |
| `machineWithoutUserIdentity` | rejected 403 `M2M_CALLER_WITHOUT_USER_IDENTITY_REQUIRED` | processed |

That is the ONLY gate the Kafka transport satisfies. It is not a trusted
system trigger like cron or `internal`: `loginRequired`, the role gate,
permissions and ownership still run against the session the event carries
(its envelope `actor`). A framework dbEvent carries the
originating user as its `actor`, so `machineWithoutUserIdentity` refuses
most of them; use `machine` on a Kafka consumer unless the api must never
run on behalf of a person. A rejected message is logged as
`KafkaMessageRejected` (see [Outcomes](#outcomes-applied-completed-miss-rejected-dead-lettered)).

### `permissionCheck` on a Kafka consumer is refused

A consumed message carries no session manager - its identity is the event's
`actor` - so an api's `authOptions.permissionCheck` cannot be decided on this
entry, and the message is **refused with 403** (`KafkaMessageRejected`,
dead-lettered when the api enables the dead-letter topic) instead of being
applied unchecked. The api's `absoluteRoles` (matched against the actor's role)
and a verified machine caller the api admits are decided first and still pass.
Gate a Kafka consumer with `checkRoles` / `absoluteRoles`; the same api keeps
its `permissionCheck` verdict on its REST entry. Validation warns about the
combination (`PERMISSION_CHECK_ON_CALLERLESS_DOOR`). The full rule is in
[Native permissions](../capabilities/native-permissions.md#doors-with-no-caller-session).

## What the message binds to

Each message arrives as the unified event envelope. The service
builds a pseudo-request from it:

| Pseudo-request key | Value | Reached from MScript as |
|---|---|---|
| `body` | `payload.data ?? payload` - the **record**, envelope already stripped | `this.request.body` |
| `event` | the raw envelope (`id` / `type` / `source` / `time` / `requestId` / `actor` / `data` / `old`) | `this.request.event` |
| `session` | the envelope's `actor`; in a multi-tenant project mapped so the actor's `tenantId` also sits under the project's tenant field (`<tenantName>Id`, e.g. `organizationId`), the field the API resolves the tenant from | `this.session` |
| `requestId` | the envelope's `requestId` (else the legacy `_requestId` meta key; for a signed secure-event envelope, the VERIFIED payload's id first, then the outer message's); when the producer stamped none, ONE UUID minted for this message. Resolved once, after the envelope is decoded - the same id the `KafkaMessageReceived` / `KafkaMessageResponded` / `KafkaMessageRejected` / `ErrorInKafkaMessage` lines and the response-topic publish carry | `this.requestId` |

The service finishes booting only once every consumer has joined its group.

**Tenant of a kafka-triggered api.** In a multi-tenant project
the tenant of a kafka-triggered api comes from the event actor and from
nothing else. The event actor spells its tenant `tenantId` (the
transport-neutral envelope name), so the service copies it onto the
project's field (`<tenantName>Id`) before the API runs: a
kafka-triggered create stamps the ACTOR's tenant on the row, and a
kafka-triggered read is filtered to the actor's tenant. The copy only adds
the field (an actor that already carries `<tenantName>Id` keeps its value).
The tenant is never taken from the message body: a record column named
`<tenantName>Id` (or `tenantCodename`) still reaches `this.request.<column>`
and the declared parameters, but the API does not read it as the
tenant on the kafka transport. An event whose actor carries no tenant is
decided by who sent it:

| Actor of the event | Tenant the api runs as |
|---|---|
| carries a tenant | that tenant |
| a system actor: no actor at all, an actor with neither `userId` nor `sessionId` (a cron / scheduler run and the events it raises), or a minted system identity (`roleId: "system"`, `userId: "system:<origin>"`) | the root tenant |
| a user (`userId` or `sessionId`) with no tenant | none: the message is refused with `403 KAFKA_EVENT_TENANT_REQUIRED` before any workflow step runs (pre-auth actions included), logged as `KafkaMessageRejected`, and dead-lettered when the api enables the dead-letter topic |

A single-tenant project has no tenant field and none of this applies.

The publishing side fills "carries a tenant" wherever the request resolved
one. An event raised by a request whose session names no tenant - an
anonymous call on the tenant surface (tenant from the tenant header), or an
M2M call under a minted system session - carries that request's resolved
tenant in `actor.tenantId`: a tenant-only actor `{ "userId": null,
"tenantId": "<id>" }` for the anonymous call, the system actor plus
`tenantId` for the M2M call. Such an event runs as that tenant here, the
tenant its own write was stamped with. A request that resolved the ROOT
tenant stamps nothing, so its events stay system events (root tenant). The
session tenant, when present, always wins.

Declared parameters are the canonical reader: a `dataPath` is a **bare**
record key (`email`, never `data.email`) unless the parameter sets
`httpLocation: "request"`, which resolves against the raw envelope
instead.

**How an id-addressed update/delete finds its row.** On an api whose
route addresses one row (`/memberprofiles/:memberProfileId`), the kafka
reader binds `<object>Id` from the record, in this order:

1. a declared `<object>Id` parameter with a real `dataPath` (for example
   `contentId`) reads that path, then the exact `<object>Id` key;
2. an api that authors a row address NOT keyed on the id - a
   `fullWhereClause` such as `({ userId: this.subjectUserId })` or a
   `selectBy: ["userId"]` on a declared parameter - reads only the exact
   `<object>Id` key. When it is absent the authored clause addresses the
   row, so a route event of ANOTHER object, whose `id` is that
   producer's own primary key, still resolves the right row;
3. otherwise `<object>Id`, then the record's generic `id` - the
   same-object consumer, where the event's `id` IS this row.

An authored clause that mentions `id` / `<object>Id` anywhere, or that is
literal- or session-scoped, keeps rule 3. So does any clause that reads
`this` in a way that cannot be resolved without running it: a computed
member other than a plain string literal (`this[this.key]`,
`this['a' + 'b']`), `this` passed or destructured as a value, or any
template literal. Only `this.<field>` and `this['<field>']` reads of
non-id fields count as a non-id address.

**How an update/delete with no id address finds its row.** An api with
no `:<object>Id` / `:id` route segment and no `<object>Id` / `id`
request parameter resolves its row from the built where-clause alone, so
on the kafka path every selector term must be bound when
the where clause is built. A term binds when it reads a declared request
parameter (populated from the record), the session (the envelope
`actor`), or a context value a workflow action writes at a stage BEFORE
the where clause is built - for example an AddToContextAction at
`afterCheckParameters` that sets `targetContentId`, read by a
`fullWhereClause` of `({ id: this.targetContentId })`. A value written
at `afterBuildWhereClause` or later is not in the clause. Only an
AddToContextAction entry (with a value) or an action's result slot
(`contextPropertyName`, else the action's name) writes such a value; an
AddToResponseAction entry writes the response, not the context. With no
selector authored at all, a workflow action may instead bind
`this.<object>Id` at any stage before `afterFetchInstance`: the
unscoped-mutation guard adds that id to the empty clause. When nothing
can address the row, validation reports `CONSUMER_ROW_KEY_UNREADABLE`
and names any value that a workflow action writes too late.

**Legacy root fields are bounded.** For blueprints written before
the envelope, the service also surfaces the record's own fields at
the pseudo-request root, so a pre-envelope `this.request.<field>` keeps
resolving. That floor never overwrites a key the table above owns, and it
never writes one of the root keys the service reads for itself
(`auth`, `headers`, `M2MToken`, `body`, `query`, `params`, `inputData`,
`mcpParams`, `session`, `requestId`), nor an identity key: `onBehalfOf`,
`eventContext` and `resolvedTenantCodename`. An identity on this
transport comes from the envelope's `actor` and nothing else, so a record
column named `onBehalfOf` can never make the api act for another user. A
record column with one of those names is simply left out of the root; it is
still reachable the canonical way, as a declared parameter or on
`this.request.body`. Record columns with any other name (`userId` and
`tenantId` included) floor as before.

**There is no `this.event` binding** - the service-bound
names are `session` / `params` / `data` / `instance` / `result` and
friends, and a path rooted at an unpopulated name throws on every
message; the handler records one `ErrorInKafkaMessage` line
and the message is not retried. Read the envelope through
`this.request.event` instead.

## Outcomes: applied, completed-miss, rejected, dead-lettered

The API pipeline never throws: every pipeline rejection (parameter
vocabulary, a missing required parameter, an addressed id that does not
resolve, auth, ownership, permission, a stale-version 409, a 5xx) is
returned to the controller as a problem+json body with
`httpStatus >= 400`. The Kafka handler reads that status and
logs one of four outcomes, and an applied one may be partially applied
(the last row of the table).

**A bare not-found miss is a `rejected` outcome.** A get / update /
delete whose addressed row does not resolve answers 404 - and 404 is
`>= 400`, so the
handler logs `KafkaMessageRejected` at **error** for that message, and
again on every redelivery of it. That is the DEFAULT shape: only an api
that declares `apiOptions.onNotFound: "complete"` turns the miss into
the `completed-miss` row of the table below, an info-level
consumed no-op. If a miss is a normal outcome for your applier - a saga
step replayed after its target row is gone, an idempotent delete -
declare that opt-in; without it every such message costs an error line.

Every outcome **commits the offset**: a consumed message is never
redelivered by the service, so the log line and, optionally, the
dead-letter topic are the surfaces to watch. For the **4xx** half of
the range that is also right on the merits - a value outside the
applier's `enumParameters` vocabulary, a row that is gone, an actor
without the permission are all deterministic, and a retry would fail
the same way. For a **5xx** it is a deliberate trade rather than a
claim about determinism: a 500 raised by a transient dependency could
have succeeded on a redelivery, and the message is committed anyway.
There is **no per-api option to leave the offset uncommitted**: under
at-least-once redelivery a deterministic 4xx
becomes an unbounded poison-message loop with no operator surface, so
always-commit plus the opt-in dead-letter topic is the only policy. To
keep a rejected payload for a 5xx, enable `deadLetterEnabled` and
replay the dead-letter topic once the cause is fixed.

| Outcome | When | Log event (level) | Response topic | Dead-letter topic |
|---------|------|-------------------|----------------|-------------------|
| **applied** | the pipeline ran and `httpStatus < 400` | `KafkaMessageResponded` (info) - carries the redacted response | published | - |
| **completed-miss** | `apiOptions.onNotFound: "complete"` and the target row was absent | `KafkaCompletedMissingInstance` (info, `expected: onNotFound=complete`) followed by `KafkaMessageResponded` | published with the `_outcome` marker and the `<object>.<crud>.missed` type | - |
| **rejected** | `httpStatus >= 400` - including a bare not-found miss on an api WITHOUT `apiOptions.onNotFound: "complete"` | `KafkaMessageRejected` (**error**) - `function`, `topic`, `status`, `errorCode`, `detail`, `errors`, `requestId` and the redacted inbound `message` | **not** published | published only when `deadLetterEnabled` |
| **dead-lettered** | rejected, on an api with `deadLetterEnabled: true` | `KafkaMessageRejected` (error); `KafkaDeadLetterPublishFailed` (error) if the publish itself throws; a publish that declines without throwing (no producer registered, send retries exhausted) adds no controller log line, the publisher's own diagnostic is the only trace | - | `{ function, topic, status, problem, message }` wrapped in the standard event envelope, type `<object>.<crud>.rejected` |
| **partially applied** | applied (`httpStatus < 400`), but the 2xx carries `actionFailures`: the row was written and a post-write action did not complete | `KafkaMessageResponded` (info); on an api with `deadLetterEnabled: true` also `KafkaMessagePartiallyApplied` (**warn**) with the `actionFailures` | published (the body carries `actionFailures`) | only when `deadLetterEnabled`: ONE record `{ function, topic, status, actionFailures, message }`, type `<object>.<crud>.partiallyApplied` |

**A partial write is acknowledged, and dead-lettered once.** A
post-write action that fails after the row was committed does not turn
the message into a 500: the write stands, the pipeline answers its 2xx
with the failure listed in `actionFailures` (see
[After the write commits](../workflow/error-handling.md#after-the-write-commits-actionfailures)),
and the handler commits the offset like any applied message. On an api
with `deadLetterEnabled` the handler ALSO publishes one dead-letter record
carrying the original `message` and the `actionFailures`. A **redrive** -
re-publishing that `message` unchanged to the request topic - is the same
request again (same caller, same input), so the retry rules apply:
the post-write actions that completed on the first delivery are skipped
and only the failed ones run, provided the redrive happens inside the
one-hour retry window (after it every action runs again) and the service
is backed by a relational database (a document-store-backed service keeps no completion record). The main
write itself runs again on the redrive: an update or delete addressed by
id converges, but a `create` is not redrivable this way (the create runs
again - a second row, or a conflict when the message carries the id), so
complete a partially applied create's failed actions by hand.

A handler that **throws** (a transport failure, a script that reads an
unbound name) still takes the separate `ErrorInKafkaMessage` path; the
listener swallows it so the partition keeps moving.

`KafkaMessageResponded` and `KafkaMessageRejected` are mutually
exclusive: an alert keyed on `KafkaMessageRejected` sees every
producer/consumer contract drift - a moderation producer that publishes a
`targetType` outside the applier's `enumParameters` vocabulary looks like a
rejection, not a successful apply.

The dead-letter publish goes through the service publisher like every other
outbound event (envelope, credential scrub, breaker), so the payload on
the topic is the **original inbound message** - replayable as-is once the
contract is repaired - plus the problem body the pipeline answered with.
A dead-letter publish failure is logged and never stalls the partition.
Prefer an explicit `deadLetterTopicName` when several appliers consume
the same request topic, so each keeps its own dead-letter stream.

The rejection branch (and so dead-lettering) is part of what a compiler must
provide for a target language; check
[the compiler specification](../../compiler/index.md) for the targets that
implement it.

## Edge controllers: `EdgeKafkaSettings`

For lightweight edge functions (not full Business APIs), the
service-level `edgeControllers[]` carries its own
`edgeKafkaSettings` block with the same intent but a smaller surface:

```json
{
  "edgeControllers": [
    {
      "edgeKafkaSettings": {
        "kafkaEnabled":  true,
        "requestTopic":  "telemetry.raw",
        "responseTopic": "telemetry.normalized"
      }
    }
  ]
}
```

Edge controllers are intentionally narrower than Business APIs -
they're for ETL-style steps that don't justify the full action-store
workflow.

### Edge outcomes

An edge function has no API pipeline, so its outcome is decided by
what it RETURNS. A `{ status, headers?, body? }` return is the
response envelope; anything else is the result itself, with an implied
status of 200. The kafka leg answers the same taxonomy as a business
api:

| Outcome | When | Log event (level) | Response topic |
|---------|------|-------------------|----------------|
| **applied** | a non-envelope return, or an envelope with `status < 400` | `EdgeRequestResponded` (info) - `statusCode` | published: the envelope `body` (a non-object body is wrapped under `body`, a Buffer as base64), or the raw return |
| **rejected** | an envelope with `status >= 400` | `EdgeKafkaMessageRejected` (**error**) - `function`, `topic`, `statusCode`, `requestId` and the redacted refusal `body` | **not** published |
| **threw** | the edge function raised | `ErrorInEdgeRequest` (error) | not published |

A refusal is therefore never published to `responseTopic` as if it were
the answer: a consumer of that topic reads results only. A consumer of that
topic never sees the 4xx bodies; the replacement channel is the
`EdgeKafkaMessageRejected` ERROR log line, which carries `statusCode`, the
`topic`, the `requestId` and the redacted refusal `body`. The edge leg has
no dead-letter topic of its own, so that line is the whole surface - alert
on the event name.

The **offset policy is the business-api one** - the handler returns
normally, so the offset commits and the message is not redelivered, and
there is no per-controller opt-in for leaving it uncommitted. The REST leg is
untouched - a 4xx there is an ordinary HTTP answer with its own status code on
the wire.

## Outbound Kafka: auto-events

Every primary `DataObject` publishes lifecycle events to Kafka
automatically without any explicit per-object config. The generated
data layer raises a create, update or delete event on every successful
write, with topic:

```
<serviceCodename>-dbevent-<objectname>-<created|updated|deleted>
```

where `<serviceCodename>` is the owning service's project-scoped
codename (`<projectCodename>-<serviceName>-service`, lowercase) and
`<objectname>` is the lowercased DataObject name - e.g.
`acme-orders-service-dbevent-order-created`. This is the family a
Kafka controller's `requestTopicName` (or an EventNotification
`channel`) points at when a consumer wants "every change to this
DataObject".

### The `-dbevent-` payload

The event carries the **normalized** row under `data` - the same shape a
read api returns - stamped with the record's `_type`, and on an update
the pre-change row under `options.old` in the same shape. The
identity field is a **string `id`** on every database
engine; a document store's native `_id` and `__v` never reach a consumer.
So an applier may key on `data.id` for `created`, `updated` and `deleted`
alike, and diff `data` against `old` field by field without allowing for
two different shapes of the same row.

The broker also carries an
`elastic-index-<project>_<objectname>-<verb>` family: the **internal**
search-index sync events, consumed by the generated service's own
indexer and by its read-model (DataView) listeners. Subscribing there is
legitimate only when you need post-materialization timing (they fire
after the search-index write succeeds) - they are best-effort and
exist only for indexed objects; the reliable lifecycle family is
`-dbevent-`.

`-dbevent-` create/update events (and the route events) are published
only after the source service's search projection write has
settled, or after its wait budget (default 3000 ms) has run out, so an
applier that reconciles by
re-reading the source object through the cross-service read path (a
`service:object` `FetchObjectAction`, or a remote fetch by query)
sees the post-event row on the **first** event whenever the search index
answered in time. Three caveats when you write such an applier:

- If the source's index attempt failed, the event still publishes and
  the projection is stale. When the applier must stay correct under
  that failure, apply the event payload (`data`, and `old` on updates)
  instead of re-reading.
- If the search index stalled and the source's wait budget expired, the
  event still publishes (the source logs `ElasticProjectionWaitExpired`
  and lets the attempt land whenever it does), so the same stale read
  is possible for that one write. The late landing cannot go BACKWARDS
  though: every projection write carries the row's `updatedAt` as an
  external version, so a landing older than the
  document already indexed is rejected by
  the cluster. The wait is bounded on purpose:
  an open-ended wait would make every create and update in the source
  service hostage to the search tier. The payload is the correct source
  under this case too.
- `deleted` is ordered the same way: the source awaits its
  index removal (bounded by the same budget) before it publishes, and
  the removal is versioned, so a re-read inside a `deleted` handler no
  longer finds the row unless the source's wait expired. Use the
  payload when that matters.

On an object with [`objectModeration`](../capabilities/object-moderation.md)
the family follows the real row. In `staged` mode a held write publishes
nothing; a reviewer's accept replays it through the object's own api, so
`created` / `updated` fire then. In `onPlace` mode every row publishes as
written, unapproved ones included, with `moderationStatus` in `data`, and a
reviewer's accept or reject arrives as an `updated` event: a consumer that
must not act on unapproved content filters on that column.

Application events emitted from a business API workflow use
[`PublishEventAction`](../../spec/PublishEventAction.md) from the
action store - not this controller. For naming conventions when you
write topic strings yourself, see
[Kafka topic naming](../best-practices/kafka-topic-naming.md).

## Topic names are literal

Anywhere a topic name is expected - `requestTopicName`,
`responseTopicName`, `PublishEventAction.topic`, an
`EventSubTopic.topic`, a realtime hub's `kafkaEvents[].topic`, an agent's
`kafkaControllers[].topic` - the string is a Kafka topic, not an alias.
No shorthand is resolved: `createUser:done`, `user:created` or
`dbEvent:user:updated` is published or subscribed under exactly that
spelling, and a consumer naming such a string gets the
`KAFKA_TOPIC_UNKNOWN_PRODUCER` warning because nothing in the project
publishes it. Name the framework topic itself, for example
`actionpro-orders-service-dbevent-order-created`.

When a consumer names the derived route topic of a project API, with or
without the project codename prefix, and that API's
`raiseApiEvent` is false or omitted, validation instead reports the error
`KAFKA_TOPIC_API_EVENT_DISABLED`, naming its service and API. Set
`apiOptions.raiseApiEvent: true` on that producer. External request channels
remain valid; the error requires either spelling to match a disabled project route.

Two rewrites are applied, on every publish, every subscribe and the boot
pre-create, through one door in the generated service (the project scope,
then the deployer's mapping, each exactly once):

- **The project scope.** A topic that a `PublishEventAction` of the project
  authors, and a framework topic of the project written without the codename,
  goes on the wire as `<projectCodename>-<topic>`. Any other string is left
  alone. See the [naming rule](../best-practices/kafka-topic-naming.md#the-wire-name-is-project-scoped).
- **The deployer's mapping.** A deployment may register a function that maps
  every logical name to a physical one (for example a prefix-aware name) on the
  producer and the consumer side alike. The default is the identity. The
  consumer **group** id is derived from the scoped, unmapped name and does not
  move with the mapping; the note on the
  [topic naming page](../best-practices/kafka-topic-naming.md#migrating-an-existing-consumer)
  says what to measure on such a deployment.

### Hand-written consumers and the naming rule

A `requestTopicName`, a `responseTopicName` and every topic string on
this page is written **bare** (the [naming
rule](../best-practices/kafka-topic-naming.md#the-wire-name-is-project-scoped)):
a topic some `PublishEventAction` of the project authors goes on the
wire as `<projectCodename>-<topic>` and the generated service applies that on
both ends. Code you write by hand passes the authored name to
the service's publisher or listener, or, against a raw client, asks the
service's topic-name function for the broker-side string - it
never composes the prefix. Validation reports the two contract gaps at
WARNING level: `KAFKA_TOPIC_NEVER_CONSUMED` for an explicit response
topic nothing in the project reads, and `KAFKA_TOPIC_NEVER_PRODUCED`
for a consumed topic nothing in the project produces (a request topic
is exempt: its producer is the caller by design). The families excluded
from each check are listed on the [topic contract
check](../best-practices/kafka-topic-naming.md#the-topic-contract-check)
section.

## Topic pre-creation at boot

A consumer that subscribes to a topic that does not exist yet is
assigned nothing, and a consumer's metadata refresh interval is longer
than the assertion windows most tests and health probes use - so on a
**cold** broker the subscription stays empty for a whole window even
though auto topic creation creates the topic moments later. To
close that window, boot **pre-creates the topics this service declares**
before mounting its consumers.

The declared set is the produced census plus the **design-time** consumer
registrations - kafka-controller request topics, edge kafka triggers,
`eventSubscriptions`, realtime-hub kafka events, agent
`kafkaControllers` and notification `eventNotifications` - deduped,
sorted, and each name routed through the same door the
publishers and listeners use (the project scope, then the deployer's
mapping, [above](#topic-names-are-literal)), so a deployment that remaps logical topic names
pre-creates exactly the *physical* ones its producers and consumers use.

The pre-create is **idempotent and never throws**. It lists the broker's
topics first and skips the create entirely when nothing is missing, so
an ordinary warm boot costs one metadata read. A broker that refuses
topic creation - an ACL that lets the service account produce and
consume but not administer - costs one warning and the boot continues.
Whenever the pre-create does not complete, topics are simply left to the
broker's own auto-creation on first publish or subscribe.

It is, however, **loud when it fails**. A genuine failure or a
budget give-up logs at **error**, names the topics that are not on the
broker, and states the consequence - every consumer that subscribes to
them joins its group, reports a healthy mount and receives nothing. The
one exception is the ACL refusal above, which stays a single warning:
that deployment's operator creates its own topics. Nothing throws on any path.

Operator settings (compression codec, default partition count and replication
factor of created topics, pre-create timeout, watch interval and limit, family
re-mount backoff) are environment settings of the generated service, not
blueprint properties. The defaults are one partition and one replica on every
topic the service creates, which is operator-set on purpose: a pre-created
topic must not silently pin a production cluster to a single partition. See
[the compiler specification](../../compiler/index.md).

### Boot events

Every exit publishes exactly one outcome, so the boot log always says
which one happened.

| Event | Level | When |
|---|---|---|
| `KafkaTopicsEnsured` | info | The declared set exists. `outcome` is `exists` (nothing was missing) or `created`; the payload carries `topicCount` and `createdCount`, and on a create the topic names plus the partition / replication numbers used. |
| `KafkaTopicPrecreateUnauthorized` | warn | The broker refused the admin call (`TOPIC_AUTHORIZATION_FAILED` and friends). Logged once; boot continues. The payload names the topics it could not establish. |
| `KafkaTopicPrecreateFailed` | **error** | The admin call failed for any other reason. Boot continues. The payload names `missing` (truncated at 50, with `missingCount` always exact), the effect and the remedy. |
| `KafkaTopicPrecreateIncomplete` | **error** | The pre-create timeout expired. The payload names which step did not settle - the connect, the list or the create - and the unestablished set. A give-up *before* the broker list was read reports **every** declared topic as missing, because nothing is known to exist. |
| `KafkaTopicCodenameFallback` | error | The project blueprint declares no codename, so every derived topic carries a fallback prefix and two such projects on one broker share a topic namespace. A blueprint defect, invisible from inside a single project: set the project codename. |
| `KafkaConsumersUnestablished` | error | Part of the **declared consumer set** is not live after the family mounts. Names `unassignedTopics`. See below. |
| `KafkaTopicWatchStarted` | warn | The watch is running because something above was missing. |
| `KafkaTopicsAppeared` | info | Topics appeared between two watch ticks; the consumers holding them left and rejoined their groups. |
| `KafkaConsumersEstablished` | info | Every declared consumer topic is live. The watch stops. A listener family that is still being re-mounted is named in `failedFamilies` on the same line. |
| `KafkaTopicWatchGaveUp` | error | The watch limit expired with topics still unassigned; those handlers will not fire for the life of the process. |
| `KafkaListenerFamilyFailed` | error | A listener family's mount threw. The next family still mounts, and this one is re-mounted on a backoff. |
| `KafkaListenerFamilyRemountFailed` | warn | One re-mount attempt failed; names `attempt` and `nextDelayMs`. |
| `KafkaListenerFamilyRecovered` | info | The family mounted on a re-mount attempt (`attempts`); it no longer counts against `established`. |

### Is the declared consumer set actually live?

A pre-create that ran is not the same as a consumer that is consuming.
A consumer subscribed to a topic the broker does not have is assigned
no partition for it: it joins its group, registers as mounted, counts
toward the consumer count - and receives nothing, forever. Build ORDER can
be silently correctness-bearing: a project whose consumers build before its
producers can lose its wiring.

So the declared consumer set has its own verdict, computed from
the declared `consumed` literal, the mounted-listener registry and the broker
topic list the pre-create read, and published in three places:

- **the boot log**, as `KafkaConsumersUnestablished` at error level,
  naming the topics;
- **the anonymous health route**, as `kafka.consumers: { declared, subscribed,
  joining?, unassigned, established }`. Counts only: that route is
  anonymous, and a topic name is a roster of the project's domain
  objects. `status` stays `ok` and the route still answers 200: a
  degraded event plane must not fail a liveness probe and restart a
  process that is serving every route correctly;
- **the admin health route**, as `kafka.consumers.unassignedTopics` (and
  `joiningTopics`) by name, for the operator who can act on it.

A topic is *subscribed* only once **every** mounted listener holding it
has **joined** its group **with a partition of that topic**: the group join
carries the member's assignment, and it fires with an
empty one when the coordinator gave the member nothing - two live members
on a one-partition topic, which is exactly a new generation joining while
the previous one still holds the partition. A listener registers
the moment it connects, but until a join with a partition it is *joining*
(or *joined, no partition*) - waiting out a previous generation's members
that never left, a rebalance, or a crash/restart loop - and its handler
does not fire. Such a topic is reported under `joiningTopics` (named on
the admin health route, counted as `joining` on the anonymous one) and counted as
unassigned until the join lands, and the admin health route names the
memberships behind it as `joiningConsumers: [{ groupId, topics, state,
unassignedTopics }]` with `state` `joining` or `joined-no-partition`.
Judged per listener: a business API's per-API controllers are separate
consumer groups on the same topic, and the topic is subscribed only when
each of them consumes it. A rebalance, crash, stop or disconnect moves a
listener back to joining until its next group join.

A topic is *unassigned* when no mounted listener subscribed to it, when
its listener is still joining, or when a listener did subscribe and the
broker has no such topic. All produce the identical silent symptom, so
all are reported.

A topic only an **eventSubscription** of the service reads is *on demand*
and is not judged. The socket layer mounts an eventSubscription's consumer
on the first websocket / SSE subscriber and stops it on the last, so no
listener holds the topic at boot, or for as long as nobody is subscribed.
Such topics are still pre-created, but they leave `declared`, are named on
the admin health route as `onDemandTopics`, and never count as unassigned. A
topic that another family of the same service also consumes (a realtime
hub kafka event, a kafka controller) is mounted at boot by that family and
stays judged. A service whose consumed topics are all on demand has no
consumer verdict at all, like a service that declares none. The
declared-topic watch still covers an on-demand topic that is absent from the
broker: it re-creates it and rejoins a mounted consumer when it appears,
without the topic ever counting toward `established`.

### Leaving the groups at stop

At shutdown the service asks every mounted consumer to leave its group at
once, bounded by a single shared budget (not one budget per consumer in a row,
which would let the hosting runtime's hard kill come first so no leave went
out and the next generation waited on the dead members). A handler still
running after a short grace period is **abandoned**: its message stays
uncommitted and is redelivered after the restart (at-least-once), and the
consumer leaves. This is logged as `KafkaHandlersAbandonedAtStop` (the sweep,
with the count) and `KafkaHandlerAbandonedAtStop` (once per listener).

**And the runtime repairs it.** While anything is unassigned, a watch
re-runs the pre-create on an interval; when topics
that were missing **appear**, the consumers holding them leave and
rejoin their groups, and the newly-created topics are read **from the
beginning** - a rejoin that resumed from "now" would fix the wiring and
still drop everything published in between. Topics the
group already has committed offsets for are untouched: reading from the
beginning applies only where there is no committed offset. A rejoin happens only
on a tick where topics demonstrably appeared, so a broker that stays
broken costs metadata reads and never a rebalance storm, and the watch
declines to start at all when the set is already established - which is
every warm boot.

What the watch does **not** repair: it acts on topics that are absent from
the broker. A topic that exists while its consumer never subscribed (see
`failedFamilies`: a failed family is re-mounted on its own backoff) or
stays joining (see `joiningConsumers`) is not the watch's to fix; a
consumer that stays joining needs the service restarted.

### A listener family that fails to mount

Consumers are mounted in families (kafka controllers, job workers,
read-model listeners, notification listeners, ...), and a family whose
mount throws is contained so the next family still gets its turn:

- a consumer whose subscribe or start throws after it connected
  **releases** itself: it leaves the mounted-listener registry and its
  consumer is closed, so its topics read as unassigned;
- the family is recorded as failed, and `kafka.consumers.established`
  is `false` on the anonymous health route until it mounts - also on a service that
  declares no consumed topic, such as a BFF-only service. The names ride
  on the admin health route as `kafka.consumers.failedFamilies`;
- the family is **mounted again** on a backoff (5 s, doubling, capped at
  60 s) until it mounts or shutdown begins. A
  re-mount runs the family's own mount again, so a consumer of that
  family that is already running is not joined a second time;
- shutdown wins over a mount in flight: once shutdown begins, a listener
  still connecting, subscribing or starting releases its consumer instead
  of joining, and the re-mount loop starts no further attempt.

The declared-topic watch above judges topics only; a failed family is
this loop's to repair, so the watch neither starts over one nor "gives
up" on it.

### What the declared set does not reach

The set is COMPOSED from censuses the generated service already keeps; it
derives no topic of its own. Listener families that derive their topics
inside their own generated layer are therefore not in it:

- the **BFF DataView** family - a `bff` service declares no consumed topic
  here while its generated layer subscribes to the DataView topics,
- the **external-feed db-event** listeners,
- the **video / content pipeline** workers.

That gap is narrower than it looks: every DataView topic belongs to the
**internal index-sync** family - an `elastic-index-<index>-<verb>` name
PRODUCED by the service that owns the object, never a subscription surface you
should reach for yourself - so on a full project bring-up each one is
pre-created by its own producer's boot. The exposure is a single such consumer
booted alone against a cold broker, ahead of its producers.

### Scope of "before any subscribe"

The ordering guarantee is real, and its scope is deliberate. The
pre-create runs ahead of every consumer family mounted in the Kafka layer, so
those consumers cannot subscribe before it. The realtime-hub bridges and the
agent-hub dynamic consumers mount from modules the service launches without
awaiting, so they are **not** ordered after the pre-create. In practice every
topic a hub bridge mounts is in that same service's own declared produced set,
so it is pre-created, just not provably before the bridge asks for it. The
agent hub's declared `consumed` is empty, so its dynamic consumers pre-create
nothing here at all.

## Agent-triggered consumers

[`AgentKafkaController`](../../spec/AgentKafkaController.md) on an
`AIAgent` is the agent-side analogue of `ApiKafkaSettings`: an agent
runs when a configured topic delivers a matching message, and the
controller's `dataMapping` shapes the agent's input from the message.
Several controllers can be attached to one agent to fan out across
topics. See [AI agents](../system-services/agent-hub.md#kafka-triggered-agents).

- **Consumer group.** Each controller consumes in its own group,
  `<SERVICE_CODENAME>-agent-<agentName>-<controllerName>` (made legal for
  the broker like every derived group id), so two controllers on one topic
  both see every message and replicas of the service share the work. An
  explicit `groupId` on the controller replaces it verbatim.
- **Result event.** A run that completes (from this controller, the
  agent's own REST or SSE route, or an in-process agent call; the
  agent hub's wildcard `/agents/:agentName` routes publish none)
  publishes an `agent-result` event on
  `<serviceCodename>-agent-<agentName>-result`, where `<serviceCodename>`
  is the host service's `<projectCodename>-<serviceName>-service`
  (lowercase; `...-agenthub-service-...` for an agent of the agent hub).
  The envelope's `actor` is the run's tenant alone
  (`{ "userId": null, "tenantId": "<id>" }`, none for a single-tenant or
  root-tenant run) and its `data` is:

  ```json
  {
    "_eventType": "agent-result",
    "_agent": "supportBot",
    "_source": "kafka",
    "_sourceController": "onEscalation",
    "_userId": "system:kafka:supportBot.onEscalation",
    "_onBehalfOfUserId": "u-17",
    "_timestamp": "2026-10-19T10:00:00.000Z",
    "resultType": "string",
    "resultPreview": "Escalated to tier 2 ...",
    "truncated": false
  }
  ```

  `_source` is `kafka`, `rest`, `sse` or `internal`; `_sourceController` is
  set for a Kafka run only, and `_onBehalfOfUserId` only when the
  triggering event named a user. The output is a preview: at most 512
  characters of the serialized result (`truncated: true` past that). The
  full output stays on the run's `sys_agentExecution` row. A run paused for
  approval publishes no result event; a Kafka-triggered run publishes it
  when it is resumed and completes.

## Progress streaming: `KafkaProgressListener`

When an SSE-backed business API spawns a long-running pipeline
elsewhere (another service, a queue worker), mount a
[`KafkaProgressListener`](../../spec/KafkaProgressListener.md) on its
`sseSettings.kafkaProgressListeners[]` to relay topic messages back to
the client after the main pipeline completes. The listener:

- Subscribes to `topic` (written literally and project-scoped like every
  consumed topic, see [Topic names are literal](#topic-names-are-literal)).
- Filters incoming messages by matching `kafkaFilterField` against the
  current pipeline's `correlationField`.
- Relays each match as an SSE event named `eventName`.
- Optionally closes the SSE connection when `completeWhen` evaluates
  truthy on a message.

Use for indexed builds, long ML jobs, or any flow where the
worker that does the work is not the service that holds the client
connection. Full configuration, the relay lifecycle, and a worked
example live on [SSE streaming](sse-streaming.md#kafka-progress-listeners-relay-remote-updates).

## Multi-cluster

Project-level Kafka cluster routing is configured under
`projectSettings.kafkaSettings` (a separate part of the blueprint). Per-controller
overrides - pointing one topic at a different cluster - happen there,
not on the `ApiKafkaSettings` block.

## See also

- [Event subscriptions](../capabilities/event-subscriptions.md) - client-facing read
  channels over the same topics.
- [M2M communication](../system-services/m2m-communication.md) - service-to-service
  trust on the consumer side; signs `PublishEventAction` payloads
  for secure-event consumers.
- Best practices: [Kafka topic naming](../best-practices/kafka-topic-naming.md).
- Schema: [`ApiKafkaSettings`](../../spec/ApiKafkaSettings.md), [`EdgeKafkaSettings`](../../spec/EdgeKafkaSettings.md), [`BusinessApiControllers`](../../spec/BusinessApiControllers.md), [`PublishEventAction`](../../spec/PublishEventAction.md).
