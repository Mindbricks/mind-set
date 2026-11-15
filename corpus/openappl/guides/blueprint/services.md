---
title: Services
---

# Services

A **service** is a domain boundary. It owns its own data objects,
business APIs, library, and edge controllers, and compiles to a
standalone, independently deployable microservice. An OpenAPPL project
is a collection of services that collaborate through events and the BFF.

This page is the per-service deep dive and the lead-in to the
[Data modeling](../data-modeling/overview.md) and
[Business APIs](../business-apis/overview.md) guides. For where the
service sits in the whole project, see
[Project structure](project-structure.md#services).

> There is **no "create service" button**. An author adds a service by
> adding a [`Service`](../../spec/Service.md) object to the project's
> `services[]` array in the blueprint, from the approved service
> definitions of the design.

## `serviceSettings`

Every service carries a `serviceSettings` block with two parts:
`serviceBasics` (identity and metadata) and `serviceOptions`
(generation and runtime behaviour).

```json
{
  "serviceSettings": {
    "serviceBasics": {
      "name": "catalog",
      "description": "Product catalog: products, categories, inventory.",
      "frontendDocument": "# Catalog UX\nList views paginate; ...",
      "customVariables": [{ "name": "PAGE_SIZE", "value": "20" }],
      "packages": [{ "manager": "npm", "name": "slugify", "version": "^1.6.6" }]
    },
    "serviceOptions": {
      "httpPort": 3001,
      "dbType": "postgresql",
      "useSoftDelete": true,
      "wrapMScriptExecution": true
    }
  }
}
```

## `serviceBasics`

Core identifiers and metadata.

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `name` | String | ✓ | Drives files, folders, endpoints, routes. Short, single-word, camelCase. Impacts many system-level identifiers. |
| `description` | Text |  | Human-readable purpose; appears in service docs. |
| `frontendDocument` | Text |  | A service-specific UX-behaviour document, written as an AI prompt (markdown recommended) for the frontend developer / frontend AI agent. Keep it to service-generic UX; data-object specifics belong on the objects. |
| `customVariables` | `DataMapSimpleItem`[] |  | Key-value pairs available to all scripts and functions in the service. |
| `packages` | [`Package`](../../spec/Package.md)[] |  | Third-party dependencies, each with its package manager (`npm`, `pip`, `maven`, `nuget`, `gomod`, `cargo`), name and version. The compiler for the service's target language uses the entries of its own ecosystem and adds them to the generated project's dependency manifest. |

Pattern: [`ServiceBasics`](../../spec/ServiceBasics.md).

### Reserved names and slug collisions

A service is routed by its **slug**: the name normalized to camelCase,
then lower-cased (`creatorProfile` → `creatorprofile`, served at
`/creatorprofile-api`). Validation refuses two kinds of slug, both as
errors:

- **`RESERVED_SERVICE_SLUG`** — the slug belongs to a platform route or
  system service: `auth`, `bff`, `notification`, `agenthub`,
  `agentharnessrunner`, `hub`, `authentication`, `bffservice`,
  `notificationservice`, `document`, `panel`, `frontend`, `sdk`, `tests`,
  `mcpbff`. The spelling does not
  matter: `document_`, `Document` and `docu ment` all slug to `document`.
  The platform address would answer that route, so every API of the
  service would be unreachable; rename it (`documentStore`, or a domain
  word of your own).
- **`SERVICE_SLUG_COLLISION`** — two services of the project share a slug
  (`creator_profile` and `creatorProfile`), so one of them would sit
  unreachable behind the other's address. Two names that differ only in
  case are reported as `DUPLICATE_ASSET_NAME` instead.

The names of system kinds that own no route or container of their own
(`payment`, `invoice`, `ledger`, `bucket`, …) are not reserved: a business
service named `payment` builds and routes normally.

See also [Naming rules](concepts.md#naming-rules).

## `serviceOptions`

Generation and runtime behaviour for the service.

| Field | Type | Notes |
|-------|------|-------|
| `serviceAllowsUserToLogin` | Boolean | Keep **false** unless you are building your own auth/user service. If true, this service exposes login endpoints and acts as an auth provider, instead of the default authentication module. |
| `httpPort` | Integer | HTTP listen port. Use the **3000–3099** range for consistency across microservices. |
| `routerSuffix` | String | A URL suffix to strip before the service's router evaluates the path, for custom deployments. AI agents keep this `null`. |
| `dataModelName` | String | Data-model identifier; use `'main'` or `'default'` (a service has one data model). |
| `dbType` | `DbTypes` | Database engine: `postgresql` or `mongodb`; only these two are accepted. The engine also fixes, at generation time, the form of the system-asset ids (root tenant, super admin, admin group and its member): the canonical UUIDs on PostgreSQL, their 24-hex ObjectId form on MongoDB. Seeded rows AND the seeded references to them (tenant column, `userId`, `ownerId`, `groupId`), the root-tenant checks, the PBAC tenant clause and the tenant-move guard all use that one form; nothing decides it at runtime. |
| `useSoftDelete` | Boolean | Service-wide default for soft delete (records flagged `isActive=false` instead of physically removed). A DataObject can override it. |
| `wrapMScriptExecution` | Boolean | Wraps generated MScript expressions in a diagnostic envelope for runtime error tracing. **Keep true**; set false only after thorough testing if you need maximum runtime performance. |
| `blockedM2MClients` | String[] | Service names blocked from calling this service with **machine-to-machine** tokens. Blocked services can still hit public APIs (`loginRequired: false`) and trigger event-based functions on behalf of users with user tokens. **Wins over `allowedM2MClients`** when a name is on both. A list written under the key `machineToMachineBlockList` is renamed to `blockedM2MClients` on validation, with a `RENAMED_M2M_BLOCK_LIST` warning. |
| `allowedM2MClients` | String[] | Service names allowed to call this service with M2M tokens. When non-empty, only the listed services may call over the M2M path; a refused caller gets 403 `M2M_CLIENT_NOT_ALLOWED`. Both lists are a **second-level guard** applied to the JWKS-verified token issuer — never authentication. |
| `secureEvents` | String[] | Event **aliases** (e.g. `userCreated`, `paymentSucceeded`) that require the project's **Ed25519** signature. On publish, the payload is wrapped as `{ payload, sig, kid, jwks_url }`; on subscribe, the signature is verified and bad messages are dropped. Use across trust boundaries — payment confirmations, audit writes, cross-tenant fan-outs. |
| `publishes` | String[] | Kafka topics this service publishes from code that is not a library module (an inline lifecycle-hook script, for example), so the project's producer census counts them. Prefer declaring `publishes` on the library function that publishes. See [Kafka topic naming](../best-practices/kafka-topic-naming.md#a-topic-published-from-designer-code-declare-it). |

Pattern: [`ServiceOptions`](../../spec/ServiceOptions.md).

The target language is not part of the blueprint: it is chosen in the
compile request, per service, with a project default. See
[the compiler specification](../../compiler/index.md).

> The M2M and `secureEvents` fields tie into project-level security. See
> [M2M communication](../system-services/m2m-communication.md) for the
> M2M allow/block model and the Ed25519/JWKS signing chain.

## How the children compose

A service is the container for the rest of your domain. Each child has
its own section — start here, then follow the link:

- **`dataObjects`** — the persistent entities of the service: schema,
  properties, object-level authorization, Redis cache, indexes,
  membership, soft delete. See
  [Data modeling](../data-modeling/overview.md) and
  [Data objects](../data-modeling/data-objects.md).
- **`businessLogic`** — the service's APIs. Every API is **explicitly
  declared** (REST / gRPC / Kafka / SSE / cron) with its request
  parameters, data clause, and `actions` + `workflow`. Nothing is
  auto-generated; `isDefaultApi` only marks the canonical API for its
  crudType, which the generated documentation labels
  `[Default <crudType> API]`. See
  [Business APIs](../business-apis/overview.md).
- **`library`** — the [`ServiceLibrary`](../../spec/ServiceLibrary.md): custom
  functions, edge functions, templates, and assets, callable from actions,
  computed fields, and MScript. Library functions are written in the
  **service's target language**, not a generic one.
- **`edgeControllers`** — custom REST endpoints wired to library
  functions, beyond the declared business APIs
  ([`EdgeController`](../../spec/EdgeController.md)).

A service can also carry optional chapters: `aiAgents`, `realtimeHubs`,
`eventSubscriptions`, `shoppingCartConfig`, `dbBuckets`, and
`remoteBuckets` — see
[Project structure](project-structure.md#services).

## System services are NOT in `services[]`

The project's foundation services — **auth**, **BFF**, and
**notification** — are configured as **top-level project sections**
(`authentication`, `bffService`, `notificationService`), not as entries
in `services[]`. The agent hub (`agentHub`) is likewise top-level.

A common mistake: modelling a `user` object inside your own service to
replace authentication. Don't. Identity is owned by the project
`authentication` module. To attach your domain data to a user, build a
`userProfile` data object that **references** `auth:user` through a
relation — the auth service stays the single source of identity.

See [System services overview](../system-services/overview.md).

## Next

- [Data modeling](../data-modeling/overview.md) — designing
  `dataObjects`.
- [Business APIs](../business-apis/overview.md) — declaring
  `businessLogic`.
- [`Service` pattern](../../spec/Service.md) — the full field reference.
