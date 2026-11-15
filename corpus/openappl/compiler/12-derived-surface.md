---
title: Derived surface
---

# 12. Derived surface

A blueprint declares less than the generated system contains. Some patterns stand for many
core elements, some properties bring routes with them, the runtime keeps bookkeeping
storage of its own, and every service carries a library that authored code calls by name.
Together these are the **derived surface** of a blueprint: everything a compiled project
exposes or stores that the blueprint does not spell out element by element.

The derived surface is part of conformance. A client calls derived routes, authored library
code calls derived functions, and lowered data objects raise events like declared ones.
This chapter lists it in four parts:

1. [Lowering](#121-lowering): high-level patterns and the core elements they stand for.
2. [Implicit routes](#122-implicit-routes): routes that no business API in the blueprint declares.
3. [Implicit storage](#123-implicit-storage): storage that is not a data object.
4. [Library surface](#124-library-surface): what authored library code and MScript can call.

General rules:

- A compiler **MUST** produce the derived surface this chapter lists for each trigger,
  and **MUST NOT** add routes, data objects or library members beyond it and the declared
  blueprint.
- The names in the tables are the reference names. Names of data objects, business APIs,
  routes, events and library members are interface (C2): a compiler **MUST** keep them, or
  document the difference with an adapter ([chapter 1](01-conformance-model.md)).
- Names of implicit storage (tables, indices, cache keys, object-storage prefixes) are
  not interface unless the table in 12.3 says so: storage is a free technology choice
  ([chapter 1](01-conformance-model.md#13-free-technology)), and only the behaviour it
  supports is required.

## 12.1 Lowering

A **high-level pattern** is one whose meaning is a set of core elements: data objects,
properties, business APIs, cron jobs, event subscriptions, or a whole service.
[Stage 4 of the pipeline](02-compiler-pipeline.md#25-stage-4-lower-high-level-patterns)
lets a compiler either lower such a pattern or emit its behaviour directly; this section
fixes **what** the lowered result is, so that both approaches can be held to the same
observable surface.

How the reference lowers:

- Lowering runs on an **in-memory copy** of the blueprint, after parsing and before the
  rest of the compilation. The stored blueprint is never rewritten: an author does not see
  the lowered elements in the blueprint they edit.
- A lowered data object or business API is compiled exactly like a declared one: the same
  system fields, data-access operations ([4.10](04-data-layer.md#410-data-access-operations)),
  change events, search projection, lifecycle, authorization and API documentation.
- Lowered elements carry a **built-in** mark. Tools that show the compiled project
  **SHOULD** show the mark, so that an author can tell a lowered element from a declared one.
- System data objects are named with the `sys_` prefix. Names that depend on a declared
  object put that object's name in the middle: `sys_<X>Payment` for the order object `X`.
- When the author declares an element with the name of a lowered one, the lowered
  definition wins inside system services (authentication, notification). Elsewhere the
  collision is reported at compile time.
  **To verify:** whether every family reports the collision, or only the families with an
  injected-API census.

A compiler **MUST** lower in a fixed order: later families build on earlier ones (for
example, the cron family sees the cron jobs that notification retention and agents add).
The reference order is: content models, video rooms and realtime hubs; then the system
services (authentication first); then the per-object families in the order of the tables
below; then the backend-for-frontend service last.

### Whole services

| Trigger | Service | Data objects | Business APIs (examples) |
|---|---|---|---|
| `authentication` present | `auth`, first in the project | `user`, `userSession`, `chatIdentity` always; `userGroup` and `userGroupMember` with user groups; the tenant object named by `tenantName` in a multi-tenant project; `givenPermission` with permission-based access control; `apiKey` with API-key authentication; `sys_verificationToken` with any verification, two-factor or reset flow; a social-account link object with social login; `sys_providerCredential` when an AI provider is scoped to tenants or users | about sixty: `login`, `logout`, `relogin`, `registerUser`, user CRUD with `restoreUser` and `searchUsers`, `currentUser`, group CRUD, API-key APIs, session APIs, tenant APIs (`register<Tenant>Owner`, `get<Tenant>Home`), verification APIs (`verifyEmail`, `requestPasswordReset`, `resetPassword`, ...). Also the buckets `userAvatars` and `<tenant>Avatars`, the seeded super admin and one OAuth flow per social provider. Authored `authentication.dataObjects` and `businessLogic` are merged in. |
| event notifications, or an active verification flow, or any send-mail, SMS, push or WhatsApp action, or WhatsApp ingress, or chat handlers | `notification` | `deviceToken`, `notification`, `notificationDeliveryLog`, `notificationLog`, `geoFence`, `userLocation`, `geoFenceEvent`, `locationConsent` | about twenty-five: `registerDevice`, `listMyNotifications`, `markNotificationSeen`, geofence and consent APIs. Derived event notifications on the verification topics; the cron job `notificationLogRetention` when retention is set. |
| `agentHub.aiAgents`, dynamic agents, or an enabled agent harness | `agentHub` | `sys_agentOverride`, `sys_agentExecution`, `sys_toolCatalog`, `sys_agentRunEvent`, `sys_agentMessage`; with the features: `sys_dynamicAgent`, `sys_agentConversation`, `sys_harnessSession`, `sys_harnessEvent` | the hub APIs ([9.7](09-07-agent-hub.md)) |
| an enabled agent harness | `agentHarnessRunner` | none | none (routes only, 12.2) |
| `bffService.dataViews` not empty | `bff`, last | `bffHttpLog` | `repairIndex`, `getViewSchema`, `listHttpLogs` |

### Elements added to declared services

`X` is the declared data object, `Obj` its name with an initial capital.

| Trigger | Data objects and columns | Business APIs |
|---|---|---|
| `objectSettings.checkout.objectIsAnOrderObject` | `sys_<X>Payment`, `sys_<X>Refund`, `sys_<X>Dispute` | get, list, create, update, delete `<X>Payment`; `get<X>PaymentByOrderId`, `get<X>PaymentByPaymentId` |
| `objectSettings.subscription.objectIsSubscriptionObject` | `sys_<X>Subscription`, `sys_<X>SubscriptionPlan`, `sys_<X>Invoice` | subscription APIs ([9.4](09-04-payment.md)) |
| `objectSettings.marketplace.objectIsMarketplaceObject` | `sys_<X>ConnectedAccount`, `sys_<X>Payout`; with platform settlement `sys_<X>EarningsEntry`, `sys_<X>SettlementInstruction` | marketplace APIs |
| any payment setting, per service | `sys_paymentEvent`, `sys_paymentWebhookSecret` | `/admin/paymentevents` reads |
| any payment setting or payment provider | `sys_paymentCustomer`, `sys_paymentMethod`, in the authentication service (in the service itself when there is none) | `getPaymentCustomerByUserId`, `createPaymentCustomer`, `attachPaymentMethod`, `listPaymentCustomerMethods`, ... |
| `objectSettings.invoicing.objectIsAnInvoiceObject` | `sys_<X>Invoice`, `sys_<X>InvoiceLine`, `sys_<X>CreditNote`, `sys_<X>InvoicePayment`, `sys_invoiceSequence`, `sys_invoiceEvent` | CRUD `<X>Invoice`; list lines, credit notes and invoice payments; invoice-sequence admin reads |
| `objectSettings.fiscalization.objectIsFiscalized` | `sys_<X>FiscalDocument`, `sys_fiscalEvent`, `sys_fiscalSerialSequence`, `sys_fiscalArtifact` | get and list fiscal documents; fiscal-event admin reads |
| `objectSettings.ledgerSettings.objectOwnsALedger` | `sys_<X><Ledger>Entry`, `...Movement`, `...Reservation`; balance columns on `X` | `earn`, `consume`, `reserve`, `commitReservation`, `releaseReservation`, `getBalance`, `listEntries`, `adjust` (named with the ledger stem) |
| each `Service.dbBuckets[]` entry | `<bucket>File` | bucket routes (12.2) |
| `Service.computeJobs[]` | `sys_computeJob`, `sys_computeArtifact`, `sys_computeEvent` | `submitComputeJob`, `cancelComputeJob`, get and list for each object |
| `objectSettings.objectModeration.enabled` and a create or update API | `sys_<X>ModerationReview`; in on-place mode the columns `moderationStatus` and `moderationAuthorId` on `X` | `list<X>ModerationQueue`, `get<X>ModerationReview`, `accept<X>Moderation`, `reject<X>Moderation`, `listMy<X>ModerationSubmissions` |
| `objectSettings.visitTracking` | the counter column on `X`; visit history in implicit storage (12.3) | `confirm<Api>Visit`, a read-state list API |
| recommendation settings on an object | `sys_<Item>Neighbor`, `sys_<Item>Popularity` | none (routes only, 12.2) |
| `objectSettings.defaultChoice` | the column `isDefault` with a partial unique index; `sys_UserDefaultFor<Obj>` in related mode | `set<Obj>AsDefault`, `getDefault<Obj>`, `set<Obj>AsDefaultForUser`, `getDefault<Obj>ForUser` |
| a property's `decisionSource` | the columns `<p>DecisionConfidence`, `<p>DecidedBy`, `<p>DecidedAt`, `<p>DecisionOverridden` | none |
| `aiAgents[]` on a service | `sys_agentExecution`, `sys_agentRunEvent`, `sys_agentMessage`, `sys_agentConversation` | none; cron jobs for conversation retention and approval expiry |
| `cronJobs[]`, or an API scheduled on a single replica | `sys_cronJobRun`, `sys_cronJobReplica` | none |
| a list API with `runtimeFilters.savedFiltersEnabled` | `listSavedFilter` | `list<Api>SavedFilter`, `create<Api>SavedFilter`, `delete<Api>SavedFilter` at `<route>/filters` |
| `graphLayer.resources[]` | none (graph projection, edges and queries only) | none |
| `Service.realtimeHubs[]` | `<hub>Message`, `<hub>Moderation` | none (hub routes, 12.2) |
| `Service.videoRooms[]` | `<room>RoomSession`, `<room>RoomParticipant`; with the AI pipeline `<room>Transcript`, `<room>MeetingInsight` | history list and get APIs under `/videoroom-history/<room>` |
| `Service.contentModels[]` | `<name>Content`, `<name>Item`, `<name>ContentVersion` | editorial CRUD under `/content-editor/<name>` |
| `Service.shoppingCartConfig` | `cart`, `cartItem` (default names), `<base>Campaign` | none (cart routes, 12.2) |
| a remote or native bucket | `<bucket>RemoteFile` | none |

Some families are not lowered at all in the reference and are emitted directly: the
cart, payment, social-login and verification runtimes, membership checks, realtime
sockets, agent and harness routes, job streams, waiting rooms, feeds and the search
re-sync job. For these, the routes of 12.2 and the storage of 12.3 are the whole
derived surface.

> **Generated table goes here (S9):** the full lowered element list per family, with the
> exact name rule and the condition of every optional element.

## 12.2 Implicit routes

Routes that no business API in the blueprint declares fall into four groups. Business
APIs added by lowering (12.1) are ordinary APIs ([chapter 5](05-business-apis.md)) and are
not repeated here.

- A compiler **MUST** serve every route of this section that its trigger enables, with the
  same method, path, authorization and response contract.
- A compiler **MUST** list every implicit route with a public contract in the service's
  API description, next to the declared business APIs, and **SHOULD** list the
  operational routes in a separate section of it.
- Every business route also answers under the version prefix `/v1`. A compiler **MUST**
  accept both forms.

### Every service

| Route | Access | Purpose |
|---|---|---|
| `GET /` | anonymous | Service identity page. Not served when the blueprint declares `GET /`. |
| `GET /health`, `GET /health/ready` | anonymous | Liveness and readiness ([chapter 10](10-configuration-and-secrets.md)). |
| `GET /admin/health` | admin grant or schema-read credential | Detailed health. |
| `GET /admin`, `GET /admin/bootsummary` | page anonymous, data admin grant | Operations console and boot summary. |
| `GET /admin/logs`, `/admin/logs/search`, `/admin/logs/detail` | admin | Service log search. |
| `GET` and `POST /admin/elastic/resync`, `POST /admin/elastic/resync/:object` | admin | Rebuild the search projection. |
| `GET /admin/test-transport` and its sub-routes | super admin, refused in production | Test transport: publish an event, run a cron job now, call an internal API, mint a machine token. |
| `GET /v1/{mail,ai,buckets,decisions}/mock-status` | anonymous | Whether a provider falls back to its mock ([chapter 10](10-configuration-and-secrets.md)). |
| `GET /openapi.json`, `GET /swagger` | anonymous | The API description. |
| `GET /tools` | anonymous | The service's tool registry (every service except the agent hub). |
| `GET /mscript-sample` | anonymous | A sample of the service's compiled expressions. |

**To verify:** whether `/tools` and `/mscript-sample` are interface or reference-only
diagnostics. Until decided, a compiler **MAY** omit them.

### Triggered by a property or an object setting

| Trigger | Routes |
|---|---|
| a stored property of a geo type (point, route, area) | `GET /geo/<object>/<property>/inCircle`, `/mostClose`, `/inBBox`, `/inPolygon` |
| `objectSettings.enterpriseProjection` | `GET /<object>/external/:id`, `POST /<object>/external/search`, `PATCH /<object>/external/:id` |
| checkout, subscription or marketplace settings | the payment routes of [9.4](09-04-payment.md): start, refresh and complete a payment, payment by order id, refund, subscribe and manage a subscription, payment methods and customers, the provider webhook `POST /v1/payments/webhook/:providerName`, marketplace, settlement, dispute and admin routes |
| invoicing or fiscalization settings | invoice, invoice admin, fiscal admin and provider webhook routes |
| recommendation lists on an object | `GET /<items>/recommendations/<list>`, `GET /<items>/:<item>Id/recommendations/<list>` |

No route is generated for enum or dictionary lookups, unique-code lookups, statistics,
bulk import, ratings, likes or comments: those exist only when the blueprint declares an
API for them. Visit tracking adds business APIs (12.1), not routes.

### Triggered by service or project settings

| Trigger | Routes |
|---|---|
| a service where users can log in | `GET /publickey`; `POST /rawsearch/:index` |
| the authentication service | `POST /admin/superadmin/reset`, `POST /admin/superadmin/reset/confirm`; the verification flows under `/api/auth/verify/<flow>/start` and `/complete` for email and mobile verification, two-factor and password reset |
| an OAuth flow (one per social provider) | `/auth/social-login-redirect`, `POST /auth/social-login-result`, `/auth/<provider>` and its callback |
| provider credentials scoped to users, tenants or resources | `/my-provider-credentials`, `/tenant-provider-credentials`, `/resource-provider-credentials`, `/my-mailboxes`, `/tenant-mailboxes`, `/mailbox-connect/callback` and the machine routes |
| a shopping cart | `/<cart>`, `/items`, `/items/:barcode`, `/recalculate`, `/redeemPoints`, `/checkout`, `/coupons`, and the operator route `/campaigns` ([9.8](09-08-cart.md)) |
| a bucket | `/bucket/<name>/upload-url`, `/download/:key`, `/object/:key`, `/share-url/:key`, `/shared/:key`, `/variants/backfill`, and the native-bucket equivalents ([9.6](09-06-storage-buckets.md)) |
| a content model | `/content/_sitemap`, `<base>`, `<base>/:slug`, `<base>/search`, and `/:id/transition`, `/preview-token`, `/translate`, `/assist` |
| a video room | `<base>/token`, `/state/:roomId`, `/control`, `/search`, captions |
| an event stream | `GET /bigload/streams`, `POST /ingest/<stream>`, the declared read surfaces, and `POST /<stream>/retention/run`, `/archive/run`, `/clean/run` |
| a job stream | `/jobstreams`, `/jobstreams/<name>`, `/:jobId`, `/:jobId/events` |
| a waiting room | `/waitingrooms`, `/<room>/join`, `/<room>/:ticketId/position` |
| compute jobs | `GET /computejobs/:id/events` (server-sent events) |
| a realtime hub or event subscription | `<hub base>/:roomId/eligible`, `/messages`; the event stream `/stream`; the socket path `/socket.io/` ([9.5](09-05-realtime.md)) |
| edge controllers | the declared controllers, mounted under `/edge` |
| cron jobs | `GET /cron-jobs`, `GET /cron-jobs/:name/runs`, `POST /cron-jobs/:name/run` |
| stored views | `POST /admin/views/repair-all` |
| elastic logs | `GET /admin/elastic-logs`, `GET /admin/elastic-logs/:name` |
| service files | `GET /service-files/*` |
| integrations | `/integrations/testconnect/:provider`, `/integrations/testall/:provider` |
| WhatsApp or Telegram channels | the provider status and ingress webhooks |
| AI agents on a service | `<agent base>`, `/stream`, `/runs/:runId`, `/conversations`, `/agent-runs`, `/agent-usage`, channel webhooks |
| the agent hub | `/agents`, `/agents/:name`, `/stream`, `/eval`, `/invalidate`, `/runs/:runId`, `/agent-runs`, `/tools`, `/tools/refresh`; harness sessions `/harnesses/:name/sessions`, `/harness-sessions` |
| an agent harness runner | `<prefix>/sessions/:sessionId/mcp` (the only generated MCP endpoint) and the machine session routes |

There is no generated gRPC health or reflection service, no metrics route and no
`/.well-known` key route.

> **To verify:** the reference does not yet list these routes in its API description:
> `/tools`, `/mscript-sample`, `/publickey`, `/rawsearch/:index`, the recommendation
> lists, `/computejobs/:id/events`, the provider-credential and mailbox routes, `/edge`,
> `/admin/elastic/resync`, `/admin/views/repair-all`, `/admin/superadmin/reset`, `/admin`,
> `/admin/bootsummary`, `/admin/health`, `/health`, `/health/ready` and `GET /`. The rule
> above is the target; the reference has to catch up.

> **Generated table goes here (S9):** every implicit route with method, path, trigger,
> access and whether it has a public contract.

## 12.3 Implicit storage

Besides the stores of its data objects, a generated service keeps bookkeeping storage of
its own. The reference follows one convention for it: a **raw system table**, named with
the `sys_` prefix, created when first needed (`CREATE TABLE IF NOT EXISTS`), with no data
object behind it, no data-access operations, no change events, no search projection and
no route that lists it.

- A compiler **MUST** provide the behaviour each store supports (the column "Behaviour").
  How it stores it is free.
- A compiler **MUST NOT** expose a raw system table through a data-access operation, an
  event or a search projection; the routes listed in the table are the only access.
- Storage marked **shared** is read by more than one component of the project. A
  compiler that splits a project between itself and another compiler **MUST** keep its
  layout, or the components cannot interoperate.

### Tables and collections

| Store | Trigger | Behaviour | Access |
|---|---|---|---|
| `_schema_versions` | always | Records the applied schema version of each service; read at every boot. | none |
| `sys_action_outbox` | a post-write action fails (publish, mail, edge call) | Retries the failed action with the attempt key; a resend of the same request within one hour reuses it ([chapter 5](05-business-apis.md)). | the `actionFailures` part of the response |
| `sys_lifecycle_outbox` | payment or invoice objects with lifecycle event families | Delivers lifecycle events at least once, swept from boot. | none |
| `sys_elastic_repair` | a service with search-projected objects | Remembers projection writes that failed, for repair. | `/admin/elastic/resync` |
| `sys_feed_outbox` | external feeds | Ordered, de-duplicated delivery of feed items. | none |
| `sys_job_stream_<name>_job`, `..._event` | a job stream with database state (the default) | Job state and its event history. | the job-stream routes |
| `sys_<Obj>Visit`, `sys_<Obj>VisitState`, `sys_<Obj>VisitCounter` | visit tracking (state and counter when configured) | Visit history, per-actor read state and counters. | the visit APIs (12.1) |
| `sys_fiscalWorkEpoch` | fiscalization on a document database | A global epoch for fiscal claims. | none |
| `<table>_<column>_backup` | a deploy that removes a column, with the default strategy | A copy of the column before it is dropped. | none |

Inside existing databases the reference also creates the database when it is missing,
the geo extension for services with geo properties, and lazy indexes for
recommendations.

> **To verify:** whether the feed and job-stream stores are refused on a document
> database at compile time, or fail at run time. A compiler **SHOULD** refuse at compile
> time ([chapter 1](01-conformance-model.md)).

### Search indices

| Index | Trigger | Behaviour | Shared |
|---|---|---|---|
| the projection index of each data object (`<codename>_<object>`) | every data object | The search projection ([4.9](04-data-layer.md#49-search-projection)). | yes |
| `<codename>_<viewName>` | stored views of the backend for frontend | The stored view ([9.2](09-02-bff.md)). | yes |
| `<codename>_<name>` (write alias over rolling indices) | `elasticLogsSettings.elasticLogs[]` | The declared elastic log, with a retention policy. | yes |
| `<codename>_idempotency` | `apiOptions.useIdempotencyKey` | Idempotent replay for 24 hours. | yes |
| `<codename>_notificationlog` retention | the notification service | Retention of the notification log projection. | no |
| `<service>-logs-<day>`, `<codename>-<service>-detail-logs-<day>.<hour>` | always, when a search engine is configured | Service logs and detail logs with retention. | no |
| backing indices `<name>-<fingerprint>` | a mapping change the engine refuses in place | The live name becomes an alias over the new backing index. | no |

A graph projection also creates constraints and indexes per projected label at boot.

### Cache keys

The reference keeps sessions, refresh tokens, API-key revocations, OAuth state,
verification steps, API approvals, waiting-room tickets, carts, de-duplication claims for
chat handlers, agents and notifications, and rebuildable caches in the key-value store.

- The **session keys are shared**: every service reads the session that the
  authentication service writes ([9.1](09-01-authentication-and-sessions.md)).
- All other key families are private to the component that writes them; their layout is
  free.

> **Generated table goes here (S9):** every key family with its prefix, owner, lifetime
> and whether it is shared.

### Topics

Every topic that a service produces or consumes is created at boot from the compiled
topic census ([chapter 7](07-event-bus.md)). The runtime also derives these topics:

| Topic | Trigger |
|---|---|
| `elastic-index-<codename>_<object>-created`, `-updated`, `-deleted`, `-repaired` | every search-projected object |
| `<topic>.dlq` | a consumer that dead-letters |
| `<topic>.retry`, `<topic>.dlq` | an agent triggered by events |
| `<requestTopic>-deadletter` | an event-driven controller |
| `<codename>-<service>-<name>-jobs` | a job stream |

### Object-storage prefixes

`<prefix>/_quarantine/` for infected uploads, `<stem>__<variant>.<format>` for image
variants, `videorooms/<room>/` for recordings, `<stream>/dt=<day>/<hour>/` for event-stream
archives, and `payment-events/` for the payment event archive.

## 12.4 Library surface

Authored code calls generated code by name: library functions
([`ServiceLibrary`](../spec/ServiceLibrary.md)) call data-access operations and helpers,
and expressions call `LIB.<name>`. A compiler that renames or drops one of these breaks
code that was valid with the reference, so the library surface is interface (C2).

### What `LIB` holds

`LIB` is one flat namespace per service:

| Member | Present when | Called as |
|---|---|---|
| each authored library function | always | `LIB.<name>(...)`, or `LIB.<name>.<member>(...)` for a module that exports several functions |
| each native kernel and each exported function of a wasm module | declared in the library | `LIB.<name>(...)` |
| `LIB.common` | always | `LIB.common.<helper>(...)` |
| `LIB.dataViews` | the service's code names a view | `LIB.dataViews.<view>(filter, options)`, returns rows |
| `LIB.serviceFiles` | the service declares service files | `LIB.serviceFiles.text`, `.json`, `.bytes`, `.info`, `.has`, all synchronous |

- An authored function with the name of a framework member replaces it.
- A function that fails to load does not stop the service; calling it raises the load
  error.
- Edge functions, templates and assets are not in `LIB`.
- `API` is the second name every expression can read: the service's own APIs that allow
  internal calls ([chapter 8](08-mscript.md)).
- An unknown `LIB` member in an expression is a validation error.

### `LIB.common`

`LIB.common` holds the helpers that generated code and authored code share.

| Tier | Helpers |
|---|---|
| **Required** | `slugify`, `md5`, `intHash` (the generated avatar expressions use them) |
| **Recommended** | `newUUID`, `isValidUUID`, `newObjectId`, `isValidObjectId`, `hashString`, `createHexCode`, `toCodenameSlug`, `isUrlSafeCodename` |
| **Reference only** | runtime handles of the reference language (logger, cache, Redis, publisher and indexer classes, query converters, inter-service and remote-read clients, integration calls) |

- A compiler **MUST** provide the required tier, and **SHOULD** provide the recommended
  tier, with the same results for the same inputs.
- Code that uses a reference-only helper is not portable. A compiler **MAY** refuse it at
  compile time, and **MUST** then name the helper.

> **To verify:** the tiers are a proposal. Today `slugify` is the only helper known to be
> available in every compiler; `md5` and `intHash` are not yet available in all of them.

### Data-access operations

Every stored data object has the operation set of
[4.10](04-data-layer.md#410-data-access-operations). The reference provides these as well,
and authored library code uses them:

| Operation (reference name for `Order`) | Effect |
|---|---|
| `getOrderAggById` | read by id with the object's joins resolved |
| `getOrderBy<Property>` | read by one indexed property (one function per indexed property) |
| `listOrderByMQuery`, `getOrderListByQuery` | aliases of `getOrderListByMQuery` |
| `assertOrderDeletable`, `assertOrderDeletableByQuery`, `collectOrderCascadeDeleteSet` | check delete restrictions, or compute the cascade set, without deleting |
| `getIdListOfOrderByField`, `getIdPageOfOrder`, `countOfOrderByFieldIn` | id lists, an id-keyset page and per-value counts |
| `getOrderListInCircle_<p>`, `getOrderListMostClose_<p>`, `getOrderListInBBox_<p>`, `getOrderListInPolygon_<p>` | geo reads, one set per geo property `p` |
| `updateWhere(objectName, predicate, { inc, set, when })` | a service-wide conditional update |

There is no upsert, distinct, exists or restore operation: a restore is an update by id
that includes archived records. Families add their own operations (payment lookups by
order and by payment id, invoice and fiscal numbering, ledger `earn`, `consume`,
`reserve` and balance reads); they are listed with the family in chapter 9.

- The data-access operations are reached from library code, not through `LIB`.
  Expressions reach them only in the slots that accept code ([chapter 8](08-mscript.md)).
- A compiler **MUST** document the spelling and signature of each operation in its
  language.

> **To verify:** the target-language spellings are not aligned today (one compiler uses
> generic method names on a per-object service, another provides only the read
> operations on its facade). Chapter 1 requires either the reference names or a documented
> adapter.

### What library code can import

In the reference, library code imports generated code through fixed module names:
`common`, `models`, `dbLayer`, `apiLayer`, `controllers`, `internalApis`, `serviceLib`,
`agentLayer`, `elasticLogs`, and one name per generated layer (`graphLayer`, `bffLayer`,
`notificationLayer`, `bigLoadLayer`, `videoLayer`, `contentLayer`, `bucketLayer`,
`paymentLayer`, `invoiceLayer`, `enterpriseLayer`, `socketLayer`, `pdfLayer`, `hubLayer`,
`moderationLayer`, `defaultChoiceLayer`, `projectSiblings`), plus the language's standard
library and declared packages. These module names are specific to one language. Only
`LIB`, `API` and the data-access operations are portable across compilers.
