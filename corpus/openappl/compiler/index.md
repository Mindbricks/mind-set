---
title: Compiler specification
---

# Compiler specification

Part 3 describes what a conforming OpenAPPL compiler produces from a blueprint, so that
anyone can write a compiler of their own. It specifies **what each pattern causes** in the
running system (storage, routes, authorization decisions, events, errors), never how one
particular compiler's templates produce it.

A compiler of any kind can conform: a template compiler, an agent compiler (for example a
model trained on OpenAPPL) or a hybrid. Conformance is decided by the conformance suite,
and the blueprint is the test contract: the suite checks that the running system does what
the blueprint means under this part. Determinism (the same blueprint gives the same
output, and a small change gives a local change) is a separate claim that a conformant
compiler may add; the reference implementation makes it, an agent compiler need not.

The rules use the RFC 2119 keywords (**MUST**, **SHOULD**, **MAY**). Statements marked
**To verify** have not yet been checked against the reference implementation and are not
normative until the mark is removed. Places marked **Generated table goes here** will hold
catalogues generated from the reference (routes, topics, error codes, environment
variables).

## Chapters

1. [Conformance model](01-conformance-model.md): behavioural (C1) and interface (C2)
   conformance, documented deviations with adapters, profiles and compile-time refusal,
   free technology choices, and the two claims: conformant and deterministic.
2. [Compiler pipeline](02-compiler-pipeline.md): parse, validate, hydrate defaults, lower,
   resolve references, plan services, emit; interface stability for every compiler, and
   the repeatability and diff-locality rules of the deterministic claim.
3. [Logical architecture and topology](03-architecture-and-topology.md): services, data
   objects, APIs, the event bus and the search projection, and how they map onto
   microservices, a modular monolith or functions.
4. [Data layer](04-data-layer.md): logical names, system fields, soft delete, tenant scope,
   indexes, relations, the search projection and the data-access operations.
5. [Business API semantics](05-business-apis.md): the lifecycle of each API type, routes,
   envelopes, pagination, the error body, idempotency and streaming.
6. [Authorization model](06-authorization.md): the order of gates, roles and absolute
   roles, permissions, ownership and tenant isolation as decision tables.
7. [Event bus contract](07-event-bus.md): topic naming, the envelope, delivery semantics
   and APIs triggered by events.
8. [MScript](08-mscript.md): expression slots, their environment and evaluation, the trust
   model and conversion between languages.
9. [System services](09-system-services.md):
   [authentication and sessions](09-01-authentication-and-sessions.md),
   [backend for frontend](09-02-bff.md), [notification](09-03-notification.md),
   [payment](09-04-payment.md), [realtime](09-05-realtime.md),
   [storage buckets](09-06-storage-buckets.md), [agent hub](09-07-agent-hub.md),
   [shopping cart](09-08-cart.md) and the
   [compute, graph and decision layers](09-09-compute-graph-decision.md).
10. [Configuration and secrets](10-configuration-and-secrets.md): the environment surface,
    credential fallbacks, the boot rule and the health routes.
11. [Conformance testing](11-conformance-testing.md): reference blueprints, the black-box
    suite that decides conformance, how a compiler of any kind is tested, and the checks
    behind the deterministic claim.
12. [Derived surface](12-derived-surface.md): what a compiled blueprint contains beyond what
    it declares: the elements high-level patterns lower to, implicit routes, implicit
    storage and the library surface that authored code calls.

## Related

The [ontology](../ontology/index.md) (Part 1) shows how the patterns fit together; the
[specification](../spec/index.md) (Part 2) and the [schema](../spec/openappl-json.md)
define what a valid blueprint is.
