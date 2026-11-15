---
title: Conformance testing
---

# 11. Conformance testing

A specification without tests drifts. This chapter describes how conformance is shown:
with **reference blueprints** and a **black-box test suite** that runs against any
deployed output. Together they are the executable form of C1 and C2
([chapter 1](01-conformance-model.md)).

The suite decides conformance. A compiler is "OpenAPPL conformant" for a version and a
profile when its output passes the suite, whatever produced that output: templates, an
agent compiler such as a model trained on OpenAPPL, or a hybrid of the two. The blueprint
is the test contract: each case states what a reference blueprint means under this
specification, and checks that the running system does it. No case reads or compares
generated source code.

> **Status.** The conformance kit is being prepared. This chapter fixes its structure and
> the rules for using it, so that compiler authors can plan for it. The kit will be
> published on this site; until then, listings on the [Compilers](../home/compilers.md)
> page are reviewed case by case.

## 11.1 What the kit contains

| Part | Content |
|---|---|
| **Reference blueprints** | A set of valid blueprints, each covering one or more pattern families. They start from the multi-service test project the reference implementation already uses to prove its six language targets against one blueprint. |
| **Black-box suite** | Test cases that talk to a deployed system only through its interface: HTTP requests, event messages on the logical bus, realtime frames. Each case names the reference blueprint it needs. |
| **Bus probe** | A small component that subscribes to, and publishes on, the logical event bus of the system under test, through a broker-neutral adapter the compiler author provides. |
| **Expected results** | For every case, the reference outcome: status, response body (with volatile fields such as ids and timestamps masked), events raised and their payloads. |
| **Profile map** | For every case, the pattern families it exercises, so a compiler runs exactly the cases its profile covers. |

The kit covers the stable part of the language only. No reference blueprint uses an
[experimental element](01-conformance-model.md#experimental-elements), no case exercises one,
and no result depends on whether the compiler under test supports one. When a major release
promotes an experimental element, its cases join the kit with that release.

## 11.2 How a compiler is tested

1. The compiler author picks the reference blueprints inside their profile and compiles
   each with their compiler.
2. They deploy the output with the technology of their choice, and give the kit three
   things: the public base URL of the project, a bus adapter for their broker, and the
   bootstrap credential of the first super admin (seeded by the generated system, see
   [chapter 9.1](09-01-authentication-and-sessions.md)).
3. The kit runs every case of the profile map that falls inside the compiler's profile.
4. The kit compares the results with the expected results and reports per case:
   `pass`, `fail`, `deviation` (a C2 difference covered by a register entry, run again
   with the adapter on) or `not-in-profile`.

A compiler conforms for a profile when every in-profile case passes with its adapters on.

A compiler that does not claim determinism can produce a different system on each run. Its
conformance claim covers all of them ([chapter 1.7.1](01-conformance-model.md#171-openappl-conformant)),
so:

- it **SHOULD** compile each reference blueprint more than once, independently, and run
  the suite against every output;
- it **MUST** publish the results of every run it performed for the claim, and a case
  counts as passed only when it passes on every one of them.

## 11.3 Rules for compilers under test

- A compiler **MUST NOT** detect the reference blueprints and special-case them.
- The deployed system **MUST** be the unmodified compiler output plus configuration.
  Hand edits to generated code invalidate the run.
- The compilation **MUST** take only the blueprint and the compile request as input.
  Human guidance during the run, and a run repeated until it passes without reporting the
  failed runs, invalidate the result.
- An agent compiler **MUST NOT** receive the suite's cases or expected results as input to
  a compilation under test.
- Deviation cases **MUST** pass with the adapter on; their native-mode results are
  informative only.
- A compiler **SHOULD** publish the raw kit report next to its listing, together with the
  kit version and the language version.

## 11.4 Case families

The kit groups its cases by the chapters of this part. Indicative families:

| Family | Exercises | Chapter |
|---|---|---|
| `core.validation` | the compiler refuses invalid blueprints with the right paths | [2](02-compiler-pipeline.md) |
| `core.profile` | the compiler refuses out-of-profile blueprints, emits nothing | [1](01-conformance-model.md) |
| `core.data` | system fields, soft delete, tenant columns, unique indexes | [4](04-data-layer.md) |
| `core.api.<crudType>` | the lifecycle of each API type, routes, envelopes, paging, errors | [5](05-business-apis.md) |
| `core.authz` | each row of the decision tables | [6](06-authorization.md) |
| `core.events` | topic names, payloads, at-least-once delivery, consumer idempotency | [7](07-event-bus.md) |
| `core.expressions` | expression environment, runtime failure labelling | [8](08-mscript.md) |
| `svc.<service>` | one family per system service | [9](09-system-services.md) |
| `core.boot` | a service starts without its dependencies and answers as specified | [10](10-configuration-and-secrets.md) |

> Generated table goes here (S9/S10): the case catalogue with case ids, the reference
> blueprints they use and the families they cover.

## 11.5 Why the suite is black-box

The reference implementation proves its own targets in three layers: unit tests over the
compiler, a gate that compiles a multi-service benchmark project and runs each generated
service's own tests, and a polyglot matrix in which every sample project is compiled for
every language. Only the last kind of evidence carries over to an independent compiler,
because only it compares behaviour from the outside. The kit is therefore built from the
interface inward: whatever a case checks, a client could check too.

In a multi-target system the test suite is, operationally, the semantics: the meaning of
a pattern is what the suite holds equal across compilers. Every rule in this part that a
case does not yet exercise is a gap in the kit, and a contribution is welcome.

## 11.6 Determinism and locality checks

These checks are the evidence for the deterministic claim
([chapter 2.10](02-compiler-pipeline.md#210-the-deterministic-claim)). They are not part
of conformance: a compiler that does not claim determinism does not run them, and its
conformance is unaffected. They need no deployment:

- **Repeatability (D1).** Compile each reference blueprint twice, on two machines if
  possible, and compare the output trees byte for byte.
- **Locality (D2).** Apply a set of small reference patches (rename a property, add an API,
  change a role) and report the output files each patch changes. A changed file outside
  the set derived from the patched place fails the check.

A compiler that claims determinism **MUST** pass both checks and publish their results with
its listing.
