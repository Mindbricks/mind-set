---
title: Kafka topic naming
---

# Kafka topic naming

The generated service owns most topic names you'll encounter. Knowing the
shape it produces — and the rules for the ones you author yourself —
keeps subscriptions readable and routable. This page states the naming
contract a conforming compiler provides; how a compiler wires its
producers and listeners is in
[the compiler specification](../../compiler/index.md).

## DB-level events — what the generated service emits

The service can publish **two** topics on a DataObject CRUD
lifecycle event, and they are not symmetrical: the service db-event
fires unconditionally on every successful write, while the indexer
topic exists only for Elasticsearch-indexed objects and fires
best-effort, after the index write. Subscribe to the db-event family
unless you specifically need the indexer timing (below).

### Indexer topic — internal index-sync

```
elastic-index-<indexName>-<verb>
```

- `indexName` is the Elasticsearch index name, conventionally
  `<projectCodename>_<bareObjectName>` (e.g. `acme_order`).
- `verb` is one of `created`, `updated`, `deleted`.

This family is the **internal** index-sync signal, consumed by the
service's own indexer machinery and the BFF DataView listeners.
Subscribing to it yourself is legitimate in one narrow case: when
your logic needs **post-materialization timing** — the event fires
only AFTER the Elasticsearch write succeeds, so the row is already
queryable in the DataView. Know the trade-off before you depend on
it: the data layer awaits the index attempt for a bounded time and never
fails the write on it, so an ES outage, a stall past the budget or an
unconfigured indexer drops the event silently, and only indexed objects
have this family at all. A consumer that needs "every change
to this DataObject" belongs on the service db-event topic below.

| Topic | Meaning |
|---|---|
| `elastic-index-acme_order-created` | A new `Order` was inserted in the `acme` project. |
| `elastic-index-acme_order-updated` | An `Order` row was updated. |
| `elastic-index-acme_user-deleted` | A `User` row was deleted in the `acme` project (soft delete in most projects). |

### Service db-event topic — service-local

Alongside the indexer topic, the generated data layer also raises a
per-service db-event on every write, with topic name:

```
<SERVICE_CODENAME>-dbevent-<objectname>-<verb>
```

- `SERVICE_CODENAME` is the owning service's **project-scoped** codename
  (`<projectCodename>-<serviceName>-service`, lowercase).
- `objectname` is the lowercased DataObject name (e.g. `order`).
- `verb` is `created` / `updated` / `deleted`.

| Topic | Meaning |
|---|---|
| `shop-customer-service-dbevent-order-created` | A new `Order` was inserted in the `customer` service. |
| `shop-customer-service-dbevent-order-updated` | An `Order` row was updated; the envelope carries the new row under `data` and the pre-change row under `old`. |
| `shop-customer-service-dbevent-cart-deleted` | A `Cart` row was deleted in the `customer` service. |

This is the canonical subscription surface: reliable (published on
the write path itself), present for every DataObject, and carrying
the verb of the actual DB operation.

Every message is the unified event envelope
`{ id, type, source, time, requestId, actor, data, old? }` — the row
(stamped with `_type`) rides under `data`; never a session or tokens.

Use this topic when a service needs to react to its own writes
without subscribing to the project-wide indexer topic — typically
intra-service projections, audit fan-out, or quick replay-from-now
debugging where the cross-service indexer scope is too wide.

### Topic aliases — a deployment seam, applied on both sides

There is no alias DSL in a blueprint (no `createUser:done`,
`user:created`, `dbEvent:user:created` shorthand). Subscribe to and
publish on the literal topic names this page documents. If a deployment
needs a physical-name mapping (a broker prefix, say), the generated
service offers a deployment-level topic alias seam. A mapping you install
is applied **symmetrically**: on every publish, on every subscribe
(including the event subscription runtime) and on the boot topic
pre-create (see
[Kafka controllers](../business-apis/kafka-controllers.md#topic-pre-creation-at-boot)).
The project scope of the next section is applied first and your alias
second, each exactly once.

**One exception: the MCP-BFF AMQP mirror.** The MCP-BFF mirror resolves its
mirrored topic names at build time. The build knows the project scope but not
your alias mapping, so the mirror keeps producing and consuming the unaliased
names. On a deployment with a non-identity alias mapping, do not rely on the
Kafka–AMQP mirror.

## API events — what you author

The two topics above are emitted by the generated service and use the hyphenated
`elastic-index-*` / `<svc>-dbevent-*` shapes. Topics you author
yourself — application-level lifecycle events that aren't tied to a
single DataObject row write — have no imposed format for the
part you write. The recommended convention is dotted:

```
<sourceService>.<resource>.<lifecycle>
```

| Topic | When |
|---|---|
| `orders.checkout.completed` | The `checkout` API in the `orders` service succeeded. |
| `auth.passwordReset.requested` | A password reset BusinessApi ran. |
| `notifications.email.sent` | A custom email-dispatch API finished. |

### The wire name is project-scoped

The name you author is **not** the name on the broker. A topic you
publish from a `PublishEventAction` goes on the wire as:

```
<projectCodename>-<authoredTopic>
```

so `action.assigned` in the `actionpro` project is
`actionpro-action.assigned`, and the table above becomes
`shop-orders.checkout.completed` in a project whose codename is `shop`.
`<projectCodename>` is the project's root `codename` with non-word
characters stripped and lowercased — the same first segment
`SERVICE_CODENAME` carries, so an authored topic sits in the same
namespace as every derived one.

The reason is isolation, not tidiness. Every derived family is project-scoped;
if authored topics were not, two projects on one broker — or two instances of
the *same* project under different codenames — that both authored
`action.assigned` would publish into and consume from one topic.

**You never write the prefix yourself.** Every door onto the broker applies
the rule: publishing, subscribing (event subscriptions, realtime-hub
kafka events, agent kafka controllers, notification event notifications,
kafka controllers) and the boot topic pre-create. So:

- author the bare topic in the blueprint, and subscribe to the bare
  topic in an `eventSubscription`, a realtime-hub kafka event, an agent
  `kafkaController`, a notification `eventNotification` or a kafka
  controller's `requestTopicName` — both ends are scoped for you;
- in hand-written code (a listener you add beside the generated code, a hub
  bridge), pass the **authored** name to the service's publisher or
  listener and let the service scope it. Never compose
  `` `${codename}-${topic}` `` yourself: a hand-composed string is the
  one thing that can disagree with the declared-topic census and with the
  pre-create.

The rule is idempotent, so a topic you deliberately author inside the
project namespace already (`actionpro-auth-service-user-logged-in`) is
left exactly as written — it is never prefixed twice.

### A consumer subscribes to the produced spelling

Kafka topic names are case-sensitive; the design-time producer match is
not. A consumer that names its topic with a different case than the
producer writes it (`acme-audit-service-dbevent-auditEntry-created`
where the data layer publishes `acme-audit-service-dbevent-auditentry-created`)
still matches at design time, and the validator says so with
`KAFKA_TOPIC_CASE_DRIFT`. The generated consumer subscribes to the
**produced** spelling in that case, so every consumer family (kafka
controllers, agent `kafkaControllers`, notification channels,
realtime-hub kafka events, event subscriptions) receives what the
producer wrote. Write the produced spelling anyway, so the design and the
wire agree. A topic the project does not produce (an external system's) is
subscribed exactly as written.

### The four topic slots, and which side each is on

A blueprint names a Kafka topic in four places, and they do not all take the
same string. Which side the slot is on is the whole rule:

| slot | side | what to write |
|---|---|---|
| `PublishEventAction.topic` | produce | the topic BARE; the publish door adds `<projectCodename>-`. Authoring the prefixed name double-prefixes it. |
| `controllers.kafkaSettings.requestTopicName` | consume (request channel) | the topic the CALLER publishes to. Unset derives `<serviceCodename>-<resource>-<action>-request`. Each entry of `requestTopicNames` (additional topics of the same api) follows the same rule. |
| `eventNotifications[].eventDataSettings.channel` | consume | the WIRE topic of the event being subscribed to. |
| a `KafkaController` / kafka edge trigger bound to an existing event | consume | same as `channel`. |

On the consume side the project codename is the only optional segment: the
subscribe door prefixes it when the rest of the string names a topic the
project produces. Nothing *after* the codename is optional — a framework
event's wire name is `<projectCodename>-<serviceName>-service-<event>`, so a
bare `<event>` binds a topic nobody publishes.

The producer check runs on every consume slot EXCEPT the request channel,
whose producer is outside the project by design
(`KAFKA_TOPIC_PRODUCED_OUTSIDE_BY_DESIGN`): applying it there would report
the default request topic of every Kafka-controller api as unproduced.

### The `raiseApiEvent` topic: derived, and overridable

An api with `raiseApiEvent: true` publishes on
`<serviceCodename>-<suffix>`, and the suffix is **derived from the API
name by verb inversion** — `<resource>-<passive verb>`. For a CRUD verb
that is unsurprising (`createOrder` -> `order-created`). For anything
else it frequently is not:

| API name | derived suffix | what the spec usually says |
|---|---|---|
| `followUser` | `user-followed` | `follow-created` |
| `intakeContent` | `content-intaked` | `content-ingested` |
| `processRefundRequest` | `refundrequest-processed` | `refund-processed` |
| `subscribeToPlan` | `toplan-subscribed` | `subscription-created` |
| `confirmPayoutBatch` | `payoutbatch-confirmed` | `payout-confirmed` |
| `inviteOrganizationAdmin` | `organizationadmin-invited` | `organizationmember-created` |

The failure mode is a **consumer bound to a dead topic** — it subscribes
successfully, joins its group and receives nothing, with no error anywhere.

Two things fix it:

1. **`apiOptions.raisedEventTopic`** names the topic explicitly. An ordinary
   suffix becomes `<serviceCodename>-<raisedEventTopic>`. A complete topic
   already starting with `<serviceCodename>-` is used once. Overrides are
   trimmed and lowercased. For project `acme`, service `social`, both
   `follow-created` and `acme-social-service-follow-created` publish on
   `acme-social-service-follow-created`. A bare service codename, a partial
   prefix, or another service prefix remains an ordinary suffix.
   It must satisfy Kafka's character class (`a-z A-Z 0-9 . _ -`) and the
   composed name must stay within 249 characters; an illegal value is a
   validation **error** and is ignored, so the derived name still ships
   rather than a string the broker would refuse at subscribe time.
   It moves the **topic only** — the generated publisher and event class
   keep their derived names, so an override can neither rename nor collide
   a generated symbol.
   Do not start the override with `dbevent-` or `lcevent-`: those are the
   reserved infixes of the DB-level family and of the opt-in payment /
   subscription / invoice lifecycle family, and an override such as
   `lcevent-payment-order-captured` publishes onto a framework topic next
   to the framework producer. Validation refuses either prefix, case-insensitively,
   with `RAISED_EVENT_TOPIC_INVALID` naming the reserved family. The override is
   ignored and the derived API event name still ships.
2. **An unguessable derived name is reported to you** in the write /
   validate output, as the warning
   `KAFKA_RAISED_EVENT_TOPIC_UNGUESSABLE` on the api's own
   `apiOptions.raiseApiEvent` path. It names the wire topic *and* the
   derivation rule, so you see it at authoring time.

   It is deliberately **narrow**. A CRUD derivation (`createOrder` →
   `order-created`, `getOrder` → `order-retrieved`) surprises nobody and
   says nothing; a warning on every event in the project would train you
   to ignore the code. The gate is the derived passive verb: the five CRUD
   forms are silent, everything else warns. All six names above are
   selected by it. Setting `raisedEventTopic` silences it — you have named
   the topic, so the decision it prompts is already made.

   It says nothing about **compiler-injected** APIs (the payment,
   invoicing, fiscalization, ledger, compute and saved-filters surfaces
   added to your service). Those names are not yours to choose
   and carry no `raisedEventTopic` you could set, so a warning about them
   would be one you cannot act on. Their wire topics are still part of the
   service's topic census like any other.

   It is a **warning, not an auto-fix**: nothing was rewritten. That
   distinction is load-bearing — an auto-fix record means the validator
   changed your config, and auto-fixes are the one tier a write
   response never scopes away.

### Subscribing to a framework-derived event

The derived families — `<serviceCodename>-dbevent-…`, route
events, `elastic-index-…`, the opt-in payment / subscription / invoice
lifecycle topics `<serviceCodename>-lcevent-<family>-<object>-<event>`
and the rest — are already project-scoped when the **producer** composes
them, because the producer builds the name out of `SERVICE_CODENAME` and
cannot leave the prefix off. A **consumer** can: an `eventSubscription`
topic, an agent `kafkaController.topic`, a notification `channel` and a
kafka controller's `requestTopicName` are all strings somebody types.

Write the full name, codename included — `shop-orders-service-dbevent-
order-created`, not `orders-service-dbevent-order-created`. If you write
the short form anyway, the compiler completes it for you: a name that
becomes a topic *this project produces* once the codename is prefixed is
scoped like an authored one, on both sides of generation and at both
doors. That rescue exists because the failure it replaces was silent — the
subscription simply never received anything — and not as a second spelling
to rely on. The topic census, the pre-create, the topic-graph findings and
the MCP-BFF manifest all resolve it the same way, so the short form is not
a different wire contract; it is the same one, reached late. See
[Migrating an existing consumer](#migrating-an-existing-consumer).

### A subscription with no producer is reported at boot

A consumer that subscribes to a topic **no producer in your project
publishes** is indistinguishable from a working one at the broker: the
subscribe succeeds, the consumer group joins, and the feature is dead. The
generated service names those subscriptions at boot: the mount census
reports `KafkaSubscriptionsWithoutProducer` with the `(topic, groupId)`
pairs and an `unproducedSubscriptionCount`, and each listener warns once,
by topic and group, as it mounts (which is how a lazily-mounted
`eventSubscription` consumer reports too).

It is a diagnostic, not a boot failure: subscribing to a partner
system's topic is a legitimate shape, and the line tells you which
reading applies. What it is *not* is optional to read, and neither is
the rest of the census —

> `failedFamilies: []` means no listener family's registration threw. It
> has never meant that every subscription is live.

`abortedFamilies` (shutdown began mid-walk), `pendingFamilies` with
`partial: true` (the boot wait expired), a lazily-mounted
`eventSubscription`, and `unproducedSubscriptionCount` are each a
way for a subscription not to be delivering while that list is empty.
Read the census as a set of signals rather than as one boolean.

### A topic published from designer code: declare it

The census is built at design time from what the blueprint says is
published: `PublishEventAction` topics and every derived family. A publish
made **from designer code** is invisible to it — a library function that
publishes a topic it composes at run time, typically because a lifecycle
hook called it (`LIB.requestIssuedDocumentAnnouncement(invoice)`). Without a
declaration, a listener on that topic is reported producerless at boot
(`KafkaSubscriptionsWithoutProducer`) and a consumer in the same project
gets `KAFKA_TOPIC_NO_PRODUCER` at design time, although the event does
arrive.

Declare the topic on the code that publishes it:

```json
"library": {
  "functions": [
    {
      "moduleName": "requestIssuedDocumentAnnouncement",
      "moduleBody": { "js": "module.exports = async function (doc) { ... }" },
      "publishes": ["shop-commerce-service-issueddocument-requested"]
    }
  ]
}
```

(The `moduleBody` is a fragment: its source is elided.)

- `library.functions[].publishes` is the primary carrier, and
  `library.edgeFunctions[].publishes` works the same way.
- `serviceSettings.serviceOptions.publishes` is the service-level list,
  for designer code that is not a library module.
- A declared topic is also pre-created at boot by the declaring service,
  like every other topic that service produces, so the first publish never
  waits on broker auto-creation.
- Write each topic as it goes on the wire. A name in a service's
  framework namespace carries the codename, like the derived events
  (`<codename>-<service>-service-<event>`). A topic you author
  (`billing.document.requested`) is written as authored.
- An unprefixed framework-namespace name (`commerce-service-issueddocument-requested`)
  fails validation with `DECLARED_PUBLISH_TOPIC_UNPREFIXED`, and the
  message names the codename-prefixed wire name to declare instead. A name
  Kafka refuses (a space, a `${...}` placeholder, more than 249
  characters) fails with `DECLARED_PUBLISH_TOPIC_MALFORMED`.

The census counts a declared topic as produced (kind
`declared-published`), so the boot report and the design-time check stop
flagging it. A subscription that really has no producer is still reported.
The declaration publishes nothing. Keep it in step with the code: a topic
declared and never published hides a dead listener, which is the failure
the report is there to show.

### Hand-written consumers: ask the door for the wire name

If you write a consumer or a producer by hand — a listener added beside the
generated code, a hub bridge, a script against a raw Kafka client — there
are exactly two correct spellings, and neither composes a string:

- pass the **authored** name to the service's publisher / listener classes;
  they apply the project scope and any deployment alias for you;
- when you must hand a raw client the broker-side string yourself, ask the
  service's runtime for the wire name of the topic (the one runtime
  composition of the project scope and the deployer's topic alias, which
  every generated door calls).

Never hand-compose `` `${codename}-${topic}` `` and never apply the alias
to a name you scoped yourself: a hand-composed string is the one thing that
can disagree with the census, the pre-create and the other end of the wire.

## The topic contract check

Validation checks every `service X -> topic -> service Y` edge of the
project at **WARNING** level, on both ends; the one cart row below is an
ERROR:

| Code | Fires when | Reported once per |
|---|---|---|
| `KAFKA_TOPIC_NEVER_CONSUMED` | a produced topic of a designer-facing family that no service in the project consumes (no event subscription, realtime-hub event, agent kafka controller, event notification, kafka-triggered business API or kafka edge controller lists it) | produced topic |
| `KAFKA_TOPIC_NEVER_PRODUCED` | a consumed topic no service in the project produces (no `PublishEventAction` authors it, no derived family produces it, no designer code [declares it](#a-topic-published-from-designer-code-declare-it)) | consumed topic, every consumer listed |
| `KAFKA_TOPIC_REQUEST_CHANNEL_NO_PRODUCER` | the mirror row for the two **request-channel** families below (`kafkaController` / `edgeKafkaTrigger`): no service in the project produces the topic they consume | consumed topic, every consumer listed |
| `CART_CHECKOUT_TOPIC_NO_CONSUMER` | **ERROR**, not a warning: a shopping cart in `orderCreationMode: "remote"` publishes its checkout topic and no Business API of the project creates an order from it, so every remote checkout is lost. Only an **order-creating** consumer counts - a create Business API whose kafka controller consumes that exact topic; an event subscription, event notification or other subscriber (which `KAFKA_TOPIC_NEVER_CONSUMED` does count) does not. Validation and build refuse it; fix it with that create api, with `checkoutSettings.externalCheckoutConsumer: true` when the order service lives outside the project, or with `local` / `none` (`local` + `publishCheckoutEvent` is not reported) | producing cart service |

Both fire on the **wire** name. An unconsumed *authored*
(`PublishEventAction`) topic keeps its pre-existing `TOPIC_NO_CONSUMER`
advisory; the two codes partition the produced families so one topic
is reported exactly once. `KAFKA_TOPIC_NEVER_PRODUCED` is the
topic-level summary of what the per-registration
`KAFKA_TOPIC_NO_PRODUCER` / `KAFKA_TOPIC_UNKNOWN_PRODUCER` /
`KAFKA_TOPIC_API_EVENT_DISABLED` findings say
row by row; it is skipped when the producer set could not be resolved
(`KAFKA_TOPIC_PRODUCER_SET_INCOMPLETE`).

`KAFKA_TOPIC_API_EVENT_DISABLED` is an error for a derived route-topic match,
with or without the project codename prefix, to a project API with
`raiseApiEvent` false or omitted. Its message names the
service and API and instructs you to set `apiOptions.raiseApiEvent: true`.
Unknown external or sibling-project topics keep
`KAFKA_TOPIC_UNKNOWN_PRODUCER` as a warning; they need no external-topic marker.

**Families consumed outside the project by design** are never reported
as never-consumed (`KAFKA_TOPIC_CONSUMED_OUTSIDE_BY_DESIGN`): the
`route-event` / `db-event` fan-out baseline (the BFF DataView listeners,
external feeds and hub auto-bridges derive their subscriptions inside their
own layers), the `elastic-sync` index signal, `content-lifecycle` /
`video-lifecycle` / `agent-result` (default-on for integrators),
`jobstream` (the stream's own worker), `auth-flow` (the auth service's own
machinery), `cart-checkout` (the remote order service; remote mode with no
in-project order-creating consumer and no `externalCheckoutConsumer`
declaration gets its own `CART_CHECKOUT_TOPIC_NO_CONSUMER` row instead), the
operator streams (`runtime-ops`, `agent-dlq`, `controller-deadletter`), the
agent retry stream `agent-retry` (read back by a generated listener of the
service that publishes it, not by a blueprint registration), the unmodelled
`helper-published`, the declared `declared-published` (an announcement from
designer code is routinely read outside the project) and the opt-in
`payment-lifecycle` topics (an announcement stream for notification and
sibling services). What remains is the explicit `controller-response`
family: a `responseTopicName` or an edge controller's `responseTopic` you
wrote so that someone consumes it.

**Families produced outside the project by design** are never reported
as never-produced (`KAFKA_TOPIC_PRODUCED_OUTSIDE_BY_DESIGN`): a kafka
controller's `requestTopicName` and an edge controller's kafka
`requestTopic` are request channels published by whoever calls the api.

That exemption from `KAFKA_TOPIC_NEVER_PRODUCED` does not mean the slot is
unchecked. A producerless `kafkaController` / `edgeKafkaTrigger` topic gets
its own **WARNING**, `KAFKA_TOPIC_REQUEST_CHANNEL_NO_PRODUCER`, naming the
service, the slot and the wire topic - never an error, and kept apart from
`KAFKA_TOPIC_NEVER_PRODUCED` so that row's semantics and the exemption set
above stay exactly as documented. It excludes the one shape that produces
no true positive: a `kafkaController` whose `requestTopicName` was never
authored, i.e. its topic is the derived
`<serviceCodename>-<resource>-<action>-request` shape - the slot the
designer never wrote, whose producer is the caller by construction. An
`edgeKafkaTrigger`'s `requestTopic` has no such derived-default shape, so it
is never excluded. An external system or a peer project producing the
topic is the normal, expected shape; the warning exists so a slot nobody is
calling does not go unnoticed until the runtime census reports it as an
unassigned consumer after deploy.

A row on a topic an external system really produces or consumes is
accepted by recording the reason with your project's warning baseline; a
row on a topic a service of *this* project was meant to handle means the
two ends spell the topic differently - author the same bare name on both
and let the compiler scope them.

An external system that publishes into your broker is unaffected. A
topic **your project does not produce** is passed through untouched,
because renaming it would only move your subscription off its real
producer. The gate is that membership test, and nothing else about the
shape of the name.

**A dead-letter name derived from a topic follows that topic.** Two
names are built out of a topic you consume rather than authored on
their own: an agent kafka controller's `<wireTopic>.dlq`, and a business
api's default `<wireRequestTopicName>-deadletter`. Both are derived from the
**wire** topic, so a scoped topic and its dead-letter stream stay in one
namespace — otherwise two projects on one broker would keep separate
live topics and share one dead-letter stream, which is exactly the
isolation hole the prefix exists to close. A dead-letter topic you name
yourself (`deadLetterTopicName`) is **not re-derived**: no suffix, no
composition, the string is baked exactly as you wrote it. It is still
published through the normal publish door, and that door scopes an
authored topic of *your* project and leaves any other string alone.
So the two arms are:

- an explicit name that is **not** one of your `PublishEventAction`
  topics goes on the wire verbatim, and the census reports it verbatim;
- an explicit name that **is** itself one of your authored topics goes
  on the wire as `<projectCodename>-<name>`, like any other authored
  topic, and the census reports that same scoped string.

Census and wire agree in both arms; nothing is reported bare while it
is published scoped. The derived names take the same door: because
`<wireTopic>.dlq` and `<wireRequestTopicName>-deadletter` are never
authored topics, the door's own pass over them is a no-op, so the prefix
can only enter *before* the suffix, which is where both derivations put
it.

**The agent retry topic `<wireTopic>.retry` follows the same rule.** An
agent kafka controller gets a second derived name beside its dead letter,
kind `agent-retry` in the census: when a run the platform refused (for
example a peer that answered 502 during a deploy) fails its quick
in-handler attempts, the controller's guard publishes a retry record (the
original event, the attempt number and a not-before time) to
`<wireTopic>.retry` instead of dead-lettering at once. A second listener of
the **same** service, consumer group
`<service>-agent-<agent>-<controller>-retry` (or `<groupId>-retry` when the
controller sets its own `groupId`), reads that topic and re-delivers the
event when it is due; only after the last delayed attempt does the event go
to `<wireTopic>.dlq`. The name is built from the same wire topic as the
dead letter (scope first, suffix second, never scoped again), so the
controller, its retry stream and its dead letter share one namespace. You
never author or subscribe to it yourself: the service declares it,
pre-creates it at boot and reads it back. Only agent kafka controllers get
it, and only on the targets that implement the retry stream (see
[the compiler specification](../../compiler/index.md)).

### Migrating an existing consumer

Kafka consumer offsets belong to a `(broker, topic, group, partition)`
tuple. Any change to the physical topic a consumer reads, or to the
group it reads under, is therefore a migration with a backlog to
account for, and **no sentence on this page can tell you that backlog
is empty**: only a measurement on your broker can. Before every step
below, measure with your broker's tooling (for example
`kafka-consumer-groups --describe --group <group>`) the committed
offset and the lag of every affected group on the **old** physical
topic and on the **new** one, and record both numbers. A lag of zero on
the old topic at the moment you switch is what "nothing is lost" means;
a non-zero lag is work you drain first or a gap you accept in writing.

A topic whose wire name moves (a project gains the codename prefix on
authored topics, or a short framework-derived name is completed to the
producer's name) is such a migration. Services of one project that produce
or consume the topic must move **together**: a producer on the new name and
a consumer on the old one lose events without an error. Compilers may
provide a bridge that reads both spellings for a window; see
[the compiler specification](../../compiler/index.md) for what yours does.

**A consumer outside the project, subscribed to an authored topic's old
unprefixed name.** To move it:

1. Look up the new name. It is `<projectCodename>-<authoredTopic>`, and
   it is also listed verbatim in the generated service's declared topic
   set (its `produced` list). Read it there rather than composing it.
2. Deploy the external consumer **first**, subscribed to *both* names.
   Use one group for both subscriptions: Kafka commits offsets per
   topic-partition, so a group can hold both, and the new topic receives
   nothing until step 3. Measure the group's lag on the old topic now:
   that is the backlog the switch has to preserve.
3. Deploy the regenerated services. From that moment the producer
   publishes only the new name. Watch the old topic's lag drain to zero.
4. Drop the old subscription once the old topic's lag is zero and it has
   stopped receiving. The old topic is not deleted by the generated
   service; retire it on your own schedule.

**Consumers inside the project** need no blueprint change — their
subscriptions are scoped by the same rule in the same build, so producer
and consumer move together. One operational consequence is worth planning
for, though: a listener's consumer group id is derived from the
project-scoped topic it consumes, so a topic that gains the project prefix
gets a **new** consumer group. That group has no committed offset, and the
generated listeners subscribe from the log end, so the first deploy after
the rename starts there: whatever the old group had not yet consumed on the
old topic is not replayed on the new one. Measure the old group's lag,
drain it before you deploy, or accept the measured gap deliberately. The
one group id that does *not* move is the explicit one a kafka-controller
passes, which is built from the unscoped topic on purpose. Read that
narrowly: the group id does not move, but what it has committed on the OLD
topic still has to be measured - an offset belongs to a
`(broker, topic, group, partition)` tuple, so a stationary group id on a
moved topic starts from no committed offset there just the same.

**A consumer inside the project subscribed to a framework-derived
event by its SHORT name** (no project codename). When that name is
completed to the producer's name, this consumer's physical topic moves and,
because the group is derived from the scoped name, its consumer group moves
with it. Two things follow, and both are measurable rather than arguable:

- what it was reading before is whatever was being published on the short
  name. Your own project publishes nothing there - the producer composes the
  full name - so in the ordinary case that is an empty topic and the
  subscription has been dead since it was written. Confirm it rather than
  assume it: check the short topic's end offsets and the group's committed
  offset on it. If they are non-zero, something IS publishing that name (a
  partner system, or another project on the same broker whose codename-less
  topic collides with yours) and the change moves you off it deliberately;
- afterwards the consumer joins a new group on the full topic with no
  committed offset and starts at the log end, so the events already on that
  topic are not replayed. If you need them, drain them with a one-off
  consumer before you deploy, or record the gap.

If you have to stay on the short name for a window — a partner is
mid-migration, say — the topic-alias seam is the supported tool: the alias
runs **after** the project scope, so a mapping from the completed name back
to the short one keeps the physical topic exactly where it was while you
move the other end. Take that as a window, not a destination; the short
name is a name your project does not publish.

**A deployment with a topic alias installed.** The alias moves producers,
consumers and the pre-create onto the physical name, and consumer **group
ids stay where they were** (the group is derived from the scoped, unaliased
name, on purpose). So when a deployment starts applying the alias on the
consumer side, per consumer only the physical topic it reads changes. What
to measure before switching: for each consumer group, its lag on the
**logical** topic (what it read until now) and the backlog on the
**physical** topic (what the producer has been writing all along, which
this group has never consumed). The physical topic's history is not
replayed either: the group has no committed offset there and subscribes from
the log end. If the physical topic carries events you need, drain them with
a one-off consumer first, or accept the measured gap.

These are *your* topics, published by a `PublishEventAction` inside
the BusinessApi or by an `ApiKafkaSettings` response topic. Apply the
same dotted convention when you set
`controllers.kafkaSettings.requestTopicName` /
`responseTopicName` on a BusinessApi (`ApiKafkaSettings`), or
`edgeKafkaSettings.requestTopic` / `responseTopic` on an
`EdgeController` (`EdgeKafkaSettings`). Note the suffix difference:
`ApiKafkaSettings` uses the `*Name` suffix; `EdgeKafkaSettings`
doesn't.

## Component rules

### `<sourceService>`

The service that owns the resource — *not* the consumer. A `User` is
owned by `auth` even when the `customers` service ends up consuming.

### `<resource>`

Lowercase, singular. For data objects, the bare object name; for
API events, the API name. Keep it scoped: `order`, not
`orderRecord`.

### `<lifecycle>`

| Suffix | Meaning |
|---|---|
| `created` / `updated` / `deleted` | DataObject CRUD lifecycle (use one of the emitted topics above — don't re-publish what the data layer already publishes). |
| `<state>` | A state-machine transition published explicitly by a `PublishEventAction` (e.g. `paid`, `refunded`). |
| `requested` / `completed` / `failed` | API lifecycle for long-running work. |

## Anti-patterns to avoid

### Action-style names

The topic is about a thing that happened, not a job to do.

- Don't: `processOrder`, `archiveData`, `runReport`.
- Do: `orders.order.paid`, `analytics.snapshot.completed`.

### Subscribers baked into the topic

Each subscriber has its own consumer group; the topic stays singular.

- Don't: `auth.user.created.toReporting`.
- Do: `auth.user.created` consumed by both `reporting` and `search`
  in separate consumer groups.

### Tenant in the topic

One topic per tenant explodes topic counts and breaks cross-tenant
analytics. Tenant goes in the message headers or payload, not the
topic name.

- Don't: `orders.tenant_abc.order.created`.
- Do: `shop-orders-service-dbevent-order-created` carrying `tenantId`
  in the payload.

### Versioned topic names

Add fields; don't rename. If the payload truly breaks, run two topics
in parallel during the migration, then retire the old.

- Don't: `orders.order.created.v2`.
- Do: publish both topics for a window, switch consumers, drop the
  legacy topic.

## Cluster prefixes

Multi-cluster projects sometimes prefix by cluster role:

```
analytics.elastic-index-acme_order-created
internal.orders.order.paid
```

OK when the prefix is *cluster role* (`analytics`, `internal`,
`public`), never when it's deployment env (`stage`, `prod`). The
cluster itself is the environment.

## See also

- [Kafka controllers](../business-apis/kafka-controllers.md) — the
  mechanics of subscribe and publish, including `kafkaSettings` on
  BusinessApi controllers.
- [Anti-patterns](anti-patterns.md) — the same warnings in the
  catalogue form.
