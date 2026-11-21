---
title: Project structure
---

# Project structure

An **OpenAPPL project** is the root of your application — the single
typed JSON document from which every microservice, data model,
authentication rule, BFF view, and API workflow is generated. It is the
*source of truth* for your entire backend: the DNA of the system.

The same blueprint serves every audience. A frontend developer reads it
as a stable contract of services and data shapes; a backend developer as
a declarative microservice specification; a product owner as a mapping
from business requirements to behaviour; an AI agent as a full semantic
model that drives deterministic code generation.

This page is the **structural map** of that document. For the primitives
(blueprint, ontology, service, data object, business API, MScript) see
[Core concepts](concepts.md); for the type system and naming rules see
[Type system](concepts.md#type-system) and [Naming rules](concepts.md#naming-rules);
for field-level detail, follow the **Pattern** links to the per-class pages
of the [specification](../../spec/index.md).

> **Authoring model.** An author — a person or an AI agent — writes the
> blueprint, from the design the people involved approve. The hosting
> platform stores it and validates it against `openappl.json`. There is no
> form for creating a service: you describe what you want, or you patch
> the blueprint.

## Top-level schema

The root pattern class is [`Project`](../../spec/Project.md). Its
top-level shape (a new project starts with every section filled with
defaults):

```json
{
  "projectSettings": {},
  "authentication": {},
  "bffService": {},
  "notificationService": {},
  "agentHub": {},
  "services": []
}
```

A blueprint never stores the root class name, so no blueprint changes
with it.

| Field | Type | Req | What it gives you |
|-------|------|-----|-------------------|
| `projectSettings` | `ProjectSettings` | ✓ | name/description, custom variables, AI + payment + bucket + notification provider catalogues, CORS, CI/CD pipeline templates |
| `authentication` | `ProjectAuthentication` | ✓ | login model, JWT/SSO/API-key, verification & 2FA, RBAC/PBAC/OBAC/ABAC, social logins, user/tenant properties, multi-tenancy |
| `bffService` | `BFFService` | ✓ | DataViews — the read-model + aggregation layer (MCMQ); admin endpoints only, never a frontend-facing API |
| `notificationService` | `NotificationService` | ✓ | providers (SMTP/SNS/Twilio/etc.), event-driven notifications, templates, in-app storage |
| `agentHub` | `AgentHubConfig` |  | centralized AI agent host with cross-service tools |
| `enterpriseHub` | `EnterpriseHubConfig` |  | the catalog of enterprise-platform objects, events and actions the project's enterprise integrations work with |
| `services` | `Service`[] |  | the microservices — each owns its data objects, business APIs, library, edge controllers |

There is **no project-level `library`** field. Shared code is a
service-level concept (`Service.library`); see
[Services](services.md).

The `authentication`, `bffService` and `notificationService` sections
compile into the project's **foundation services** (the BFF once it
declares data views), and `agentHub` into the agent hub service once it
declares agents. They are configured here, at the project level —
**not** as entries in `services[]`. See
[Services](services.md#system-services-are-not-in-services).

---

## `projectSettings`

The foundation of the project: identity, environment, provider
catalogues, and infrastructure. Every service inherits these settings.

Pattern: [`ProjectSettings`](../../spec/ProjectSettings.md).

### `basicSettings`

```json
"projectSettings": {
  "basicSettings": {
    "name": "bookstore",
    "fullname": "Online Book Store",
    "description": "A project to sell books online.",
    "avatar": "https://example.com/logo.png",
    "frontendDocument": "# UX Guidelines\nThe application behaves as...",
    "hasAuthentication": true,
    "ignoreDeploymentSpecificFiles": false,
    "customVariables": [
      { "name": "PUBLIC_URL", "value": "https://bookstore.example.com" }
    ]
  }
}
```

- **`name`** — short codename; prefixes folders, resources, URLs.
- **`fullname`** / **`description`** / **`avatar`** — human-facing metadata.
- **`frontendDocument`** — a UX-behaviour document written as an AI
  prompt for frontend developers / frontend AI agents. It describes *how
  the app behaves*, not backend internals.
- **`hasAuthentication`** — enables the project auth module. Usually `true`.
- **`ignoreDeploymentSpecificFiles`** — skip auto-deployment files when
  you manage your own infra. AI agents keep this `false`.
- **`customVariables`** — environment variables shared by all services. A
  name with a secret-shaped word (`JIRA_API_TOKEN`) is a deploy secret unless
  the entry says `secret: false`.

Pattern: [`BasicProjectSettings`](../../spec/BasicProjectSettings.md).

Language is not part of the blueprint: the compile request chooses the
target language of each service (a project default plus a per-service
override), and the database engine is a service option. Do not put
language settings into `basicSettings` or `serviceOptions`. See
[the compiler specification](../../compiler/index.md).

### Provider catalogues

Providers are configured at the project level as **arrays of named
providers** (each entry has a `name` referenced elsewhere in the
blueprint). The generator emits per-provider environment variables so
service code resolves them by name at runtime. An entry's `configuration`
is its base credential set. An AI provider entry can also take a key each
tenant or user stores (`credentialScopes`), and a mail account template
(`ownerScope: tenant | user`) a mailbox each owner connects
([Connected mailboxes](../capabilities/connected-mailboxes.md)).

| Setting | Pattern | Used by |
|---------|---------|---------|
| `aiProvidersSettings` | [`AiProvidersSettings`](../../spec/AiProvidersSettings.md) | `agentHub` agents, `AiCallAction` |
| `paymentProvidersSettings` | [`PaymentProvidersSettings`](../../spec/PaymentProvidersSettings.md) | DataObject `checkout`/`subscription`/`marketplace`, `PaymentAction.providerName` |
| `bucketProvidersSettings` | [`BucketProvidersSettings`](../../spec/BucketProvidersSettings.md) | `RemoteBucket` data |
| `notificationProvidersSettings` | [`NotificationProvidersSettings`](../../spec/NotificationProvidersSettings.md) | notification events, `send*Action.provider` |
| `decisionProvidersSettings` | [`DecisionProvidersSettings`](../../spec/DecisionProvidersSettings.md) | `DecisionAction`, list `fuzzyDomainFilters`, property `decisionSource`, agent `guardrails.decisionGate`, `objectModeration`, `contentModeration`, event-stream `classify` rules (see [The decision layer](../capabilities/decision-layer.md)) |

```json
"aiProvidersSettings": {
  "aiProviders": [
    {
      "name": "mainLlm",
      "provider": "openai",
      "configuration": [
        { "name": "apiKey", "value": "ENTER_CREDENTIAL", "secret": true },
        { "name": "defaultModel", "value": "gpt-4o-mini" }
      ]
    }
  ]
}
```

`provider` picks the adapter and `name` is what the rest of the blueprint
references (`AiCallAction.providerName`, an agent's
`modelSettings.providerName`). An author never asks for credentials and
writes only a reference: the `ENTER_CREDENTIAL` placeholder while no value exists, or
`$ENV:NAME` when the deployment holds it (see [Secrets in a blueprint](secrets.md)). The real value (here the
`apiKey` value) is supplied outside the blueprint, through the hosting
platform, which stores it in the entry's `configuration`, and secret
values reach the services as deploy secrets rather than in the generated
env files.

> Payment uses a **provider abstraction** (Stripe + PayPal / iyzico /
> Adyen / Paddle / Lemon Squeezy / Mangopay), not a Stripe-only flow, and
> every other provider family works the same way: a list of named
> entries. The table above is the core set; [`ProjectSettings`](../../spec/ProjectSettings.md)
> lists every family (invoice, fiscal, mail accounts, video, AMQP, graph,
> big-load stores, enterprise integrations and more). See
> [Payment workflow](../capabilities/payment-workflow.md).

### `corsSettings`

```json
"corsSettings": {
  "useCorsControl": true,
  "configuration": {
    "allowedOrigins": ["https://myapp.com"],
    "allowAllSubdomains": true
  }
}
```

Cross-origin control for all services. `allowAllSubdomains` accepts any
subdomain of the same domain (useful for tenant-per-subdomain apps).
Pattern: [`CorsSettings`](../../spec/CorsSettings.md).

### `pipelineTemplates`

```json
"pipelineTemplates": [
  { "filename": ".gitlab-ci.yml", "template": "<%= serviceName %>:\n  script: echo Building..." }
]
```

EJS templates that render custom CI/CD files into each generated service
root — for teams deploying to their own environment. Pattern:
[`PipelineTemplate`](../../spec/PipelineTemplate.md).

> General integrations — the catalog of third-party APIs such as Amazon S3
> or Google Maps — are not part of `projectSettings`: they are attached to
> the project as their own records by the hosting platform and called
> through `IntegrationAction`.

---

## `authentication`

The project-wide identity and access layer: login models, JWT/session
behaviour, social logins, API keys, verification and 2FA, and the
authorization models (RBAC / PBAC / OBAC / ABAC). It also defines user
and tenant properties and multi-tenancy. Application tokens are signed
with the project's **Ed25519 / EdDSA** key and published via JWKS.

Pattern:
[`ProjectAuthentication`](../../spec/ProjectAuthentication.md). Full
guide: [Authentication](../system-services/authentication/overview.md).

---

## `bffService`

The Back-For-Front layer. It hosts **DataViews** — denormalized,
cross-service read models materialized in Elasticsearch (the **MCMQ**
read side). It exposes admin endpoints only, never a frontend-facing API:
a screen reads a DataView through the consuming service's `get`/`list`
Business API bound with `apiOptions.dataViewName`, without fanning out
across services.

> **What this lets you build:** a single query that assembles a User
> Dashboard from several services, a Product Details view joining
> catalog + inventory + reviews, or an Analytics view aggregating events
> — all without chaining interservice calls.

Pattern: [`BFFService`](../../spec/BFFService.md). Guide:
[BFF service](../system-services/bff.md).

---

## `notificationService`

A dedicated service that turns domain events into user-facing messages
over email, SMS, push, and in-app channels, using configured providers
and templates.

Pattern:
[`NotificationService`](../../spec/NotificationService.md). Guide:
[Notification service](../system-services/notification.md).

---

## `agentHub`

A centralized AI agent host. Once it declares agents (or enables dynamic
agents), it generates a dedicated `agentHub` service that runs AI agents
with **cross-service tool access** (an agent can use tools from any
service in the project), runtime reconfiguration, and optional end-user
agent creation. AI agents are defined here, not per service.

```json
"agentHub": {
  "hubSettings": { "hubBasics": { "description": "AI Agent Hub" } },
  "aiAgents": []
}
```

Pattern: [`AgentHubConfig`](../../spec/AgentHubConfig.md).
Guide: [Agent hub](../system-services/agent-hub.md).

---

## `services[]`

The microservices that carry your domain logic. Each
[`Service`](../../spec/Service.md) is an independent domain boundary
that compiles to its own standalone, deployable microservice. A service
owns:

| Child | Type | Req | What it holds |
|-------|------|-----|---------------|
| `serviceSettings` | `ServiceSettings` | ✓ | `serviceBasics` (name, description, frontendDocument, customVariables, packages) + `serviceOptions` (dbType, ports, M2M, secure events, …); the target language is chosen in the compile request |
| `dataObjects` | `DataObject`[] |  | persistent entities — schema, properties, authorization, cache, indexes, membership |
| `businessLogic` | `BusinessApi`[] |  | the APIs — REST / gRPC / Kafka / SSE / cron, each with request params, data clause, actions + workflow |
| `library` | `ServiceLibrary` |  | custom functions, edge functions, templates, assets |
| `edgeControllers` | `EdgeController`[] |  | custom REST endpoints wired to library functions |
| `aiAgents` | `AIAgent`[] |  | service-local agents (designers use `agentHub` instead) |
| `realtimeHubs` | `RealtimeHub`[] |  | Socket.IO endpoints with rooms, presence, typed messages |
| `eventSubscriptions` | `EventSubscription`[] |  | expose Kafka topics to clients over WS/SSE |
| `shoppingCartConfig` | `ShoppingCartConfig` |  | Redis-first cart with promotions; auto-generates Cart/CartItem (plus the Campaign store with dynamic promotions; a coupon is a campaign row) |
| `dbBuckets` | `DbBucket`[] |  | DB-backed file storage (BYTEA) |
| `remoteBuckets` | `RemoteBucket`[] |  | cloud file storage (S3/GCS/Azure/R2/S3-compatible) |
| `nativeBuckets` | `NativeBucket`[] |  | file storage on an object store managed by the hosting platform, no cloud account needed |

These are the common chapters; [`Service`](../../spec/Service.md) lists
the rest (content models, video rooms, compute jobs, event streams, seed
data and more).

The per-service tree is large enough to deserve its own walk-through —
including the full `serviceBasics` and `serviceOptions` field set — on the
[Services](services.md) page. From there, the children link out to the
[Data modeling](../data-modeling/overview.md) and
[Business APIs](../business-apis/overview.md) guides.

> **What this lets you build:** a `catalog` service of products and
> categories; an `orders` service with checkout and payment workflows; a
> `messaging` service with a realtime hub for chat — each generated
> independently, wired together through events and the BFF.

---

## The blueprint as a semantic world

It helps to read the project not as configuration but as a *structured
theory of your application*:

- **Data objects** are the beings in the world; their **properties** are
  their essence.
- **Services** are the boundaries that separate domains.
- **Authentication** defines identity and responsibility.
- **Business APIs** define the possible actions and their rules.
- **DataViews** define how knowledge aggregates and becomes queryable.
- **Events** define how the world reacts to change.

Whether an AI agent authors this theory from your description or you
craft it by hand, the output is the same: a deterministic bridge from
domain thinking to executable architecture.

## Next

- [Services](services.md) — the per-service settings deep dive.
- [Data modeling](../data-modeling/overview.md) — designing data objects.
- [Business APIs](../business-apis/overview.md) — declaring APIs.
- [Pattern specification](../../spec/index.md) — the full pattern catalogue.
