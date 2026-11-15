---
title: System services
---

# 9. System services

Some parts of a blueprint do not describe one service's data and APIs but a capability
of the whole project: users and sessions, notifications, payments, realtime rooms, AI
agents. For these the compiler adds **system services** or **system routers** to the
generated system. This chapter and its sections state, for each one, when it exists,
which APIs, data objects and events it produces automatically, and its configuration
surface.

## Common rules

- A system service is an ordinary logical service ([chapter 3](03-architecture-and-topology.md)):
  its data objects follow [chapter 4](04-data-layer.md), its APIs follow
  [chapter 5](05-business-apis.md) and [chapter 6](06-authorization.md), its events
  follow [chapter 7](07-event-bus.md). Only the parts listed in the sections below are
  added automatically.
- A system **router** is a set of routes added to a service that the blueprint declares
  (a bucket, a payment-enabled object, a realtime hub, a cart). Its routes are part of
  that service's interface and its API description.
- System data objects that high-level patterns add carry the `sys_` prefix
  ([chapter 4](04-data-layer.md#42-logical-names)).
- A system service or router exists only when its activation condition holds. A compiler
  **MUST NOT** emit one that the blueprint does not activate, and **MUST** emit every one
  it does activate, or refuse the blueprint ([chapter 1](01-conformance-model.md#15-profiles-and-compile-time-refusal)).
- Wire names stay as the reference spells them, including vendor-prefixed ones.

## The sections

| § | Section | Activated by | Kind |
|---|---|---|---|
| 9.1 | [Authentication and sessions](09-01-authentication-and-sessions.md) | `authentication` | service `auth` |
| 9.2 | [Backend for frontend](09-02-bff.md) | `bffService.dataViews` not empty | service `bff` |
| 9.3 | [Notification](09-03-notification.md) | event notifications, verification flows, send actions | service `notification` |
| 9.4 | [Payment](09-04-payment.md) | `checkout`, `subscription`, `marketplace` on a data object | router on the owning service |
| 9.5 | [Realtime](09-05-realtime.md) | `realtimeHubs`, `eventSubscriptions` | router and socket server on the owning service |
| 9.6 | [Storage buckets](09-06-storage-buckets.md) | `remoteBuckets`, `nativeBuckets`, `dbBuckets` | router on the owning service |
| 9.7 | [Agent hub](09-07-agent-hub.md) | `agentHub` with agents, dynamic agents or a harness | service `agentHub` and agent routers |
| 9.8 | [Shopping cart](09-08-cart.md) | `shoppingCartConfig.basicSettings.useShoppingCartFeature` | router on the owning service |
| 9.9 | [Compute, graph and decision layers](09-09-compute-graph-decision.md) | compute jobs, graph providers, decision providers | APIs, write hooks and actions |

## Route catalogues

The full route list of each system service and router is long and changes with the
language version. It is published as a generated table, not written by hand here.

> Generated table goes here (S9): the system route catalogue per section (method, path,
> login requirement, public or operator-only), taken from the same source that the
> reference's own route-census tests use.

Each section below lists the route **families** and representative routes, so that a
compiler author knows the shape before reading the catalogue.
