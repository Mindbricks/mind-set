---
title: Event bus contract
---

# 7. Event bus contract

Services announce what happened on a **logical event bus**. The ontology calls it
"Kafka"; this is a name for the role, not a product requirement. Kafka, NATS, RabbitMQ,
SNS and SQS, Google Pub/Sub and, inside a modular monolith, an in-process bus all
conform, as long as the topic names, payloads and delivery semantics of this chapter
hold.

## 7.1 Model

- A **topic** is a named channel. Producers publish **messages**; every subscriber group
  receives every message of the topics it subscribes to.
- A message is one JSON document, the **envelope** (7.4). Nothing else is part of the
  contract: the reference sets no message key and no transport headers.
- Topic names in this chapter are **logical names**. A compiler **MAY** map them to
  physical channels (a subject, an exchange and routing key, an SNS topic) with a
  deterministic mapping, and **MUST** document it. Two different logical names **MUST NOT**
  map to the same physical channel.

Partitions, consumer group ids, offsets, compression and topic pre-creation are free.

## 7.2 Topic families

`<projectCodename>` is the project's codename; `<serviceCodename>` is
`<projectCodename>-<serviceName>-service`, lower-cased.

| Family | Logical topic | Raised by |
|---|---|---|
| **Data change** | `<serviceCodename>-dbevent-<objectname>-<created\|updated\|deleted>`, object name lower-cased | every write to a stored object (7.3) |
| **API event** | `<serviceCodename>-<suffix>`, all lower-case | an API with `raiseApiEvent: true` (7.3) |
| **Authored event** | `<projectCodename>-<topic>`, authored casing kept | a `PublishEventAction` |
| **Projection sync** | `elastic-index-<projectcodename>_<objectname>-<created\|updated\|deleted>`, plus `…-repaired` | the owning service after each projection write |
| **Payment status** | `<objectName>-payment-updated`, `<objectName>-payment-paymentdone` | checkout objects ([chapter 9.4](09-04-payment.md)) |
| **System services** | the topics each system service raises ([chapter 9](09-system-services.md)) | |

Examples for project `acme`, service `orders`, object `basketItem`:

| Event | Topic |
|---|---|
| a create of `basketItem` | `acme-orders-service-dbevent-basketitem-created` |
| `getBasketItem` with `raiseApiEvent` | `acme-orders-service-basketitem-retrieved` |
| `clearBasket` (delete) with `raiseApiEvent` | `acme-orders-service-basket-cleared` |
| the same with `raisedEventTopic: "basket-emptied"` | `acme-orders-service-basket-emptied` |
| `PublishEventAction { "topic": "order.shipped" }` | `acme-order.shipped` |
| projection write after an update | `elastic-index-acme_basketitem-updated` |

### The API event suffix

The suffix is `apiOptions.raisedEventTopic` when it is set and legal (characters
`[a-zA-Z0-9._-]`, not starting with `dbevent-` or `lcevent-`); it is lower-cased. Otherwise
it is derived from the API name:

1. Split the camelCase API name: the first word is the verb, the rest, joined and
   lower-cased, is the resource (one word: verb `do`).
2. `get` becomes `retrieve`.
3. The suffix is `<resource>-<passive form of the verb>`: `create` → `created`,
   `clear` → `cleared`, `list` → `listed`, `subscribe` → `subscribed`.

A compiler **MUST** produce the same suffix. The passive form follows English
morphology with an irregular-verb table.

> Generated table goes here (S9): the irregular-verb table and the derived API event
> topic of every API in the reference blueprints. Until it is published, a compiler
> **SHOULD** report every derived topic at compile time, and a blueprint author **SHOULD**
> set `raisedEventTopic` on APIs whose name is not a plain CRUD verb.

> **To verify:** the payment-status topics carry no project prefix and keep the object
> name's casing; the reference marks this as an open wire-format decision.

## 7.3 What raises events

| Event | Default | Switch |
|---|---|---|
| Data change | **on** for every stored object; create, update and delete, single, bulk and by query | `objectSettings.basicSettings.publishDbEvents: false` turns off the data-change and projection-sync families of the object. Validators reject it while anything in the project consumes them. |
| API event | **off** | `apiOptions.raiseApiEvent: true` |
| Authored event | when the action runs | the action's place in the workflow |

Rules:

- A data-change event **MUST** be published only after the write has committed and after
  the search projection has been updated ([chapter 4](04-data-layer.md#49-search-projection)).
- An API event **MUST** be published after the response is sent, and **MUST NOT** be
  published when the API answered with an error (status 400 or above) or completed a
  missing-record path (`onNotFound: "complete"`).
- An API triggered from the bus raises its own data-change and API events like any other
  call.
- A write held for moderation publishes nothing until it is accepted.

Rule example:

```json
{ "apiOptions": { "name": "clearBasket", "crudType": "delete",
                  "dataObjectName": "basketItem", "raiseApiEvent": true } }
```

A successful call publishes, in this order: `acme-orders-service-dbevent-basketitem-deleted`
(from the delete), then, after the response, `acme-orders-service-basket-cleared`. A call
that answers **404** publishes neither.

## 7.4 The envelope

Every message on every family **MUST** be this JSON object:

```json
{
  "id": "0b7d6f0e-3c1e-4a51-9a7e-5d1d8c2f9b11",
  "type": "basketitem.created",
  "source": "acme-orders-service",
  "time": "2026-11-12T08:15:30.123Z",
  "requestId": "6f1c…",
  "actor": { "userId": "…", "sessionId": "…", "tenantId": "…", "roleId": "user" },
  "data": { "id": "…", "quantity": 2, "_type": "basketItem" },
  "old": null
}
```

| Key | Rule |
|---|---|
| `id` | a new UUID per publish. It is the deduplication key of the message. |
| `type` | the domain fact: `<object>.<created\|updated\|deleted\|retrieved\|listed>` for data-change, API and projection events; the topic string for authored events. |
| `source` | the publishing service's codename |
| `time` | publish time, ISO 8601 UTC with milliseconds |
| `requestId` | the request id of the originating call, or `null` |
| `actor` | `{ userId, sessionId?, tenantId?, roleId?, roles? }` of the caller, or `null` when there is none |
| `data` | the record with `_type: <objectName>`; for an API event of a list API, the array of records |
| `old` | the record before the change: on data-change `updated` events, and on API events of update and delete APIs |

- The envelope **MUST NOT** carry a session token, a credential, or any property marked
  `hashed` or `isSecret`.
- `data` **MAY** carry the owner and tenant markers of the record (`_owner`, `_tenantId`);
  subscribers that filter by owner or tenant read them.
- An API event's `type` is the API's CRUD type, not its topic suffix: `clearBasket`
  publishes `type: "basketItem.deleted"` on `…-basket-cleared`.

> **To verify:** three casing and content differences in the reference, to be settled
> before this section is final: data-change `type` uses the lower-cased object name
> (`basketitem.created`) while API and projection events keep its casing
> (`basketItem.created`); data-change `deleted` events carry no `old` while API events of
> delete APIs do; whether a data-change `data` is the normalised record or the raw stored
> row. A cross-language wire fixture in the reference fixes the key set; the kit will
> publish it.

## 7.5 Delivery semantics

**Publishing.**

- A producer **MUST** publish after the change it reports is committed, never before.
- A producer **MUST** retry a failed publish before giving up. The reference retries for
  a bounded time (about 5 seconds) and then drops the message with a log entry; it keeps
  no outbox for data-change and API events.
- A compiler **MAY** offer stronger delivery (a transactional outbox, broker
  transactions). This is not a deviation.
- There is **no ordering guarantee** between messages, not even for the same record.
  Consumers that need order use `updatedAt` in `data`.

When a `PublishEventAction` fails after the main write committed, the API answers with
`actionFailures` ([chapter 5](05-business-apis.md)) and the message is queued in a
retry outbox with the same `id`; the reference retries it for a bounded number of
attempts.

**Consuming.**

- Delivery to consumers **MUST** be **at least once**: a message is acknowledged only after
  its handler finished.
- Every consumer **MUST** tolerate duplicates. Generated consumers whose effect is not
  idempotent **MUST** deduplicate on the envelope `id`.
- A generic consumer whose handler keeps failing **MUST** retry (the reference: five
  attempts with exponential backoff) and then publish a dead letter to `<topic>.dlq`
  describing the failure and carrying the original message.

> **To verify:** the reference's notification and agent consumers deduplicate on `id`;
> business APIs triggered by the bus do not, and their documentation asks authors to make
> them idempotent. This section states the stricter rule for generated non-idempotent
> consumers; the exact set of consumers it covers is to be listed.

## 7.6 Business APIs triggered by events

An API with `kafkaSettings.hasKafkaController: true` consumes `requestTopicName` (and
`requestTopicNames`). For each message:

1. The record (`data`, or the whole message when there is no `data`) becomes the request
   body; parameters bind from its keys. The whole envelope is available to parameters
   read from the request.
2. The envelope's `actor` becomes the session. In a multi-tenant project the tenant comes
   **only** from the actor, never from the body; a user actor without a tenant is refused
   (**403**); a system actor runs in the root tenant.
3. The API's normal pipeline runs ([chapter 5](05-business-apis.md)). The bus entry counts
   as a machine caller for `requiredCallerKind`.
4. On success, the API's answer is published to `responseTopicName` when one is set.
5. Every outcome (success, refusal, error) acknowledges the message; there is no
   redelivery. With `deadLetterEnabled`, a refused or failed message is published to
   `deadLetterTopicName`, default `<requestTopic>-deadletter`, with
   `type: <object>.<crudType>.rejected`.

Every API that consumes a topic is its own subscriber: two APIs on the same topic both
receive every message, and replicas of one service share the work.

Rule example:

```json
{ "apiOptions": { "name": "createShipment", "crudType": "create", "dataObjectName": "shipment" },
  "controllers": { "kafkaSettings": { "hasKafkaController": true,
                   "requestTopicName": "acme-order.shipped" } } }
```

Each `acme-order.shipped` message creates one shipment, acting as the user in the
message's `actor`; a duplicate message creates a second shipment unless the API guards
against it (for example with a unique index and `onDuplicate: stopOperation`).

## 7.7 Other consumers

| Consumer | Declared by | Chapter |
|---|---|---|
| Event subscriptions to browsers (WebSocket or SSE) | `Service.eventSubscriptions[]` | [9.5](09-05-realtime.md) |
| Realtime hub bridges | `RealtimeHub` events | [9.5](09-05-realtime.md) |
| Notifications triggered by events | `notificationService` event notifications | [9.3](09-03-notification.md) |
| Agents triggered by events | `AIAgent.kafkaControllers` | [9.7](09-07-agent-hub.md) |
| BFF stored views | `bffService.dataViews` (projection-sync family) | [9.2](09-02-bff.md) |
| Edge controllers | `edgeControllers[].edgeKafkaSettings` | hand-written |

## 7.8 Signed events

A service may list topics in `serviceOptions.secureEvents`. Their messages are wrapped as
`{ "_secure": true, "alias", "payload": <envelope>, "sig", "kid", "jwks_url" }`, signed with
the service's Ed25519 key over the canonical JSON of `payload`; consumers **MUST** refuse an
unsigned message on a secured topic.

> **To verify:** the alias naming of secured topics and how the consumer matches it (the
> reference documentation and code disagree).

## 7.9 Bridges

The project may mirror bus topics to and from an external AMQP broker
(`projectSettings.amqpProvidersSettings`), byte for byte and at least once. A compiler
whose logical bus is itself an AMQP broker **MAY** satisfy a mirror by direct binding.
