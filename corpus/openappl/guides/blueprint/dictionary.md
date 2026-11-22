---
title: Dictionary
---

# Dictionary

Definitions for the words used across the OpenAPPL guides, with the other words you may meet for the same things.

## How to read this page

Entries are alphabetised. Each entry is one to three sentences; other names for the same thing appear as *italic* lines marked **Also called**; in-depth pages are linked under **See**. The "Preferred terms" table at the end maps common or generic words to the term these guides use.

## A–Z

### Action

A small, named operation declared inside a business API's `actions` block (a [`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md) — note the JSON key is `actions`, the pattern class is `BusinessApiActionStore`): fetch an object, validate a parameter, create a row, publish an event, call an integration. Each action class has its own pattern (`FetchObjectAction`, `ValidationAction`, `CreateObjectAction`, …) and runs at a specific workflow milestone.
**See:** [Business APIs overview](../business-apis/overview.md), [Actions overview](../workflow/overview.md).

### Agent harness

A long-running, autonomous agent hosted by the agent hub, declared in `agentHub.harnesses[]` as an [`AgentHarness`](../../spec/AgentHarness.md). It works from skills, documents and scripts, keeps a private working directory, calls the project's tools and runs in a sandboxed process per session. Each conversation with a harness is a *session*. Not to be confused with the author's own AI agent that writes the blueprint.
**See:** [Agent harness](../composition/agent-harness.md).

### agentHub

Optional project-level section, configured via [`AgentHubConfig`](../../spec/AgentHubConfig.md) at `agentHub`. Hosts the AI agents your application ships (`agentHub.aiAgents[]`) with cross-service tool access. When it declares agents, or enables dynamic agents, the compiler generates a dedicated `agentHub` service for them; an empty hub generates nothing.
**See:** [Agent hub](../system-services/agent-hub.md).

### Architect doc

A project-scoped document that the hosting platform stores next to the blueprint: markdown, JSON or source code, addressed by name. The design documents are architect docs, and so are design rationale, runbooks and other notes an author keeps with the project.
**See:** "Design document".

### BFF

The **Backend-for-frontend** system service. Configured under `bffService` on the project root and generated as a dedicated service once the project declares **data views**: it builds and indexes them, and the `get` / `list` business APIs of your services serve them to clients.
**See:** [System services — BFF](../system-services/bff.md).

### Blueprint

A specific project's **JSON instance** of the pattern ontology. Written by an author (a person or an AI agent) from the approved design, validated by the hosting platform against `openappl.json`, and machine-compilable (a compiler turns it into deployable code).
**See:** [Core concepts](concepts.md).

### Bucket

The file-storage *system pattern*. Three flavours: [`RemoteBucket`](../composition/remote-buckets.md) (bytes live with a cloud provider — S3, GCS, Azure Blob, R2, or any S3-compatible endpoint), [`NativeBucket`](../composition/native-buckets.md) (bytes live in an object store managed by the hosting platform — no cloud account or credentials), and [`DbBucket`](../composition/db-buckets.md) (bytes live in the service's own database as `BYTEA`). All live as chapters on a `Service` and emit upload / download routes into that service; there is no separate bucket microservice.

### Business API

The request-handling unit. Declared as a [`BusinessApi`](../../spec/BusinessApi.md) entry inside a service's `businessLogic[]`. Carries metadata, transport bindings (REST / Kafka / SSE / cron / gRPC), action store, and workflow.
*Also called:* endpoint, handler.
**See:** [Business APIs overview](../business-apis/overview.md).

### Business workflow

The lifecycle-ordered lists of action *names* that run inside a business API, one list per milestone of the API's crudType (for a `create`: `afterReadParameters`, `afterCheckParameters`, `afterBuildDataClause`, `afterMainCreateOperation`, `afterSendResponse` and others). Actions live in the action store; the workflow references them by name.
**See:** [Actions and workflow overview](../workflow/overview.md), [Workflow context](../workflow/workflow-context.md).

### Codegen

The act of running a compiler against a blueprint to emit a deployable service codebase. The compile request names the target language and database of each service. The output is normal source in the target language — not pattern instances.
*Also called:* compilation, code generation.
**See:** [the compiler specification](../../compiler/index.md).

### Compiler

A program that reads a validated blueprint and emits the services it describes: source code, tests, API descriptions and container files. OpenAPPL is compiler-neutral; the compiler specification states what a conforming compiler must produce.
**See:** [the compiler specification](../../compiler/index.md).

### CRUD API

A business API whose `crudType` is `create`, `get`, `list`, `update` or `delete`. It gets the standard lifecycle pipeline for that crudType, but like every API it exists only because it is declared in `businessLogic[]`.
**See:** [CRUD APIs](../business-apis/overview.md).

### Custom API

A business API that goes beyond a CRUD shape: its own name and route, its own request parameters, and actions in its workflow. It is still one of the five crudTypes (a `publishOrder` API is an `update`), declared in `businessLogic[]` like any other API.
**See:** [Custom APIs](../business-apis/overview.md).

### Data object

The unit of persistence inside a service. Declared as a [`DataObject`](../../spec/DataObject.md) entry under `services[].dataObjects[]`. Carries the schema (its properties) plus object-level settings (authorization, caching, composite indexes, soft delete, payment activations).
*Also called:* model, table, entity.
**See:** [Data objects](../data-modeling/data-objects.md).

### Data property

A field on a data object. Declared as a [`DataProperty`](../../spec/DataProperty.md). Carries type, requiredness, default value, source (request / session / customData / joined), relation, index settings, and per-property flags.
*Also called:* column, field.
**See:** [Property types](../data-modeling/property-types.md).

### Data view

A read-side projection composed by the BFF service from one or more data objects across one or more services. Defined inside `bffService`; a service's `get` / `list` business API bound to it with `apiOptions.dataViewName` serves it to clients.
*Also called:* view, projection.
**See:** [System services — BFF](../system-services/bff.md).

### Decision layer

The decision pattern family: a decision provider (a System One model, configured under `projectSettings.decisionProvidersSettings`) answers typed questions (`noul` yes/no, `choice`, `score`) about a piece of state with a calibrated confidence, and never with text. Bound into a service by `DecisionAction` (workflow), `FuzzyDomainFilter` (list query), `decisionSource` (stored column), `decisionGate` (agent tool calls), `objectModeration` (moderated writes), `contentModeration` (moderated hub messages and notification content) and the `classify` cleaning rule (judged event-stream columns). Never an authorization decision. Not every compiler target implements it; see the compiler specification.
*Also called:* System One, Jev, decision provider.
**See:** [The decision layer](../capabilities/decision-layer.md).

### Design document

One of the named documents an author writes while designing a project, each stage approved by the people involved before the next one starts: the interview record; the requirement documents (project description report, user stories, PRD, frontend spec, use cases); the specs (project basic setup, microservice definitions, auth spec, one service spec per service, and the platform specs for notification, BFF and agent hub); and, after the build, the test plan and the test report. The names are a convention of the design flow, not part of the blueprint schema: the design flow is a recommended method (spec-driven design, which gives better blueprints), and OpenAPPL itself requires only the blueprint.
**See:** "Spec document", "Architect doc".

### Edge controller

A custom REST controller defined at the edge of a service via [`EdgeController`](../../spec/EdgeController.md). Calls a function from the service library. Use for endpoints that fall outside the BusinessApi machinery — file webhooks, health probes, ad-hoc HTTP integrations.

### Event subscription

A consumer-side binding declared as [`EventSubscription`](../../spec/EventSubscription.md). Exposes Kafka topics to clients via WebSocket or SSE with authorization derived from the underlying data object's access rules. Use for dashboards, live feeds, order tracking, anywhere clients need server-side events.
**See:** [Event subscriptions](../capabilities/event-subscriptions.md).

### General integration

A connector from an integration catalog, attached to a project as its own record by the hosting platform and called via `IntegrationAction` inside a business API workflow. Each provider exposes a fixed set of named methods (e.g. `googleMaps.geocode`). General integrations get no dedicated action types or workflow hooks — they're RPCs.
*Also called:* third-party integration.
**See:** [`IntegrationAction`](../../spec/IntegrationAction.md).

### Hosting platform

The platform that stores each project's design documents and blueprint, validates the blueprint against the pattern ontology, runs a compiler on it, and builds and previews the services. It is not part of the language: any number of platforms and compilers can implement OpenAPPL.
*Also called:* the platform.

### Index

A database-level index declared on a data property (`indexedInDb`, `unique`) or as a composite index on the object (`compositeIndexSettings`). Elasticsearch indexing is separate (`indexedInElastic`).
**See:** [Indexes](../data-modeling/indexes.md).

### Integration action

The `IntegrationAction` action class — invokes a general integration's named method inside a business API workflow.
**See:** [`IntegrationAction`](../../spec/IntegrationAction.md).

### Kafka controller

A business API bound to a Kafka topic via [`ApiKafkaSettings`](../../spec/ApiKafkaSettings.md). The API runs whenever a message arrives on the subscribed topic.
**See:** [Kafka controllers](../business-apis/kafka-controllers.md), [Kafka topic naming](../best-practices/kafka-topic-naming.md).

### Login definition

The [`LoginDefinition`](../../spec/LoginDefinition.md) inside `authentication` — defines the user model, super-admin credentials, identifier strategy (email / mobile / username), verification flows, and (optionally) tenant settings.

### MCP-BFF

The MCP-over-BFF surface — exposes the project's business APIs and data views as MCP tools so AI agents can call them through the Model Context Protocol. It is a surface of the *generated* application, not of the hosting platform.
**See:** [System services — MCPBFF](../system-services/mcpbff.md).

### Membership

Per-resource access control via a paired data object (e.g. `project` plus `projectMember` linking users / roles to projects). Configured via [`MembershipSettings`](../../spec/MembershipSettings.md) on the protected object.

### MScript

OpenAPPL's expression language for blueprint fields like validation rules, default values, computed properties, authorization checks. A strict subset of JavaScript expressions; the compiler turns each expression into generated code wrapped in a diagnostic envelope. MScript is *executable*; specs are *prose*.
*Also called:* JS expressions.
**See:** [MScript overview](../mscript/overview.md).

### Multi-tenancy

Strict data isolation per tenant, enabled at the [`LoginDefinition`](../../spec/LoginDefinition.md) level via [`LoginDefTenantSettings`](../../spec/LoginDefTenantSettings.md). Once enabled, the tenant ID rides every authenticated request and is auto-injected into queries.
**See:** [Multi-tenancy](../data-modeling/multi-tenancy.md).

### Native integration

First-class infrastructure: AI providers, payment providers, invoice providers, notification providers, bucket providers, decision providers. Each has a dedicated `*ProvidersSettings` config shape on `projectSettings`, dedicated action types (`AiCallAction`, `PaymentAction`, `SendMailAction`, `DecisionAction`, etc.), and adapter code in the generated service.
*Also called:* first-party integration.
**See:** [`ProjectSettings`](../../spec/ProjectSettings.md).

### Object moderation

Decision-moderated writes on a data object: `objectSettings.objectModeration` makes the object's create / update apis ask a decision provider for a verdict (`accept` / `reject` / `review`), holds what is not accepted on a generated `sys_<X>ModerationReview` queue, and lets reviewer roles accept or reject it. Content policy, not authorization. The same verdict applied to realtime hub messages and outbound notification content is `contentModeration`.
*Also called:* content moderation, staged writes, review queue.
**See:** [Object content moderation](../capabilities/object-moderation.md).

### Ontology — see "Pattern ontology"

### Pattern class

A single entry in the ontology — e.g. `BusinessApi`, `DataObject`, `AIAgent`. Each pattern class has typed properties and a fixed level.

### Pattern instance

One concrete entry in a blueprint that conforms to a pattern class. A blueprint is a tree of pattern instances.

### Pattern level

Pattern classes are partitioned into six **levels**, from project-wide down to leaf:

| Level | Examples |
|-------|----------|
| project | `Project` |
| service / module | `Service`, `ProjectAuthentication` |
| namespace | `BusinessApi`, `DataObject` |
| chapter | `ObjectSettings`, `BusinessApiBasics`, `BusinessApiActionStore`, `DataProperty` |
| section | `PropertyBasicSettings`, `PropertyRelation`, `ApiRestSettings` |
| subsection | `BucketProvider`, `Package`, `LifecycleHook` |

Level determines where in the blueprint tree each class can appear.

### Pattern ontology

The **pattern catalogue** — the typed schema for everything you can put in a blueprint, published as `openappl.json`. Versioned. Authors don't edit it; the language maintainers do.
*Also called:* the ontology, the schema.
**See:** [Pattern specification](../../spec/index.md).

### PDF

PDF generation is wired through [`RenderPdfAction`](../../spec/RenderPdfAction.md) (which renders a declared `PdfTemplate` or raw HTML to PDF) plus per-service `PdfTemplate` declarations on the service library. The generator layer is provisioned automatically when any service in the project uses these. The PDF surfaces live under the `pdf-*` prefix — `PdfTemplate`, `RenderPdfAction` — distinct from `document`, which is reserved for the project-docs website service.
**See:** [`RenderPdfAction`](../../spec/RenderPdfAction.md).

### Preview

The private environment a project runs in as soon as its services are built, before anything is released: one container per service, each reachable under its own `/<service>-api` route. A hosting platform may put it to sleep when idle.
**See:** "Stage and Production".

### Project blueprint — see "Blueprint"

### Property type

The data type of a property — `ID`, `String`, `Text`, `Integer`, `Boolean`, `Double`, `Decimal`, `Float`, `Short`, `Object`, `Date`, `Enum`, `GeoPoint`, `GeoRoute`, `GeoArea`, `Blob`.
**See:** [Type system](concepts.md#type-system), [Property types](../data-modeling/property-types.md).

### Realtime hub

A bidirectional Socket.IO endpoint declared as [`RealtimeHub`](../../spec/RealtimeHub.md). Provides room management, typed messages, presence tracking, and auto-generated message data objects. Use for chat, collaborative editing, live dashboards.
**See:** [Realtime](../capabilities/realtime.md).

### Relation

A foreign-key reference from one data object to another. Declared on a property by setting `basicSettings.hasRelation: true` and populating the [`PropertyRelation`](../../spec/PropertyRelation.md) block.
*Also called:* association, link.
**See:** [Relations](../data-modeling/relations.md).

### Service

A microservice — the unit of deployment. Declared as a [`Service`](../../spec/Service.md) entry inside `services[]`. Carries data objects, business APIs, edge controllers, libraries, realtime hubs, event subscriptions, file buckets, AI agents, and an optional shopping cart config.

### Service library

The service-local function library where custom helper code lives. Functions are callable from action workflows and edge controllers within the same service. Declared as [`ServiceLibrary`](../../spec/ServiceLibrary.md) on the service.

### Session

The authenticated user context of a generated service — userId, roles, tenant claim (if multi-tenancy is enabled), and any session fields configured on `LoginDefinition`. Used as a value source for properties via [`PropertySessionSettings`](../../spec/PropertySessionSettings.md).

### Spec document

A design document that turns the approved requirements into a technical design: project basic setup, microservice definitions, auth spec, one service spec per service, and the platform specs for the modules the project enables. Specs are *prose-first*: the author writes the blueprint from the approved specs, and a human reads them before reviewing it.
**See:** "Design document".

### Stage and Production

The two deployed environments of a project that follow the preview: stage for acceptance, production for the released application. How a hosting platform deploys to them is outside the language.
**See:** "Preview".

### Static join

A property whose value is copied at write time from another data object. Declared by populating [`PropertyStaticJoin`](../../spec/PropertyStaticJoin.md). Useful for denormalising frequently-read foreign data (e.g. copy `user.clientId` into every `EmailJob.clientId` at create).

### Subsection / chapter / namespace / section — see "Pattern level"

### Workflow milestone

A named slot in a business API's `BusinessWorkflow`, one set per crudType (`workflow.create`, `workflow.update`, …). Every crudType runs `afterStartBusinessApi`, `afterReadParameters`, `afterTransposeParameters`, `afterCheckParameters` and `afterCheckBasicAuth`, then its own steps (for example `afterBuildDataClause` and `afterMainCreateOperation` for a create; `afterBuildWhereClause`, `afterFetchInstance` and `afterCheckInstance` before an update's database operation), and ends with `afterBuildOutput`, `afterSendResponse` and `afterApiEvent`.
**See:** [Actions and workflow overview](../workflow/overview.md), [`BusinessWorkflow`](../../spec/BusinessWorkflow.md).

## Preferred terms

| If you see | These guides say | Why |
|---|---|---|
| "ontology" (used for the JSON instance) | **project blueprint** | Ontology is the schema; the blueprint is one instance of it. |
| "ontology" (used for the schema) | **pattern ontology** | Disambiguates from the blueprint. |
| "document" (the project's own JSON) | **project blueprint** | `document` is reserved — it names the project-docs website service. |
| "Script language", "expression script", or any product-prefixed name of the language | **MScript** | Canonical spelling. |
| "endpoint", "handler" | **business API** | The handler is generated; the authored entity is the business API. |
| "model", "table", "entity" | **data object** | Domain-first naming. |
| "column", "field" | **property** | Property is the language term; carries more than just a DB column. |
| "view", "projection" | **data view** | Standard read-model term. |
| "first-party integration" | **native integration** | The architectural distinction is native vs general, not first vs third party. |
| "third-party integration" | **general integration** | Same. |
| "bucket service" | **`RemoteBucket` / `NativeBucket` / `DbBucket`** | There is no separate bucket microservice — file storage is a chapter of the owning service. |
| "the framework", "the generator" | **the compiler** | The compiler is what turns a blueprint into services; the language itself is OpenAPPL. |
| `readData` / `writeData` / `validateData` and similar `*Data` operation names | the platform's `*Blueprint` operation names | The blueprint, not "data", is what a platform reads, writes and validates. |

## See also

- [Core concepts](concepts.md).
- [Pattern specification](../../spec/index.md) — the auto-generated catalogue.
