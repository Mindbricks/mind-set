# BusinessApiActionStore

**Level:** `chapter` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [BusinessApiActionStore in Part 1](../ontology/BusinessApiActionStore.md)

Represents the centralized registry of all executable logic units (actions) that can be used inside a Business API's workflow. Each action is categorized by purpose and referenced by name within the workflow stages. This store enables declarative composition of API behavior, including data manipulation, inter-service communication, access control, AI operations, and more. Every array here is optional — include only the action-type arrays you use; omitted arrays normalize to [] server-side.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fetchObjectActions` | [`FetchObjectAction`](./FetchObjectAction.md)[] | no |  |  |  | Actions that fetch a related or foreign object instance from another data object, based on a matching key or query. |
| `fetchStatsActions` | [`FetchStatsAction`](./FetchStatsAction.md)[] | no |  |  |  | Actions that perform aggregate computations (count, sum, min, max) across a data object, often for contextual summaries or conditional logic. |
| `fetchParentActions` | [`FetchParentAction`](./FetchParentAction.md)[] | no |  |  |  | Actions that retrieve parent object data of the current context, typically for display enrichment or validation. |
| `searchObjectActions` | [`SearchObjectAction`](./SearchObjectAction.md)[] | no |  |  |  | Actions that searches the main object or a related object in elastic search index with a keyword and returns an id array |
| `fetchFromElasticActions` | [`FetchFromElasticAction`](./FetchFromElasticAction.md)[] | no |  |  |  | Actions that make a fetch from elastic using a raw elastic query, the result is returned as a normalized `{ items: [], aggregations: {} }` object. |
| `writeToElasticLogActions` | [`WriteToElasticLogAction`](./WriteToElasticLogAction.md)[] | no |  |  |  | WriteToElasticLogAction actions — append an object to a declared ElasticLog (projectSettings.elasticLogsSettings.elasticLogs[]) by name, written directly to ES. |
| `fetchFromElasticLogActions` | [`FetchFromElasticLogAction`](./FetchFromElasticLogAction.md)[] | no |  |  |  | FetchFromElasticLogAction actions — query a declared ElasticLog by name with a raw Elasticsearch search body, read directly from ES. |
| `graphQueryActions` | [`GraphQueryAction`](./GraphQueryAction.md)[] | no |  |  |  | GraphQueryAction actions — run a parameterized graph traversal (a declared service.graphLayer.queries[] by name, or inline Cypher) against the service's Bolt driver pool, written/read directly (no interservice hop). See docs/ADR-graph-database-layer.md §8a. |
| `collateListsActions` | [`CollateListsAction`](./CollateListsAction.md)[] | no |  |  |  | Actions that collate objects of a source array to a target array's objects using key matching like collating an address list with a user list. |
| `functionCallActions` | [`FunctionCallAction`](./FunctionCallAction.md)[] | no |  |  |  | Actions that invoke a custom or reusable library function written in MScript. Useful for transformation, derived value computation, or conditional logic. |
| `arrowFunctionActions` | [`ArrowFunctionAction`](./ArrowFunctionAction.md)[] | no |  |  |  | Actions that defines an arrow function to be called with its context name in other MScripted areas. |
| `listMapActions` | [`ListMapAction`](./ListMapAction.md)[] | no |  |  |  | Actions that defines a list map, to create a new list out of a current list by mapping its items. Renders a js array map function. |
| `interserviceCallActions` | [`InterserviceCallAction`](./InterserviceCallAction.md)[] | no |  |  |  | Actions that perform a call to another Business API defined in a different microservice. These enable inter-service orchestration. |
| `interProjectCallActions` | [`InterProjectCallAction`](./InterProjectCallAction.md)[] | no |  |  |  | Actions that call a Business API published by a LINKED SIBLING PROJECT (same organization, linked via addSiblingProject). These enable inter-project orchestration across separately deployed OpenAPPL projects. |
| `createCrudActions` | [`CreateCrudAction`](./CreateCrudAction.md)[] | no |  |  |  | Actions that create related records in other data objects during or after the main operation. Often used in cascading aggregations — cascading, NOT transactional: each child write commits on its own and is never rolled back when a later action throws (see the failure-semantics section of BusinessWorkflow). |
| `createBulkCrudActions` | [`CreateBulkCrudAction`](./CreateBulkCrudAction.md)[] | no |  |  |  | Actions that create multiple related child or linked objects in bulk. Useful when creating multiple child records at once, such as bulk creating child tasks, audit logs, or attachments. The objects parameter is an MScript expression that evaluates to an array of objects to be created. |
| `upsertBulkCrudActions` | [`UpsertBulkCrudAction`](./UpsertBulkCrudAction.md)[] | no |  |  |  | Actions that write an array of rows into a data object with insert-or-update semantics: each row is matched to an existing row by the matchBy key and inserted, updated, skipped or rejected according to matchMode, with per-column onExisting policies for enrichment (fillIfEmpty, keep, compute). The bulk import twin of createBulkCrudActions. |
| `deleteCrudActions` | [`DeleteCrudAction`](./DeleteCrudAction.md)[] | no |  |  |  | Actions that delete related child or linked objects. Useful in cleanup workflows or cascade logic. |
| `updateCrudActions` | [`UpdateCrudAction`](./UpdateCrudAction.md)[] | no |  |  |  | Actions that update properties of related objects using a conditional query. Used for post-processing or child updates. |
| `apiCallActions` | [`ApiCallAction`](./ApiCallAction.md)[] | no |  |  |  | Actions that make external or internal HTTP API requests. Often used to integrate with third-party systems or auxiliary internal services. |
| `grpcCallActions` | [`GrpcCallAction`](./GrpcCallAction.md)[] | no |  |  |  | Actions that call a FOREIGN (non-OpenAPPL) gRPC server declared in this service's `serviceSettings.grpcClients[]` (docs/ADR-grpc-interservice-and-grpccall.md, Part B). The gRPC analogue of ApiCallAction: instead of a URL it targets a named grpcClient + rpc method, builds the proto Request from compiled MScript fields, and rides the shared grpcUnaryCall engine. |
| `aiCallActions` | [`AiCallAction`](./AiCallAction.md)[] | no |  |  |  | Actions that call an LLM (e.g., OpenAI or Anthropic) with structured prompts and fetch textual or JSON responses. Used for generation, enrichment, or inference. |
| `decisionActions` | [`DecisionAction`](./DecisionAction.md)[] | no |  |  |  | Actions that ask a calibrated decision provider typed questions about a piece of state and get back typed answers with honest probabilities - classification, routing, scoring and gating without text generation. Cheaper and faster than aiCallActions for a decision, and its answer is always one of the declared values (which is not the same as always right); it cannot explain itself, so it never decides authorization. |
| `agentCallActions` | [`AgentCallAction`](./AgentCallAction.md)[] | no |  |  |  | Actions that invoke a configured AI Agent defined in the service's aiAgents section. The agent is executed internally with a data payload built from the current API context via MScript. The result is stored in the workflow context and optionally written to the response. |
| `membershipCheckActions` | [`MembershipCheckAction`](./MembershipCheckAction.md)[] | no |  |  |  | Actions that validate whether a user is a member of a related object (e.g., organization, team) using configured membership rules. |
| `permissionCheckActions` | [`PermissionCheckAction`](./PermissionCheckAction.md)[] | no |  |  |  | Actions that verify whether the current user has a global (non-object-scoped) permission before continuing workflow logic. |
| `objectPermissionActions` | [`ObjectPermissionCheckAction`](./ObjectPermissionCheckAction.md)[] | no |  |  |  | Actions that check object-scoped permissions, validating whether a user has specific rights on an instance loaded into the context. |
| `readJwtTokenActions` | [`ReadJwtTokenAction`](./ReadJwtTokenAction.md)[] | no |  |  |  | Actions that read a JWT encoded token from a reference and write its back to context as a validatedd and decoded payloa dobject. |
| `validationActions` | [`ValidationAction`](./ValidationAction.md)[] | no |  |  |  | Custom validation logic actions that run MScript boolean checks and optionally block further execution based on result. |
| `addToContextActions` | [`AddToContextAction`](./AddToContextAction.md)[] | no |  |  |  | Actions that write computed or fixed values to the runtime context (`this`) for later use in logic, conditions, or response shaping. |
| `addToResponseActions` | [`AddToResponseAction`](./AddToResponseAction.md)[] | no |  |  |  | Actions that explicitly add computed values or context properties to the final API response payload. |
| `removeFromResponseActions` | [`RemoveFromResponseAction`](./RemoveFromResponseAction.md)[] | no |  |  |  | Actions that remove properties from the API response before it is sent to the client. Used for cleanup or filtering. |
| `renderDataActions` | [`RenderDataAction`](./RenderDataAction.md)[] | no |  |  |  | Actions that apply a template (e.g., EJS/Markdown) to context data to generate rendered output. |
| `dataToFileActions` | [`DataToFileAction`](./DataToFileAction.md)[] | no |  |  |  | Actions that serialize a context object into a downloadable file format (e.g., CSV, JSON, TXT). For PDF rendering, use renderPdfActions instead. |
| `fileToDataActions` | [`FileToDataAction`](./FileToDataAction.md)[] | no |  |  |  | Actions that parse an uploaded or stored tabular file (csv, tsv, xlsx, json, ndjson) into an array of row objects keyed by data-model property names, coercing and validating every cell against the target DataObject's properties. The parsed rows land in the context for a following upsertBulkCrudActions / createBulkCrudActions step; rejected rows are collected with their row index and reasons. |
| `renderPdfActions` | [`RenderPdfAction`](./RenderPdfAction.md)[] | no |  |  |  | Actions that render a PDF from a PdfTemplate (or pre-rendered HTML) and store the resulting buffer in the context for use by later actions — typically attached to a SendMailAction or returned to the client as a download. |
| `redirectActions` | [`RedirectAction`](./RedirectAction.md)[] | no |  |  |  | Actions that redirect the API response to another URL or internal API path. Typically used in post-auth flows or chained APIs. |
| `createJWTTokenActions` | [`CreateJWTTokenAction`](./CreateJWTTokenAction.md)[] | no |  |  |  | Actions that create JWT tokens with a payload and store them in context or response. |
| `signDataWithProjectKeyActions` | [`SignDataWithProjectKeyAction`](./SignDataWithProjectKeyAction.md)[] | no |  |  |  | Actions that sign arbitrary data with the project's Ed25519 key and return a verifiable envelope (`{ sig, kid, jwks_url }`). Use the result anywhere — webhook headers, response bodies, downstream API calls — to let receivers confirm the data originated from this project by fetching the project JWKS. |
| `createObjectActions` | [`CreateObjectAction`](./CreateObjectAction.md)[] | no |  |  |  | Actions that create javascript objects in the context. |
| `publishEventActions` | [`PublishEventAction`](./PublishEventAction.md)[] | no |  |  |  | Actions that emit custom domain events to a message bus or pub/sub system. Used for decoupled workflows, domain events, or business-specific notifications. The action's message is published inside the unified event envelope — consumers find it under the envelope's `data` key (`{ id, type, source, time, requestId, actor, data }`); the declared topic is PROJECT-SCOPED on the wire as `<projectCodename>-<topic>`, so a consumer inside the project subscribes to the same declared name and the framework scopes both ends, while a hand-written consumer passes the declared name to KafkaListener and lets the runtime resolve it. Note: When `raiseApiEvent` under `ApiOptions` is true, a standard API-level event is automatically emitted, so this should only contain additional custom events beyond the default API event. |
| `readFromRedisActions` | [`ReadFromRedisAction`](./ReadFromRedisAction.md)[] | no |  |  |  | Actions that read a Redis key directly and store its value into the context. This enables other actions—limited to context scope—to access Redis-sourced values. |
| `writeToRedisActions` | [`WriteToRedisAction`](./WriteToRedisAction.md)[] | no |  |  |  | Actions that write a value to Redis under a computed key, either for session continuity or caching. |
| `sendMailActions` | [`SendMailAction`](./SendMailAction.md)[] | no |  |  |  | Actions that send an email using a configured provider — or on behalf of a project MailAccount (with reply threading) via the mcpbff mail bridge — with dynamic subject/body/to fields. |
| `checkMailboxActions` | [`CheckMailboxAction`](./CheckMailboxAction.md)[] | no |  |  |  | Actions that pull filtered message summaries (envelope metadata, no bodies) from a project MailAccount's mailbox on demand, via the mcpbff mail bridge. |
| `readMailActions` | [`ReadMailAction`](./ReadMailAction.md)[] | no |  |  |  | Actions that fetch one full message — bodies plus attachment content — from a project MailAccount's mailbox by RFC 5322 messageId, via the mcpbff mail bridge. |
| `sendSmsActions` | [`SendSmsAction`](./SendSmsAction.md)[] | no |  |  |  | Actions that send an SMS message to a target phone number with a given body and sender info. |
| `sendPushNotificationActions` | [`SendPushNotificationAction`](./SendPushNotificationAction.md)[] | no |  |  |  | Actions that send push notifications to mobile or web clients with title and content. |
| `sendWhatsAppActions` | [`SendWhatsAppAction`](./SendWhatsAppAction.md)[] | no |  |  |  | Actions that send a WhatsApp Business message via a configured WhatsApp provider (Meta Cloud API or Twilio's WhatsApp channel). Supports both free-form text inside the 24-hour session window and template sends for re-engagement. |
| `paymentActions` | [`PaymentAction`](./PaymentAction.md)[] | no |  |  |  | Actions to start, to complete or to refresh a payment operation using the native integrated payment systems. Every provider registered in the PaymentProviderRegistry is supported (stripe, paypal, adyen, iyzico, paddle, lemonsqueezy, mangopay, plus the `custom` escape hatch); the action binds to an entry of projectSettings.paymentProvidersSettings.paymentProviders[]. For a gateway with no native adapter use integration actions. |
| `refundActions` | [`RefundAction`](./RefundAction.md)[] | no |  |  |  | Actions that issue a refund (full or partial) against a previously captured payment via the bound PaymentProvider. The action writes a sys_<X>Refund record and advances the parent payment state machine. |
| `invoiceActions` | [`InvoiceAction`](./InvoiceAction.md)[] | no |  |  |  | Actions that drive the accounts-receivable invoice lifecycle (create draft / finalize / void / apply payment) for an invoicing-enabled DataObject through the generated InvoiceManager — the imperative escape hatch for issuePolicy: manual workflows (ADR-invoice-fiscalization §7.5). All operations go through the bound InvoiceProvider adapter, so the framework-internal ledger and an external system of record are one code path. |
| `fiscalizeActions` | [`FiscalizeAction`](./FiscalizeAction.md)[] | no |  |  |  | Actions that drive the regulatory fiscalization lifecycle (submit / cancel / queryStatus) for a fiscalization-enabled DataObject through the generated FiscalizationManager - the imperative escape hatch for submitPolicy: manual workflows (ADR-invoice-fiscalization sec. 7.5). Every operation goes through the bound FiscalProvider adapter and the compiled jurisdiction policy; there is no framework-internal fiscal provider. |
| `payoutActions` | [`PayoutAction`](./PayoutAction.md)[] | no |  |  |  | Actions that trigger a marketplace payout to a connected sub-merchant account via the bound PaymentProvider. Requires the provider to advertise supportsMarketplace=true. The action writes a sys_<X>Payout record whose status is later advanced via webhook events. |
| `subscriptionActions` | [`SubscriptionAction`](./SubscriptionAction.md)[] | no |  |  |  | Actions that create, cancel or refresh a recurring subscription against the bound PaymentProvider. The `stage` field on the action picks the operation (subscribe / cancelSubscription / refresh). Requires the provider to advertise supportsSubscriptions=true. |
| `verifyWebhookActions` | [`VerifyWebhookAction`](./VerifyWebhookAction.md)[] | no |  |  |  | Actions to verify a webhook call of a provider using the signature material held by the bound adapter. Every provider registered in the PaymentProviderRegistry is supported (stripe, paypal, adyen, iyzico, paddle, lemonsqueezy, mangopay, plus the `custom` escape hatch); the verification scheme comes from that provider's PaymentCapabilities.webhookStyle. An adapter that cannot verify at all (no signing secret yet) refuses with a `webhook_verification_unconfigured` 401 rather than reporting a signature failure. |
| `integrationActions` | [`IntegrationAction`](./IntegrationAction.md)[] | no |  |  |  | Actions that call third-party API integrations managed in the platform integration catalog (e.g., AWS S3, Stripe, Google Maps). Each integration exposes predefined actions and is selected by its provider key. |
| `loopActions` | [`LoopAction`](./LoopAction.md)[] | no |  |  |  | Actions that repeat a sequence of workflow steps for each item in a list (defined by an MScript expression). |
| `parallelActions` | [`ParallelAction`](./ParallelAction.md)[] | no |  |  |  | Actions that execute multiple child actions in parallel without waiting for each to finish sequentially. Ideal for non-dependent logic flows. |
| `cartValidationActions` | [`CartValidationAction`](./CartValidationAction.md)[] | no |  |  |  | Actions that validate a shopping cart before checkout. Checks for item existence, stock availability, price validity, and minimum order requirements. |
| `cartCheckoutActions` | [`CartCheckoutAction`](./CartCheckoutAction.md)[] | no |  |  |  | Actions that process shopping cart checkout. Handles inventory reservation, promotion recording, order creation, and cart clearing. |
| `couponValidationActions` | [`CouponValidationAction`](./CouponValidationAction.md)[] | no |  |  |  | Actions that validate coupon codes. Checks eligibility, usage limits, expiration, and calculates discount amounts. |
| `emitSseEventActions` | [`EmitSseEventAction`](./EmitSseEventAction.md)[] | no |  |  |  | Actions that emit custom SSE events to the client during the workflow. No-op when called via REST. |
| `iteratorActions` | [`IteratorAction`](./IteratorAction.md)[] | no |  |  |  | Generic streaming actions whose methods return async iterables. Used for custom streaming logic that isn't covered by AiCallAction. Can be referenced in streamSource.iteratorAction or used inline in the workflow. |
| `videoRoomTokenActions` | [`VideoRoomTokenAction`](./VideoRoomTokenAction.md)[] | no |  |  |  | VideoRoomTokenAction actions — run a declared service videoRooms[] room's authorization flow and mint the provider join credential (SFU join token with media grants, or an HLS playback grant for broadcast viewers). See docs/ADR-video-conference-pattern-family.md §9. |
| `videoRoomControlActions` | [`VideoRoomControlAction`](./VideoRoomControlAction.md)[] | no |  |  |  | VideoRoomControlAction actions — control-plane operations against a declared service videoRooms[] room via its provider's server API (create/end room, remove/mute participant, start/stop recording or broadcast). See docs/ADR-video-conference-pattern-family.md §9. |
| `contentTransitionActions` | [`ContentTransitionAction`](./ContentTransitionAction.md)[] | no |  |  |  | ContentTransitionAction actions — drive the publishing lifecycle of a declared service contentModels[] content record (publish / unpublish / schedule / unschedule / archive / restore) from inside a composed workflow. See docs/ADR-content-platform-pattern-family.md §7. |

## Constraints

Property rules:

- The items of `fetchObjectActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fetchStatsActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fetchParentActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `searchObjectActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fetchFromElasticActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `writeToElasticLogActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fetchFromElasticLogActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `graphQueryActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `collateListsActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `functionCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `arrowFunctionActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `listMapActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `interserviceCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `interProjectCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `createCrudActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `createBulkCrudActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `upsertBulkCrudActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `deleteCrudActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `updateCrudActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `apiCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `grpcCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `aiCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `decisionActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `agentCallActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `membershipCheckActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `permissionCheckActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `objectPermissionActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `readJwtTokenActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `validationActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `addToContextActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `addToResponseActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `removeFromResponseActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `renderDataActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `dataToFileActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fileToDataActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `renderPdfActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `redirectActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `createJWTTokenActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `signDataWithProjectKeyActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `createObjectActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `publishEventActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `readFromRedisActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `writeToRedisActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `sendMailActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `checkMailboxActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `readMailActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `sendSmsActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `sendPushNotificationActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `sendWhatsAppActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `paymentActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `refundActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `invoiceActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `fiscalizeActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `payoutActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `subscriptionActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `verifyWebhookActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `integrationActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `loopActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `parallelActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `cartValidationActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `cartCheckoutActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `couponValidationActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `emitSseEventActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `iteratorActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `videoRoomTokenActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `videoRoomControlActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `contentTransitionActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ACTION_MISSING_NAME` | error | Action in … has no name — remove this entry or set a name |
| `DUPLICATE_ACTION_NAME` | error | Duplicate action name "…" in …[…] — "…" in …[…] already uses it…. |
| `LOOP_STEP_BINDING_SHADOWED` | warning | Action "…" in …[…] sets contextPropertyName "…", which is …. |
| `NESTED_LOOP_ITEM_NAME_SHADOWED` | warning | LoopAction "…" runs inside LoopAction "…" and both bind their item as `this.…`. |
| `RESERVED_ACTION_NAME` | error | Action name "…" collides with the "…" member of the generated API manager's base chain (ApiManager / <Service>ServiceManager / <Model>Manager). |
| `RESERVED_CONTEXT_PROPERTY` | error | Action "…" in …[…] sets contextPropertyName "…", which collides with the "…" member of the generated API manager's base chain (ApiManager / <Service>ServiceManager / <Model>Manager). |
| `WRITE_TO_RESPONSE_NEEDS_CONTEXT_NAME` | error | Action "…" in …[…] sets writeToResponse: true but has no nonblank contextPropertyName. |
