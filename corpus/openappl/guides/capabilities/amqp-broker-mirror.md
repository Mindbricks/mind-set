---
title: AMQP broker mirror (external AMQP ↔ Kafka)
---

# AMQP broker mirror (external AMQP ↔ Kafka)

Generated services talk to each other over a **native Kafka** event bus. Many
enterprises, though, run their own **AMQP brokers** (RabbitMQ, CloudAMQP, ActiveMQ
Artemis, Azure Service Bus) as the integration backbone between systems. The **AMQP
broker mirror** bridges the two, in **both directions**, with **zero service-code
changes**:

- **Inbound (`amqpToKafka`)**: a message an external system drops on an AMQP address is
  re-published onto a project Kafka topic, so your ordinary generated **KafkaController**
  fires exactly as if a sibling service had published it.
- **Outbound (`kafkaToAmqp`)**: an event your service emits with its **unchanged
  `PublishEventAction`** is teed onto an external AMQP address, so a foreign consumer
  receives it.

The mirror lives entirely in the project's [MCP-BFF](../system-services/mcpbff.md) (the
single system service that owns the connection lifecycle). Your services never open an
AMQP socket, never import a broker SDK and never change a line of code: you only
*declare* the mapping in project settings. It is a **byte-faithful tee**: nothing is
parsed, re-serialised or stripped in either direction.

> **You declare *which* topics cross the boundary; that is the whole control surface.**
> There are no wildcards: every mirrored address/topic pair is an explicit entry. See
> [`AmqpProvider`](../../spec/AmqpProvider.md),
> [`AmqpProviderConfig`](../../spec/AmqpProviderConfig.md) and
> [`AmqpMirroredTopic`](../../spec/AmqpMirroredTopic.md) for the field-level schema.

---

## Protocol families and brands

The broker **brand** you pick fixes the **wire protocol**: the mirror selects the right
driver automatically, you never configure the protocol yourself:

| Family | Brands | Default port |
|---|---|---|
| **AMQP 0-9-1** | `rabbitmq`, `cloudamqp` | 5672 (5671 with TLS) |
| **AMQP 1.0** | `artemis`, `azureServiceBus` | 5672 (Azure Service Bus: addressed by connection string) |

`azureServiceBus` is addressed by a full **connection string** (host, port and user are
ignored); the other three use **host / port / username / password** (plus `vhost` for the
0-9-1 brands).

---

## Configuring a provider

Providers live under `projectSettings.amqpProvidersSettings.amqpProviders[]`. Each entry
is a `name` (unique in the project), a `provider` brand, and a `configuration` holding
the connection fields plus the `mirroredTopics` list:

```json
{
  "projectSettings": {
    "amqpProvidersSettings": {
      "amqpProviders": [
        {
          "name": "warehouse",
          "provider": "rabbitmq",
          "configuration": {
            "host": "rabbit.acme.internal",
            "port": 5672,
            "vhost": "/",
            "username": "svc-integration",
            "useTls": false,
            "mirroredTopics": [
              { "direction": "amqpToKafka", "amqpAddress": "wms.stockAdjusted", "kafkaTopic": "stockAdjusted" },
              { "direction": "kafkaToAmqp", "amqpAddress": "erp.orderShipped",  "kafkaTopic": "orderShipped" }
            ]
          }
        }
      ]
    }
  }
}
```

Each **`mirroredTopics`** entry declares:

- **`direction`**: `amqpToKafka` (inbound) or `kafkaToAmqp` (outbound). Required.
- **`amqpAddress`**: the queue / exchange (0-9-1) or address (1.0) on the broker.
  Required, no wildcards.
- **`kafkaTopic`**: the project bus topic. Optional; **defaults to `amqpAddress`** when
  omitted.

Duplicate mappings (same direction + `amqpAddress` + effective `kafkaTopic`) are rejected
at validation (`DUPLICATE_MIRRORED_TOPIC`). A provider that declares **no** mirrored
topics gets no connection; a project with **no** AMQP providers runs the mirror as a pure
no-op, so native-Kafka projects are entirely unaffected.

### Credentials: never in the blueprint

Broker **secrets are never written into the committed blueprint**. Only the non-secret
facts (host / port / vhost / `useTls`) travel with the blueprint; the broker's
`username`, `password` and `connectionString` are supplied to the deployed MCP-BFF as
deployment secrets, named `AMQP_<NAME>_USERNAME` / `_PASSWORD` / `_CONNECTION_STRING`
(`<NAME>` is the uppercased provider name, every character that is not a letter or digit
turned into `_`: `warehouse` becomes `AMQP_WAREHOUSE_*`, `orders-bus` becomes
`AMQP_ORDERS_BUS_*`). Host, port, vhost and TLS can also be overridden per environment
with `AMQP_<NAME>_HOST` / `_PORT` / `_VHOST` / `_USE_TLS`. `password` and
`connectionString` are masked wherever the blueprint is read back.

---

## Worked example: a two-direction mirror

### Step 1: declare the provider and both mappings

Add one RabbitMQ provider with **one mapping in each direction**:

```json
{
  "projectSettings": {
    "amqpProvidersSettings": {
      "amqpProviders": [
        {
          "name": "partnerBus",
          "provider": "rabbitmq",
          "configuration": {
            "host": "broker.partner.example",
            "port": 5672,
            "vhost": "/",
            "username": "svc-integration",
            "useTls": false,
            "mirroredTopics": [
              { "direction": "amqpToKafka", "amqpAddress": "ext.orders",   "kafkaTopic": "orderReceived" },
              { "direction": "kafkaToAmqp", "amqpAddress": "ext.shipments", "kafkaTopic": "orderShipped" }
            ]
          }
        }
      ]
    }
  }
}
```

### Step 2: wire the two ends in your service blueprint

Nothing about mirroring appears in your service code: you wire the **native** Kafka ends.

- **Inbound consumer**: add a **KafkaController** on topic `orderReceived`. When an
  external system publishes to the broker's `ext.orders` queue, the mirror republishes it
  to `orderReceived` and this controller runs.
- **Outbound producer**: anywhere your logic already fires a **`PublishEventAction`** to
  `orderShipped`, you are done: the mirror tees every such event to the broker's
  `ext.shipments` address. No change to the action.

### Step 3: supply credentials

Provide the broker's secret (`AMQP_PARTNERBUS_PASSWORD` here) to the deployment. At boot
the MCP-BFF opens one client per mirror-carrying provider (best effort: a broker being
down never blocks boot) and wires each mapping.

### Inbound: external AMQP to your service (`amqpToKafka`)

An external system publishes to the broker as it would to any consumer, and your
`orderReceived` KafkaController fires:

```
external AMQP publish -> ext.orders  --mirror-->  Kafka: orderReceived  -->  your KafkaController
```

The **raw AMQP body bytes** land as the Kafka value unchanged. A JSON body satisfies your
controller's flat body parameters exactly as an in-project publisher would. A non-JSON
body is forwarded verbatim too (handled by the Kafka listener's non-JSON fallback, never
a crash).

### Outbound: your service to an external consumer (`kafkaToAmqp`)

Fire your existing `PublishEventAction` to `orderShipped`; a foreign AMQP consumer
subscribed to `ext.shipments` receives it:

```
your PublishEventAction -> Kafka: orderShipped  --mirror-->  AMQP: ext.shipments  -->  external consumer
```

The mirror consumes `orderShipped` through a **dedicated consumer group**, so it is an
**additional** subscriber: your native Kafka consumers of the same topic keep receiving
the event exactly as before. The mirror never re-routes; it tees.

---

## Delivery semantics

The mirror is **at-least-once in both directions**: it never silently drops a message,
and it may occasionally deliver a **duplicate**.

- **Inbound**: the bridge publishes to Kafka **first**, and only acknowledges the AMQP
  delivery *after* the publish succeeds. If Kafka is momentarily down the message is
  negatively acknowledged and requeued on the broker and redelivered once Kafka returns.
- **Outbound**: the Kafka offset is committed **only after** the AMQP publish resolves.
  While the external broker is down the bridge holds the offset uncommitted, buffers via
  normal Kafka consumer lag, and flushes on reconnect.

Because a crash can occur *between* the forward and the acknowledgement or commit, a
message can be delivered twice. **Treat mirrored consumers as idempotent**: key off a
stable business id (or the event envelope's `id` when present) and make reprocessing a
no-op. This is the same contract as native Kafka consumers, extended across the broker
boundary.

### Single-instance assumption (known limitation)

The mirror runs in **one** MCP-BFF instance. Each outbound mapping uses a dedicated
consumer group and each inbound mapping a single subscription, all inside that one
process. **Scaling the MCP-BFF horizontally would double-deliver every mirrored message**
(a second instance's identical subscriptions would consume the same messages again).
Coordinated, scaled-out mirroring (per-instance partitioning or leader election over the
mappings) is deliberately not solved. Run a single MCP-BFF instance for the mirror.

---

## Envelope contract: forward verbatim, in both directions

The mirror **forwards the message body byte for byte** and synthesises no properties. It
is a tee, not a transformer.

- **Inbound (`amqpToKafka`)**: the raw AMQP body bytes become the Kafka value unchanged.
  Non-JSON bodies are forwarded unchanged as well.
- **Outbound (`kafkaToAmqp`)**: the raw Kafka message value bytes become the AMQP body
  unchanged. A Kafka event on the wire is either a **plain** unified event envelope
  `{ id, type, source, time, requestId, actor, data, old? }` or a **secure** event
  `{ _secure, alias, payload, sig, kid, jwks_url }` (whose `payload` is that same
  envelope). **Both cross as-is**: the signing envelope is **preserved, not stripped**,
  and the envelope metadata (`id` / `requestId` / `actor`) crosses inside the body.

Why keep the secure envelope rather than unwrap to `payload`? Because `sig` / `kid` /
`jwks_url` are **public verification material, not secrets**: a capable external consumer
can still verify the project signature's authenticity via the public `jwks_url` (see
[Application signing & keys](application-signing.md)). Unwrapping would irreversibly
destroy that at the boundary and silently downgrade security on the operator's behalf.

> **The trust-boundary decision is expressed by *which* topic you map, not by the mirror
> redacting fields.** The mirror forwards whatever the publisher assembled, including
> session provenance an external integration often wants. **Do not map a topic whose
> `session` context (or any field) must not leave the trust boundary**: if a topic
> carries data that must stay internal, simply do not add a `kafkaToAmqp` mapping for it.

---

## Observability: per-mapping live status

The MCP-BFF's operator-gated health-detail endpoint reports a live status snapshot for
every configured mapping under an **`amqpMirror`** block, so an operator can confirm the
bridge is running and spot an unreachable broker. The public liveness endpoint answers
liveness only, so the mirror status is never readable by an unauthenticated caller.

```jsonc
// operator health-detail response
{
  "status": "ok",
  "amqpMirror": {
    "enabled": true,
    "mappings": [
      {
        "provider": "partnerBus",
        "direction": "amqpToKafka",
        "amqpAddress": "ext.orders",
        "kafkaTopic": "orderReceived",
        "connected": true,
        "lastMessageAt": "2026-07-04T16:59:24.512Z",
        "messageCount": 3,
        "errorCount": 0,
        "lastError": null
      },
      {
        "provider": "partnerBus",
        "direction": "kafkaToAmqp",
        "amqpAddress": "ext.shipments",
        "kafkaTopic": "orderShipped",
        "connected": false,              // external broker unreachable
        "lastMessageAt": null,
        "messageCount": 0,
        "errorCount": 1,
        "lastError": "ECONNREFUSED"
      }
    ]
  }
}
```

Per mapping: **`connected`** reflects the live connection state (an unreachable broker
reads `false` in *either* direction); **`messageCount`** and **`lastMessageAt`** track
successful forwards; **`errorCount`** / **`lastError`** capture the last forward failure.
Counters are in memory and reset on restart. A project that mirrors nothing reports
`{ "enabled": false, "mappings": [] }`. The block surfaces **no secrets**: only
provider and topic names, connection state, counts and the last error *message*.

---

## Scope and non-goals

- **Explicit mappings only.** `mirroredTopics` are explicit by design (no wildcards) so
  the trust boundary is auditable per mapping.
- **One connection owner.** The mirror is the only place broker connections live; there
  is no per-service native AMQP.
- **Brokers are not provisioned.** The mirror integrates with brokers the enterprise
  already operates; it does not create them (see
  [External service integration](external-service-integration.md) for running a
  third-party service as part of the infrastructure).
- **Scale-out** of the mirror itself is the open item described above.

---

## See also

- [MCP-BFF system service](../system-services/mcpbff.md): the service that owns the
  mirror.
- [`AmqpProvider`](../../spec/AmqpProvider.md) ·
  [`AmqpProviderConfig`](../../spec/AmqpProviderConfig.md) ·
  [`AmqpMirroredTopic`](../../spec/AmqpMirroredTopic.md): schema reference.
- [Big-data & async flows](big-data-and-async-flows.md): the native Kafka / event-stream
  patterns the mirror bridges to.
