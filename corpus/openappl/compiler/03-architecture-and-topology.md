---
title: Logical architecture and topology
---

# 3. Logical architecture and topology

A blueprint describes a **logical** system: services, their data, their APIs and the
events between them. This chapter names the logical building blocks a compiler must
produce and states what stays fixed when they are mapped onto a physical topology.

## 3.1 Logical building blocks

| Block | From the blueprint | What it is in the generated system |
|---|---|---|
| **Project** | the root `Project` | The whole system: one identity domain (users, tenants, sessions), one logical event bus, one search projection, one set of system services. |
| **Service** | each entry of `services` | A unit with its own data store, its own business APIs, its own event producers and consumers, and its own public base path. |
| **Data object** | `Service.dataObjects[]`, and the data objects that high-level patterns lower to ([12.1](12-derived-surface.md#121-lowering)) | Stored records with system fields, a data-access function set, change events and a search projection ([chapter 4](04-data-layer.md)). |
| **Business API** | `Service.businessLogic[]` | One externally callable operation with a fixed lifecycle ([chapter 5](05-business-apis.md)). Besides the declared APIs, a service has the APIs that high-level patterns lower to and the implicit routes of its properties and settings ([chapter 12](12-derived-surface.md)). |
| **Edge controller** | `Service.edgeControllers[]` | A hand-written REST, event or scheduled entry point mounted beside the generated ones. |
| **Event subscription** | `Service.eventSubscriptions[]` and event-triggered APIs | A consumer on the logical event bus ([chapter 7](07-event-bus.md)). |
| **Scheduled job** | `Service.cronJobs[]` and scheduled APIs | A time-triggered call into the service. |
| **System service** | `authentication`, `bffService`, `notificationService`, `agentHub` and the provider settings at project level | Services the compiler adds to the project ([chapter 9](09-system-services.md)). |
| **Logical event bus** | implied | The asynchronous channel between services. The ontology calls it "Kafka"; any broker conforms ([chapter 7](07-event-bus.md)). |
| **Search projection** | implied by every data object | A queryable read model of every data object, written by the owning service on every write and readable by every service, used for search-backed lists, cross-service reads and BFF views ([chapter 4](04-data-layer.md#49-search-projection)). |
| **Cache** | object and API cache settings | An optional key-value cache. Behaviourally transparent except where the blueprint declares cached reads. |
| **Object storage** | bucket patterns | A blob store behind the storage contract ([chapter 9.6](09-06-storage-buckets.md)). |

## 3.2 How services interact

Services interact in exactly these ways. A compiler **MUST** provide each of them for
every topology it supports, and **MUST NOT** add a hidden synchronous dependency between
services that the blueprint does not declare.

| Interaction | Declared by | Semantics |
|---|---|---|
| **Events** | data object change events, API events, subscriptions | Asynchronous; consumed at least once ([chapter 7](07-event-bus.md)). The producer's request never waits for a consumer. |
| **Remote reads** | a reference to a data object of another service (fetch actions, joins, statistics, membership lookups) | Read from the search projection of the remote object. The owning service is **not** called. Results are eventually consistent with the owner's store. |
| **Explicit calls** | inter-service call actions, gRPC clients, M2M calls | A synchronous call that the blueprint declares, with a machine identity ([chapter 9.1](09-01-authentication-and-sessions.md)). |
| **Shared identity** | the authentication section | Every service validates the same session token without calling the authentication service on each request ([chapter 9.1](09-01-authentication-and-sessions.md)). |

Rule example. A `reviews` service fetches the product a review belongs to:

```json
{
  "name": "fetchProduct",
  "targetObject": "product",
  "matchValue": { "js": "this.review.productId" }
}
```

`product` is not an object of `reviews`, so it is a remote object. The generated
`reviews` service **MUST** read `product` from its search projection. It **MUST NOT** call
the `catalog` service's HTTP API to get it. If the projection does not hold the product
yet, the fetch behaves exactly as for a product that does not exist.

## 3.3 Public addressing

Each logical service has its own **base address**. Every route a service exposes is
relative to it, and is reachable both at its path and under `/v1`
([chapter 5](05-business-apis.md#53-routes)).

- A compiler **MUST** keep the routes of different services apart, even when several
  services share a process.
- On the project's public host, the reference publishes each service under the prefix
  `/<serviceName>-api` (service name lower-cased), so that `POST /orders` of service
  `order` is `https://<host>/order-api/orders`. A compiler **SHOULD** use the same public
  prefix, so that clients configured for the reference work unchanged.
- Inside a service, routes are as specified in chapters 5 and 9.

> **To verify:** whether the public prefix `/<serviceName>-api` is part of the reference
> interface (it is applied by the reference deployment, not by the generated service) and
> whether it carries a version segment (one naming page writes
> `/<serviceName>-api/v<version>/`).

## 3.4 Topology mappings

The topology is free (see [chapter 1](01-conformance-model.md#13-free-technology)). The
following three mappings are the ones this specification has in view; a compiler **MAY**
use another one if it keeps the invariants of section 3.5.

### Microservices (reference)

One deployable unit per logical service, each with its own database (or its own schema in
a shared server), connected by a message broker. The system services are deployables of
their own. This is the topology of the reference implementation.

### Modular monolith

Several or all logical services run in one process.

- Each logical service **MUST** keep its own data namespace (schema, database or table
  prefix). One service **MUST NOT** read another service's tables directly; remote reads
  still go through the search projection semantics of section 3.2.
- Events **MAY** be delivered by an in-process bus. Delivery **MUST** still be
  asynchronous to the producing request: a consumer's failure or slowness **MUST NOT**
  fail or delay the producer's response, and a consumer **MUST** see the event only
  after the producer's write is committed.
- A compiler **MAY** keep the search projection in the same database, if the read results
  are the ones [chapter 4](04-data-layer.md) specifies.

### Function per API

Each business API (or each service) is deployed as a serverless function.

- Session validation **MUST** happen in each invocation, from the token alone, without a
  call to the authentication service.
- Scheduled jobs **MAY** become scheduled triggers of the platform; event subscriptions
  **MAY** become queue-triggered functions. Their semantics stay those of
  [chapter 7](07-event-bus.md).
- Long-lived connections (realtime hubs, server-sent event streams, agent streams) need a
  component that holds connections. A compiler **MUST** either provide one (for example a
  managed WebSocket gateway behind an adapter) or refuse those families in its profile.
- Platform-forced interface differences (headers, payload limits, timeouts) are
  deviations: they need a register entry and an adapter
  ([chapter 1](01-conformance-model.md#14-documented-deviations-and-adapters)).

## 3.5 Invariants under every topology

Whatever the topology, the following **MUST** hold:

1. The public interface of every service is the one chapters 5 and 9 specify, under the
   base address of section 3.3.
2. Every write commits before any event about it can be consumed.
3. Events are consumed at least once, and consumers tolerate duplicates
   ([chapter 7](07-event-bus.md#75-delivery-semantics)).
4. A session token issued by the authentication service is accepted by every service of the
   project, and rejected by every service of any other project.
5. Tenant isolation holds across services: no route, event consumer or remote read crosses
   a tenant boundary that [chapter 6](06-authorization.md) does not allow.
6. A service starts even when a dependency (database, broker, search engine, a provider) is
   unavailable, and answers requests as [chapter 10](10-configuration-and-secrets.md)
   specifies.

Rationale: these invariants are what a client and an operator can observe. Everything else
about the topology is an engineering trade-off the compiler is free to make.
