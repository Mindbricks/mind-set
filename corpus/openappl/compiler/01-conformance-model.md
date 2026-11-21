---
title: Conformance model
---

# 1. Conformance model

This chapter defines what it means for a compiler to conform to OpenAPPL. Every later
chapter states its rules against the two conformance classes defined here.

A compiler can make two claims about itself (section 1.7):

| Claim | Meaning | Who can make it |
|---|---|---|
| **OpenAPPL conformant** | The systems it produces meet C1 and C2 for its profile, shown by passing the conformance suite ([chapter 11](11-conformance-testing.md)). | Any compiler: a template compiler, an agent compiler or a hybrid. |
| **Deterministic** | In addition, the same input gives the same output, and a small blueprint change gives a localised output change ([chapter 2.10](02-compiler-pipeline.md#210-the-deterministic-claim)). | A conformant compiler that meets the deterministic rules. |

The first claim is about what the output does; the second is about how the compiler
behaves. No rule of this part makes a compiler non-conformant because it is not
deterministic.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT** and **MAY**
are to be read as described in RFC 2119 when they appear in bold or in capitals. A sentence
without one of them is explanation, not a rule.

## 1.1 Terms

| Term | Meaning |
|---|---|
| **Blueprint** | A JSON document that is valid against `openappl.json` and the constraints of Part 2. |
| **Compile request** | The input next to the blueprint that selects the technical stack: at least the target language of each service, and optionally a database engine override. It is not part of the blueprint. |
| **Compiler** | A program that turns a blueprint and a compile request into a runnable system. It may use templates, AI synthesis or both. |
| **Template compiler** | A compiler that produces its output from templates and fixed rules. |
| **Agent compiler** | A compiler whose output is produced, in whole or in part, by an AI model, for example a model trained on OpenAPPL, working from the blueprint. It may be non-deterministic. |
| **Hybrid compiler** | A compiler that combines templates and an AI model, for example templates for the interface and a model for the business logic. |
| **Conformance suite** | The reference blueprints, black-box test cases and expected results of [chapter 11](11-conformance-testing.md). Also called the conformance kit. |
| **Test contract** | The blueprint, read through this specification: it fixes what the generated system must do and therefore what the suite checks. The generated code is never the contract. |
| **Generated system** | Everything the compiler emits: services, their storage schema, their routes, their event producers and consumers, their configuration surface. |
| **Reference implementation** | The compiler whose observable behaviour currently defines the test obligations of this specification. Today this is Genesis, the first OpenAPPL compiler (see [Compilers](../home/compilers.md)). |
| **Observable** | Visible to a client of the generated system without reading its code: HTTP requests and responses, event messages on the bus, realtime frames, rows or documents read back through the system's own APIs, and log-free side effects such as a sent notification. |
| **Wire name** | A name that appears on the wire: a route path, a header, a cookie, a JSON field, a topic, a frame name. Wire names are part of the interface even when they carry a vendor prefix today. |

## 1.2 The two conformance classes

### C1: Behavioural conformance

A compiler **MUST** produce, for every blueprint it accepts, a system whose functional
behaviour equals the behaviour this specification assigns to that blueprint (the
reference behaviour, section 1.6):

- the same **validation outcomes**: a request the reference rejects is rejected, a request
  it accepts is accepted;
- the same **authorisation decisions** for the same session and the same data
  ([chapter 6](06-authorization.md));
- the same **state transitions** of the stored data, including system fields, soft delete
  and tenant scoping ([chapter 4](04-data-layer.md));
- the same **events**, raised under the same conditions ([chapter 7](07-event-bus.md));
- the same **error classes and HTTP statuses** ([chapter 5](05-business-apis.md)).

Rationale: an author reviews a blueprint, not code. A reviewer who approves "only
organisation admins may close an item" must get that rule from every compiler.

### C2: Interface conformance

A compiler **MUST** produce a system whose external interface equals the reference
interface, so that a client written against one compiler's output runs unchanged against
another's:

- the same **routes**: paths, methods, path and query parameter names;
- the same **request and response envelopes**, including field names and the shape of
  lists and paging;
- the same **authentication and session protocol**: login, token and cookie names, token
  validation, logout ([chapter 9.1](09-01-authentication-and-sessions.md));
- the same **error body**;
- the same **realtime and streaming frames**;
- the same **event payload shapes** and **topic names** on the logical event bus.

Rationale: frontends, mobile clients, AI agents and other services are written against the
interface. Interface conformance is what lets a team switch compilers without rewriting
its clients.

### What is not covered

Conformance is about what a client can observe. It **does not** cover the source code, its
layout, its frameworks, its internal module boundaries, its log format, its performance or
its resource use. A compiler **MAY** produce code that looks nothing like the reference.
It also does not cover how the compiler works: templates, a model, or both, run once or
repeated, with the same or different source code on each run.

Experimental elements of the schema are outside both classes: C1 and C2 oblige a compiler
only for the stable part of the language. What a compiler does with an experimental
element is fixed in [Experimental elements](#experimental-elements) (section 1.5).

## 1.3 Free technology

Everything below the interface is the compiler's choice. A compiler **MAY** choose freely:

| Dimension | Free choices (examples) | Constraint |
|---|---|---|
| Deployment topology | one process per service, a modular monolith, a function per API | The interface of every service stays reachable under its documented routes ([chapter 3](03-architecture-and-topology.md)). |
| Programming language and frameworks | any | Expression slots are written in the target language ([chapter 8](08-mscript.md)). |
| Database engine | relational, document, a managed store (for example a key-value or wide-column cloud database), or a subset of these | The data semantics of [chapter 4](04-data-layer.md) hold. |
| Event bus | the ontology calls the bus "Kafka"; this is the **logical event bus**. Kafka, NATS, RabbitMQ, SNS and SQS, Google Pub/Sub, or an in-process bus in a monolith all conform | Topic names, payloads and delivery semantics of [chapter 7](07-event-bus.md) hold. |
| Cache | any key-value store, or none | A cache never changes a response, except where the blueprint declares cached reads. |
| Search engine | any full-text / filter engine | Search-backed reads return what [chapter 4](04-data-layer.md) says they return. |
| Object storage | any blob store | The storage contract of [chapter 9.6](09-06-storage-buckets.md) holds. |

The ontology contains a short, closed list of **technical selectors** (for example the
provider of a payment or notification integration, or the database engine default of a
service). Where a selector names a concrete product, a compiler that does not support that
product **MUST** treat the selector as outside its profile (section 1.5) rather than
silently substituting another product.

Rule example. The blueprint declares a data object with change events:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "order" }
  }
}
```

The reference raises the created-event of `order` on its event bus on every successful
create. A compiler that uses NATS conforms if a subscriber of the same logical topic name
receives the same payload after a create. A compiler that only writes the row and raises
nothing does not conform (C1), whatever broker it uses.

## 1.4 Documented deviations and adapters

Sometimes a technology forces a visible difference: a serverless platform adds a cold-path
header, a managed database cannot produce the reference ID format, a function platform
caps a response size. Such a difference is a **deviation**.

- A compiler **MUST NOT** deviate from C1. A behavioural difference is a defect, not a
  deviation.
- A compiler **MAY** deviate from C2 only when the deviation is forced by a technology the
  compiler supports, and only when it:
  1. records the deviation in its **deviation register** (format below), and
  2. ships an **adapter** that still accepts and produces the reference interface.
- The adapter **MUST** be enabled by default. A user **MAY** turn it off to use the native
  interface; the compiler **MUST** then say so in the generated documentation.
- An unregistered C2 difference is a defect.

Rationale: a deviation that a client cannot work around breaks every client written against
the reference. The adapter keeps "write once, run against any compiler" true; the register
makes every exception reviewable.

### Deviation register format

A compiler publishes its register as one machine-readable file (JSON or YAML) next to its
documentation. Each entry has the following fields:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable identifier, `DEV-<compiler>-<number>`, never reused. |
| `title` | yes | One line. |
| `openapplVersions` | yes | The language versions the entry applies to, as a semver range. |
| `scope` | yes | What the deviation touches: a pattern path (`BusinessApi.apiOptions.crudType=list`), a family, or `global`. |
| `technology` | yes | The technology choice that forces it (for example "function-per-API on platform X", "managed key-value store Y"). |
| `class` | yes | Always `C2`. |
| `reference` | yes | The reference interface, as observed (route, header, field, format). |
| `native` | yes | What the compiler's output does without the adapter. |
| `adapter` | yes | How the adapter restores the reference interface, and where it runs (in the service, in a gateway, in a client library). |
| `adapterDefault` | yes | `on` (required value) and how a user turns it off. |
| `detection` | no | How a client can tell that the native interface is active (for example a response header). |
| `tests` | yes | The conformance-kit cases that pass with the adapter on ([chapter 11](11-conformance-testing.md)). |

Example entry:

```yaml
- id: DEV-acme-0007
  title: Object ids are 26-character ULIDs in the native interface
  openapplVersions: ">=1.0 <2.0"
  scope: global
  technology: managed key-value store "kv-cloud" (no UUID type)
  class: C2
  reference: ids are UUID strings in every envelope and path parameter
  native: ids are ULID strings
  adapter: the service keeps a UUID column per object and maps UUID <-> ULID at the route layer
  adapterDefault: "on; set ACME_NATIVE_IDS=true to expose ULIDs"
  detection: response header "x-acme-native-ids: 1"
  tests: [core.ids.*, core.list.paging.*]
```

## 1.5 Profiles and compile-time refusal

A compiler does not have to support every pattern family. It **MAY** declare a **profile**:
the set of [pattern families](../ontology/families.md) and technical selector values it
supports.

- A compiler **MUST** publish its profile as part of its public description: the families
  it supports in full, the families it refuses, and for partially supported families the
  properties or selector values it refuses.
- A compiler **MUST** refuse, at compile time, a blueprint that uses a refused family,
  property or selector value. The refusal **MUST** name the blueprint path of every
  offending node, the family, and the profile that excludes it.
- A compiler **MUST NOT** emit a system that silently drops, stubs or weakens a declared
  feature. "Accept and ignore" is never conforming.
- A compiler **MAY** refuse a feature for one target language and accept it for another
  (the reference does this: its compute host is available on some targets only).
- A blueprint feature that is inactive (for example a section whose activation flag is
  off) **MUST NOT** cause a refusal.

Rationale: a smaller honest profile is safe; a larger dishonest one ships systems that look
right in review and behave wrong in production.

Rule example. A compiler whose profile excludes the graph layer receives:

```json
{
  "projectSettings": {
    "graphProvidersSettings": { "graphProviders": [ { "name": "main", "provider": "neo4j" } ] }
  }
}
```

It stops before emitting anything and reports, for example (the message format is the
compiler's own; the content is required):

```text
PROFILE_REFUSED  projectSettings.graphProvidersSettings.graphProviders[0]
  family GraphProvidersSettings is outside profile "acme-core-1"
```

> Generated table goes here (S9): the pattern families with their activation flags, so
> that a profile can be stated and checked mechanically.

### Experimental elements

`openappl.json` may carry **experimental** elements: a whole pattern, or a single property
added to a stable pattern, marked in the schema with an `experimental` meta key that holds
the schema version that added it and a note on what may still change:

```json
"__<Pattern>.experimental": { "since": "<schema version>", "note": "<why, what may change>" }
```

Inside a pattern, `"__<property>.experimental"` marks one property the same way. The
current list is on [Experimental elements](../spec/experimental.md) in Part 2.

An experimental element is a pre-release of a future stable element. It may arrive in a
minor release, and it may change or disappear before the next major release, which either
promotes it (the marker is removed and the element becomes part of C1 and C2) or drops it.

- Experimental elements are **outside conformance**. They carry no C1 or C2 obligation, the
  conformance suite does not exercise them ([chapter 11](11-conformance-testing.md)), and a
  compiler **MUST NOT** be required to support any of them to claim conformance.
- A compiler that does not support an experimental element **MUST** refuse, at compile time,
  a blueprint that uses it: an instance of an experimental pattern anywhere in the
  blueprint, or an experimental property that is set (present, not `null`, not an empty
  list). The refusal **MUST** carry the typed error `EXPERIMENTAL_NOT_SUPPORTED` and name the
  blueprint path and the experimental pattern or property. As with a profile refusal, the
  compiler emits nothing; it **MUST NOT** compile the blueprint without the element.
- Such a refusal is not a profile exclusion and not a deviation: the compiler stays
  conformant, and it does not list the element in its profile or its deviation register.
- A compiler that supports an experimental element **MAY** compile blueprints that use it,
  and **SHOULD** warn when one does. It **MUST** name the experimental elements it supports
  in its public description, apart from its conformance claim. The reference implementation
  supports every experimental element and warns with `EXPERIMENTAL_ELEMENT_IN_USE`.
- Blueprint authors opt in. An agent **MUST NOT** add an experimental element unless its
  skill explicitly permits that element for the selected compiler.

Rule example. A compiler that does not support an experimental property reports, for
example (the message format is the compiler's own; the code and the content are required):

```text
EXPERIMENTAL_NOT_SUPPORTED  services[0].dataObjects[2].<property>
  property <property> of <Pattern> is experimental (since <version>) and not supported
```

### Suggested profile names

The standard does not fix profile names. To make listings comparable, a compiler
**SHOULD** describe its profile in terms of these groups:

| Group | Families (indicative) |
|---|---|
| Core | project settings, services, data objects, properties, indexes, business APIs, workflows and actions, authentication and sessions, authorisation, the event bus |
| Data engines | relational, document, managed store |
| Reads | search-backed lists, BFF data views |
| Integrations | notification, payment, storage buckets, AI agents, realtime |
| Advanced layers | compute, graph, decision, cart, ledger |

## 1.6 The reference implementation and conflicts

- Where this specification and the reference implementation disagree, the disagreement is
  a defect in one of them and **SHOULD** be reported. Until it is resolved, the
  specification text wins for new compilers, and the conformance kit records the case as
  a known difference.
- Where this specification is silent, the reference behaviour is the rule.
- Items marked **To verify** in this part are statements the authors have not yet checked
  against the reference. They are not normative until the mark is removed.

## 1.7 The two claims

### 1.7.1 OpenAPPL conformant

A compiler is **OpenAPPL conformant** for a language version and a profile when the
systems it produces meet C1 and C2 for every blueprint inside that profile.

- Conformance **MUST** be shown by the conformance suite ([chapter 11](11-conformance-testing.md)).
  The suite decides; a review of the compiler's source, templates, prompts or model does
  not replace it.
- The blueprint is the test contract. The suite compiles reference blueprints and checks
  the running output against what this specification says those blueprints mean. It never
  compares source code.
- The claim covers every system the compiler produces, not one run. A compiler whose output
  can differ between runs **MUST** meet C1 and C2 on each of them; a run that fails is a
  defect of the compiler, even if another run passes.
- The claim does not depend on how the output is produced. A template compiler, an agent
  compiler and a hybrid compiler reach conformance on the same terms.

Rationale: an author reviews a blueprint, and a client is written against an interface.
Both care about what the running system does. A suite that checks the system from the
outside, against the blueprint, protects them whatever produced the code.

### 1.7.2 Deterministic

A conformant compiler **MAY** also claim to be **deterministic**. It **MUST** then meet
both rules of [chapter 2.10](02-compiler-pipeline.md#210-the-deterministic-claim):

- **D1 Repeatability:** the same blueprint, compile request and compiler version give
  byte-identical output.
- **D2 Diff locality:** a small change to the blueprint changes only the part of the
  output derived from the changed place.

The deterministic claim is additional: it never replaces conformance, and its absence never
reduces it. A compiler that uses an AI model **MAY** make the deterministic claim when it
meets D1 and D2, for example by pinning the model, its parameters and its inputs as part of
the compiler version.

Rationale: determinism makes regeneration safe and code diffs reviewable after a blueprint
diff. These are valuable properties of a compiler, but they are not what a client of the
generated system depends on.

### 1.7.3 Stating the claims

A compiler states its claims by publishing:

1. its name, maintainer, licence, its kind (template, agent or hybrid) and the OpenAPPL
   versions it supports;
2. its profile (section 1.5);
3. its deviation register (section 1.4);
4. its conformance-suite results ([chapter 11](11-conformance-testing.md));
5. if it claims determinism, the results of the repeatability and locality checks
   ([chapter 11.6](11-conformance-testing.md#116-determinism-and-locality-checks)).

A claim names its scope, for example: "OpenAPPL conformant, version 1.x, profile Core plus
Data engines" or "OpenAPPL conformant and deterministic, version 1.x, profile Core". A
compiler **MUST NOT** state the deterministic claim without the conformant claim.

The reference implementation, Genesis, makes both claims. An agent compiler is not expected
to make the second.

The listing process is described on the [Compilers](../home/compilers.md) page.
