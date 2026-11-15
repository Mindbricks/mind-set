# Event envelope and topic strings

Read by the microservice-definitions, service-spec, notification-definitions
and agent-hub-spec writers. Getting either rule wrong silently kills a
pipeline: the binding resolves to undefined at runtime, the topic has no
subscriber, no validation catches it, and the symptom is "the events never
arrive".

## 1. The wire is enveloped - the READER decides the binding

Every framework-published message rides one envelope:

```
{ id, type, source, time, requestId,
  actor: { userId, sessionId?, tenantId?, roleId? },
  data: { _type, ...record },
  old? }                       <- an update's pre-change row
```

That is the WIRE, not the binding. Most consumer surfaces unwrap the envelope
before your path is evaluated, so a `data.` prefix on those surfaces resolves
to `data.data.foo` - undefined, silently.

| Consumer surface | Unwraps? | Bind as |
|---|---|---|
| Business API kafka controller (a kafka-triggered API) | yes | bare key - `title`, `status` |
| Notification listener (conditions, targets, templates) | yes | bare key - `title`, `ownerId` |
| AI agent kafka controller WITH `dataMapping` | no | `data.<key>` - `data.title` |
| AI agent kafka controller WITHOUT `dataMapping` | yes | bare key |

Envelope-level facts are addressed at the envelope on every surface: `type`
(the domain fact, never a record field), `actor.userId` (the ACTING user),
`id` (the dedup key), `requestId` (correlation) and `old.<prop>` (an update's
pre-change row, where the surface exposes it).

**The notification listener roots its bindings differently:**

| Binding | Rooted at | Bind as |
|---|---|---|
| `targetPathInData` (and its array variants) | the record (or the DataView document when one is bound) | bare |
| MScript `this.payload` | the record, never the envelope | bare |
| MScript `this.dataSource` | the DataView's stored document | that document's own shape |
| `dataViewIdPathInPayload` | the record; the default is the record's own `id` | bare; omit it when the record's `id` is the key |

A `data.`-prefixed id path reads `record.data.<key>` - undefined - and the
listener skips the notification before the view fetch: nothing throws, the
build is green, the notification never sends.

**The trap:** someone proves the wire is enveloped (it is) and concludes every
path needs `data.` (it does not). Proving the WIRE says nothing about the
READER: state which surface you bind for, then read the table.
The produced record (the object's properties in the blueprint, or the keys of
the publish action) tells you which KEYS exist; this table decides the PREFIX.

**When a document hands a binding to a later stage** (Event Contracts rows,
notification targets, agent data mappings), name the payload keys BARE and
name the consuming surface beside them, so the implementing stage applies the
prefix from this table instead of re-deriving it.

## 2. Emission: which keys ride `data`

Every published topic states its emission mechanism, exactly one of:

- **derived** - the producer relies on `raiseApiEvent: true` only; the payload
  is the produced RECORD (stamped with `_type`). An update's pre-change row
  rides `old.<prop>`.
- **explicit** - the producer carries a publish-event action with authored
  message keys. A contract that promises keys the produced record does NOT
  carry REQUIRES this mechanism: `raiseApiEvent` alone can only deliver the
  record's own fields, and a consumer-side alias on a derived event is a no-op.
  An authored topic is written BARE (`order.checkedout`); the platform scopes
  it to `<codename>-<topic>` on the wire (a name already carrying the prefix
  is left as is), so the codename never belongs in the authored name.

**One `data` key-set per topic.** If any producer of a topic publishes
explicit keys, every producer of that topic must; a consumer cannot read two
key-sets on one topic.

## 3. Topic strings

A derived topic is

```
{codename lowercased}-{service lowercased}-service-{object lowercased}-{actionPassiveForm}
```

with the passive form from the crudType (create -> created, update -> updated,
delete -> deleted). Example: codename `ArtSys`, service `orderCore`, object
`OrderItem`, created -> `artsys-ordercore-service-orderitem-created`.

- **CRUD-named APIs only.** The formula holds for APIs named after the CRUD
  action on their own object (`createX`, `updateX`, `deleteX`). Other APIs get
  an event name derived from the API NAME by verb inversion (`submitAppeal` ->
  `...-appeal-submitted`, `followArtist` -> `...-artist-followed`). When you
  name a topic another side must consume, write the producer API name next to
  it and treat the string as an estimate that the event-bus rules
  (`openappl/compiler/07-event-bus.md`) and the derived topics
  (`openappl/compiler/12-derived-surface.md`) confirm.
- **All lowercase, character-exact.** Kafka topic names are case-sensitive and
  the framework lowercases every segment. One camelCase or kebab variant
  between producer and consumer means zero delivery.
- **The codename prefix** is the project codename (the blueprint's
  `codename`), lowercased - never invented, shortened or re-derived.
- **Consumers copy the producer's string byte for byte.** One row, one string,
  written once and copied verbatim into producer and consumer documents.
- **A published topic with no consumer is dead weight** - declare its consumer
  or drop it (validation reports it as `TOPIC_NO_CONSUMER`). A publish that
  exists for a future or external consumer says so.
- **A topic cycle must be shown to terminate** (validation reports
  `TOPIC_CYCLE`): name the saga that owns the cycle and the condition that
  makes the second hop a no-op.
