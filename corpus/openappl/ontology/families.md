# Pattern families

Patterns grouped by domain and family. A **domain** is the root, a service, a module or a namespace (such as a data object or a business API); a **family** is a chapter inside it, the group of sections that configure one concern. Membership follows the place of the pattern in the [ontology tree](./tree.md).

## Domain: Project

[Project](./Project.md) and the families it contains.

### Project

- [Project](./Project.md): Project is the root class representing the entire architecture of a software project in OpenAPPL.

### ProjectSettings

- [ProjectSettings](./ProjectSettings.md): Defines the core configuration of your OpenAPPL project, including metadata, environment preferences, and infrastructure settings.
- [AiModelPrice](./AiModelPrice.md): One model price override for the AI agent cost governor: a model key and its USD prices per 1M input, output, prompt-cache read and prompt-cache write tokens.
- [AiProvider](./AiProvider.md): A named AI provider configuration.
- [AiProviderCredentialScopes](./AiProviderCredentialScopes.md): Which credential levels below the application owner (saas) may supply the key for one AI provider entry, and who pays for calls made with those keys.
- [AiProviderResourceCredentialBudget](./AiProviderResourceCredentialBudget.md): The per-row spend limit of the resource level.
- [AiProviderResourceCredentialScope](./AiProviderResourceCredentialScope.md): The resource level of one AI provider entry's scoped credentials: which data object's rows may own a key, how the row is found from a call, and which member roles manage and use the key.
- [AiProvidersSettings](./AiProvidersSettings.md): Container for AI provider configurations — LLM, image, audio, and video backends used by AI agents (`agentHub.aiAgents`), `AiCallAction` business-API actions, and the mcpbff chat surface.
- [AmqpMirroredTopic](./AmqpMirroredTopic.md): One explicit mirrored mapping between an AMQP address and a Kafka topic.
- [AmqpProvider](./AmqpProvider.md): A named external AMQP broker configuration.
- [AmqpProviderConfig](./AmqpProviderConfig.md): External AMQP broker connection credentials and the mirrored-topics mapping.
- [AmqpProvidersSettings](./AmqpProvidersSettings.md): Container for external AMQP broker configurations.
- [BasicProjectSettings](./BasicProjectSettings.md): Defines the basic settings of your OpenAPPL project, including its identity, descriptive metadata, environment variables, and current lifecycle stage.
- [BigLoadProvidersSettings](./BigLoadProvidersSettings.md): Container for big-load datastore provider configurations.
- [BigLoadStoreConfig](./BigLoadStoreConfig.md): Big-load datastore connection credentials and defaults.
- [BigLoadStoreProvider](./BigLoadStoreProvider.md): A named big-load datastore provider configuration.
- [BucketProvider](./BucketProvider.md): A named cloud-storage bucket provider configuration.
- [BucketProviderConfig](./BucketProviderConfig.md): Provider credentials and defaults.
- [BucketProvidersSettings](./BucketProvidersSettings.md): Container for cloud-storage bucket provider configurations.
- [ChatHandler](./ChatHandler.md): One deterministic chat handler: a match, an optional business API call and a reply template.
- [ChatHandlerAction](./ChatHandlerAction.md): The one business API call of a chat handler, over the API's REST route.
- [ChatHandlerMatch](./ChatHandlerMatch.md): What a chat handler claims.
- [ChatHandlerParameter](./ChatHandlerParameter.md): One name and template value pair of a chat handler: an API parameter of `action.parameters`, or a data key a push prompt records (`prompts[].data`).
- [ChatHandlerResponse](./ChatHandlerResponse.md): The reply of a chat handler, plain text cut at 4096 characters: `text`, then one line per row of `list`, or `list.emptyText` when the list is empty.
- [ChatHandlerResponseList](./ChatHandlerResponseList.md): A reply list built from an array in a chat handler's API answer: one line per row, rendered from the `item` template.
- [ChatHandlingSettings](./ChatHandlingSettings.md): Deterministic chat handlers and push prompts of one channel provider (`notificationProviders[].chatHandling`), matched in declared order before any AI agent bound to the provider.
- [ChatPrompt](./ChatPrompt.md): A push prompt of a channel provider: an EventNotification delivered by this provider whose rendered text becomes a message with choices.
- [ChatPromptChoice](./ChatPromptChoice.md): One choice of a push prompt: the id a `promptReply` handler matches and the title shown on the button or list row.
- [ChatProvider](./ChatProvider.md): RETIRED (patterns 1.60.0) - a legacy chat bot, kept loadable for the on-load conversion only.
- [ChatProvidersSettings](./ChatProvidersSettings.md): RETIRED (patterns 1.60.0) - kept loadable so an older blueprint converts on load.
- [ChatSurfaceSettings](./ChatSurfaceSettings.md): Binds a chat consumer (an aiAgent, or the mcpbff assistant through `mcpbffSettings.chatSurfaces[]`) to one messaging surface by naming a CHANNEL PROVIDER.
- [ClamAvSettings](./ClamAvSettings.md): Settings for the ClamAV scanner that checks files uploaded through DbBucket / NativeBucket / RemoteBucket when bucket.virusScan is true.
- [ClamAvSettingsConfig](./ClamAvSettingsConfig.md): ClamAV connection configuration: protocol picks REST (url) or clamd INSTREAM (host:port), and scanTimeoutMs bounds every scan.
- [ComputeResourceProfile](./ComputeResourceProfile.md): The resource envelope of a ComputeJob (docs/ADR-calculation-layer.md §9).
- [ComputeSettings](./ComputeSettings.md): Project-level compute-layer configuration (docs/ADR-calculation-layer.md §10).
- [CorsSettings](./CorsSettings.md): Defines CORS settings for service accesses.
- [CorsSettingsConfig](./CorsSettingsConfig.md): Defines the configuration for CORS settings.
- [DataMapSimpleItem](./DataMapSimpleItem.md): Represents a single key-value pair used in most context.
- [DecisionCapabilities](./DecisionCapabilities.md): Per-entry capability flags for a DecisionProvider — which question types the adapter behind this entry supports and the ceilings it enforces (mirrors PaymentCapabilities).
- [DecisionProvider](./DecisionProvider.md): A named calibrated decision provider configuration.
- [DecisionProviderConfig](./DecisionProviderConfig.md): Provider credentials and settings for a DecisionProvider entry.
- [DecisionProvidersSettings](./DecisionProvidersSettings.md): Container for calibrated decision provider configurations — System One models that answer typed questions about a piece of state with a calibrated probability (docs/ADR-decision-layer-system-one.md).
- [ElasticLog](./ElasticLog.md): A single ES-only append log declaration.
- [ElasticLogField](./ElasticLogField.md): One mapping field of an ElasticLog — becomes an Elasticsearch mapping property of the given type.
- [ElasticLogsSettings](./ElasticLogsSettings.md): Registry container for the project's ElasticLog declarations (docs/ADR-elastic-log-pattern.md).
- [EnterpriseIntegration](./EnterpriseIntegration.md): A named enterprise-platform integration.
- [EnterpriseIntegrationsSettings](./EnterpriseIntegrationsSettings.md): Container for enterprise-platform integrations.
- [FiscalCapabilities](./FiscalCapabilities.md): Per-entry capability flags for a FiscalProvider.
- [FiscalProvider](./FiscalProvider.md): A named fiscal provider configuration.
- [FiscalProvidersSettings](./FiscalProvidersSettings.md): Container for fiscal provider configurations - the integrators that submit documents into a government's fiscal infrastructure (e-invoice, e-archive, real-time reporting).
- [FrontendUrl](./FrontendUrl.md): Per-environment base URLs for the frontend application.
- [GraphProvider](./GraphProvider.md): A named graph-database provider configuration.
- [GraphProviderConfig](./GraphProviderConfig.md): Graph-database connection credentials and defaults.
- [GraphProvidersSettings](./GraphProvidersSettings.md): Container for graph-database provider configurations (docs/ADR-graph-database-layer.md §1).
- [InvoiceCapabilities](./InvoiceCapabilities.md): Per-entry capability flags for an InvoiceProvider.
- [InvoiceProvider](./InvoiceProvider.md): A named invoice provider configuration.
- [InvoiceProvidersSettings](./InvoiceProvidersSettings.md): Container for invoice provider configurations — the backends that issue, number, finalize and collect legal/commercial invoices for the project's invoicing-enabled data objects.
- [KycOnboardingConfig](./KycOnboardingConfig.md): Per-provider marketplace KYC onboarding configuration.
- [MailAccount](./MailAccount.md): A named mail account — a real mailbox the project can listen to, check, read, and send from (docs/ADR-mail-account-family.md).
- [MailAccountsSettings](./MailAccountsSettings.md): Container for project-level mail-account configurations (docs/ADR-mail-account-family.md).
- [McpbffSettings](./McpbffSettings.md): Settings of the mcpbff system service (the project's native full-API assistant host).
- [NotificationProvider](./NotificationProvider.md): A named notification provider configuration.
- [NotificationProvidersSettings](./NotificationProvidersSettings.md): Container for notification provider configurations (email, SMS, push, Telegram, WhatsApp).
- [PaymentCapabilities](./PaymentCapabilities.md): Per-entry capability flags for a PaymentProvider.
- [PaymentProvider](./PaymentProvider.md): A named payment provider configuration.
- [PaymentProvidersSettings](./PaymentProvidersSettings.md): Container for payment provider configurations — PSPs and merchant-of-record providers.
- [PayoutCadenceConfig](./PayoutCadenceConfig.md): Per-provider payout scheduling + reserve configuration.
- [PipelineTemplate](./PipelineTemplate.md): The asset to store a template for generating custom pipeline files.
- [ServicePlanEntry](./ServicePlanEntry.md): One service the project INTENDS to create, as named by the microservice-definition plan.
- [SocialLoginProvider](./SocialLoginProvider.md): One social login provider: the brand, its OAuth client credentials and when the email it returns counts as verified.
- [SocialLoginProviderConfig](./SocialLoginProviderConfig.md): OAuth client credentials of a SocialLoginProvider entry.
- [SocialLoginProvidersSettings](./SocialLoginProvidersSettings.md): Container for social login provider entries, one per brand (google, apple, facebook, microsoft, linkedin, github, gitlab).
- [VideoProvider](./VideoProvider.md): A named video-conference / live-broadcast provider configuration.
- [VideoProvidersSettings](./VideoProvidersSettings.md): Container for video-conference / live-broadcast provider configurations (docs/ADR-video-conference-pattern-family.md §3).

## Domain: Service

[Service](./Service.md) and the families it contains.

### Service

- [Service](./Service.md): Defines the overall structure and configuration for a microservice within the project.

### AIAgent

- [AIAgent](./AIAgent.md): Defines a standalone AI agent at the service level.
- [AgentAudioSettings](./AgentAudioSettings.md): Audio generation or transcription parameters.
- [AgentBasics](./AgentBasics.md): Core identity, execution mode and service placement of the AI agent.
- [AgentChatSettings](./AgentChatSettings.md): Conversation history management for chat-mode agents.
- [AgentContextSource](./AgentContextSource.md): Defines a dynamic data source that fetches context at runtime.
- [AgentCustomEndpoint](./AgentCustomEndpoint.md): Custom provider endpoint configuration.
- [AgentCustomTool](./AgentCustomTool.md): Defines a custom tool that the agent can invoke during its execution loop.
- [AgentDecisionGate](./AgentDecisionGate.md): A calibrated decision gate over an agent's tool calls.
- [AgentEndpointSettings](./AgentEndpointSettings.md): Controls how the agent is exposed as an API endpoint.
- [AgentEvalCase](./AgentEvalCase.md): One evaluation case: an input to run the agent with and what to assert about the answer.
- [AgentEvalSettings](./AgentEvalSettings.md): Declarable evaluation suite for the agent.
- [AgentGuardrails](./AgentGuardrails.md): Safety limits and cost controls for the agent.
- [AgentImageSettings](./AgentImageSettings.md): Image generation parameters.
- [AgentInputSettings](./AgentInputSettings.md): Defines how incoming request data is transformed into the agent's prompt or input.
- [AgentIntegrationToolConfig](./AgentIntegrationToolConfig.md): Configures an integration provider as a tool source for the agent.
- [AgentKafkaController](./AgentKafkaController.md): Defines a Kafka-triggered controller for the AI agent.
- [AgentModelSettings](./AgentModelSettings.md): AI provider and model configuration for the agent.
- [AgentOrchestrationSettings](./AgentOrchestrationSettings.md): Multi-agent orchestration configuration for orchestrator-mode agents.
- [AgentOrchestrationStep](./AgentOrchestrationStep.md): Defines a single step in an orchestrator agent's workflow.
- [AgentOutputSettings](./AgentOutputSettings.md): Controls how the AI model's response is transformed before returning to the client.
- [AgentToolSettings](./AgentToolSettings.md): Configures which tools the agent can invoke during its execution loop.
- [AgentVideoSettings](./AgentVideoSettings.md): Video generation parameters.

### ComputeJob

- [ComputeJob](./ComputeJob.md): A compute *workload* — the primary, headline tier of the compute layer (docs/ADR-calculation-layer.md §2/§3).
- [AiInferenceModel](./AiInferenceModel.md): Locates the model an AiInferenceSpec loads.
- [AiInferenceSpec](./AiInferenceSpec.md): Type-specific spec for `ai-inference` ComputeJobs (docs/ADR-calculation-layer.md, Type-specific specs).
- [BatchAggregation](./BatchAggregation.md): Aggregation spec for a BatchTransformSpec — the group-by keys and the aggregate functions applied over each group before the result is written.
- [BatchTransformSpec](./BatchTransformSpec.md): Type-specific spec for `batch-transform` ComputeJobs (ETL, imports/exports, data cleaning, report precompute, analytics rebuilds, aggregation over millions of rows).
- [ComputeJobBasics](./ComputeJobBasics.md): Defines a compute job's identity, workload type, execution mode and implementation mode.
- [ComputeJobGraphIO](./ComputeJobGraphIO.md): Graph I/O ends for a ComputeJob (docs/ADR-graph-database-layer.md §12).
- [ComputeJobInput](./ComputeJobInput.md): Declares a ComputeJob's input source.
- [ComputeJobResult](./ComputeJobResult.md): Declares a ComputeJob's result shape (§2).
- [ComputeJobSpec](./ComputeJobSpec.md): The discriminated type-specific payload of a ComputeJob, keyed by `ComputeJob.type` (§3).
- [ComputeRetryPolicy](./ComputeRetryPolicy.md): Retry policy for a ComputeJob in `job` mode (docs/ADR-calculation-layer.md §9).
- [CryptoBatchSpec](./CryptoBatchSpec.md): Schema-only v1 specification for crypto-batch ComputeJobs, including proposed bulk hashing, verification and archive presets.
- [CustomSpec](./CustomSpec.md): Type-specific spec for `custom` ComputeJobs — the bring-your-own-code escape hatch (docs/ADR-calculation-layer.md §12).
- [GraphIORead](./GraphIORead.md): The graph INPUT of a ComputeJob.graphIO (docs/ADR-graph-database-layer.md §12) — names a declared GraphQuery whose result feeds the recipe.
- [GraphIOWrite](./GraphIOWrite.md): The computed-edge OUTPUT of a ComputeJob.graphIO (docs/ADR-graph-database-layer.md §12) — the projected relationship the job writes back into the graph after computing scores/clusters/embeddings.
- [IndexingChunking](./IndexingChunking.md): Chunking configuration for an IndexingSpec — how source documents are split into index units.
- [IndexingSpec](./IndexingSpec.md): Type-specific spec for `indexing` ComputeJobs — the AI-native-app workhorse: chunk → embed → write index.
- [MediaProcessingSpec](./MediaProcessingSpec.md): Type-specific spec for `media-processing` ComputeJobs — image resize/thumbnails, PDF→image, OCR preprocessing, audio waveform, transcoding orchestration.
- [OptimizationObjective](./OptimizationObjective.md): The objective of an OptimizationSpec — whether to minimize or maximize, and the expression being optimized.
- [OptimizationSpec](./OptimizationSpec.md): Type-specific spec for `optimization` ComputeJobs — routing, scheduling, allocation, pricing, constraint solving.
- [RiskCalculationSpec](./RiskCalculationSpec.md): Type-specific spec for `risk-calculation` ComputeJobs — portfolio risk, pricing models, credit scoring, forecasting, actuarial.
- [SimulationSpec](./SimulationSpec.md): Type-specific spec for `simulation` ComputeJobs — Monte Carlo, agent/state-step, time-series simulation.

### ContentModel

- [ContentModel](./ContentModel.md): A declarative content model generates storage objects, editorial APIs, publishing transitions, and headless delivery.
- [ContentApprovalSettings](./ContentApprovalSettings.md): Editorial approval workflow of a content model (publishingSettings.approvalSettings).
- [ContentBodySettings](./ContentBodySettings.md): The rich-content body of a content model (or of its child items via childSettings.bodyFormat).
- [ContentChildSettings](./ContentChildSettings.md): The owned-children capability of a content model.
- [ContentEventSettings](./ContentEventSettings.md): Content lifecycle events are published to the project Kafka bus for transitions and version capture.
- [ContentField](./ContentField.md): One structured property of a content model (or of its child items).
- [ContentLocalizationSettings](./ContentLocalizationSettings.md): The localization capability of a content model.
- [ContentMediaSettings](./ContentMediaSettings.md): Media fields hold bucket asset descriptors; upload through the existing service bucket routes, then attach the descriptor using the editorial update API.
- [ContentModelBasics](./ContentModelBasics.md): Core identity of the content model.
- [ContentPermissionSettings](./ContentPermissionSettings.md): Editorial permissions of a content model, expressed over the project's user roles (session.roleId).
- [ContentPublishingSettings](./ContentPublishingSettings.md): The publishing-workflow capability.
- [ContentRichTextAllowAttribute](./ContentRichTextAllowAttribute.md): One attribute a richTextAllowlist rule admits on its tag.
- [ContentRichTextAllowRule](./ContentRichTextAllowRule.md): One rule of bodySettings.richTextAllowlist: a tag the richText body may keep, with the extra attributes and the exact class names it may carry.
- [ContentRoutingSettings](./ContentRoutingSettings.md): Public delivery routing generates a slug on first publish from slugSource; drafts are addressed by id in editorial APIs.
- [ContentSearchSettings](./ContentSearchSettings.md): The search capability of a content model.
- [ContentVersioningSettings](./ContentVersioningSettings.md): The revision-history capability of a content model.
- [ContentWebhook](./ContentWebhook.md): One outbound publishing webhook target of a content model (eventSettings.webhooks[]).
- [ObjectModeration](./ObjectModeration.md): Decision-moderated writes on a data object.

### CronJob

- [CronJob](./CronJob.md): A scheduled job of the service: a cron expression that calls one service library function directly (no Business API, no cron controller).
- [CronJobBasics](./CronJobBasics.md): The identity section of a CronJob (`jobBasics`): name, description, enabled flag, the `library.functions` module it calls and the timeout of one run.
- [CronJobScheduleSettings](./CronJobScheduleSettings.md): The schedule section of a CronJob (`scheduleSettings`): cron expression, time zone, run mode and the startup run.

### DbBucket

- [DbBucket](./DbBucket.md): A database-backed file storage bucket.
- [DbBucketAuthorization](./DbBucketAuthorization.md): Authorization settings for read and write access to the bucket.
- [DbBucketBasics](./DbBucketBasics.md): Core settings for the database bucket including its name, description, size limits, allowed file types, and antivirus scanning.
- [DbBucketOwnerConfig](./DbBucketOwnerConfig.md): Optional pairing with another data object.
- [DbBucketOwnerConfigSettings](./DbBucketOwnerConfigSettings.md): Configuration for the owner data object pairing.

### EdgeController

- [EdgeController](./EdgeController.md): An edge controller defines a fully customized route handled by a developer-defined function.
- [EdgeControllerOptions](./EdgeControllerOptions.md): Options that define the execution behavior of the edge controller, including the function to call and login requirement.
- [EdgeCronSettings](./EdgeCronSettings.md): Reserved cron settings of an edge controller.
- [EdgeKafkaSettings](./EdgeKafkaSettings.md): Defines Kafka consumer/producer settings for the edge controller.
- [EdgeRestSettings](./EdgeRestSettings.md): Defines the public REST endpoint for the edge controller.

### EventStream

- [EventStream](./EventStream.md): Declares a high-throughput event pipeline with ingestion, storage and read surfaces.
- [AnalyticsBinding](./AnalyticsBinding.md): [P4 DONE] Binds an EventStream's analytics store + declares rollups.
- [AnalyticsRollup](./AnalyticsRollup.md): [P4 DONE] One windowed aggregation materialized over an EventStream into the ClickHouse analytics store as a materialized-view→AggregatingMergeTree.
- [CleaningClassifySettings](./CleaningClassifySettings.md): A classify cleaning rule: judges the rule's `field` with a decision provider and writes a judged column plus `<targetColumn>Confidence` and `<targetColumn>DecidedBy` (the pinned model).
- [CleaningRule](./CleaningRule.md): [P5b, defined-but-deferred] One built-in cleanup rule lowered into the Spark ETL transform (see the family's design record, §4.1).
- [ColdSinkBinding](./ColdSinkBinding.md): [P4 DONE; s3Parquet=P5] Binds an EventStream's durable/archival sink for the full append-only history.
- [DecisionPageJudgement](./DecisionPageJudgement.md): Reranks or filters one bounded page of a read surface with a decision provider, in one provider request per page.
- [EtlPipelineBinding](./EtlPipelineBinding.md): [P5b, defined-but-deferred] The Spark-offloaded data-cleaning/ETL stage of an EventStream.
- [EventStreamBasics](./EventStreamBasics.md): The scalar identity + axes of an EventStream (the chapter's first section).
- [EventStreamEventField](./EventStreamEventField.md): One field of an EventStream's telemetry schema — a typed column the ingest API validates and the hot store persists.
- [EventStreamReadSurface](./EventStreamReadSurface.md): A generated read API over an EventStream's stores.
- [HotStoreBinding](./HotStoreBinding.md): Binds an EventStream's hot store.
- [IngestionSettings](./IngestionSettings.md): The write-path tuning for an EventStream (see the family's design record, §5).
- [RetentionPolicy](./RetentionPolicy.md): [P4 DONE] An EventStream's retention/rollup/archival cadence.

### EventSubscription

- [EventSubscription](./EventSubscription.md): Defines a client-facing Kafka event subscription channel.
- [EventSubAuth](./EventSubAuth.md): Authorization configuration for this event subscription.
- [EventSubBasics](./EventSubBasics.md): Core identity of the event subscription.
- [EventSubTopic](./EventSubTopic.md): A Kafka topic included in this subscription.

### GraphServiceLayer

- [GraphServiceLayer](./GraphServiceLayer.md): The service's graph-database surface, namespaced under `service.graphLayer` so the graph collections don't pollute the Service top level (docs/ADR-graph-database-layer.md §4c/§8/§9).
- [CustomGraphQuerySpec](./CustomGraphQuerySpec.md): Spec for `custom` — the bring-your-own-Cypher escape hatch (docs/ADR-graph-database-layer.md §8b).
- [EffectivePermissionSpec](./EffectivePermissionSpec.md): Spec for `effectivePermission` — boolean path-existence from a subject to a resource over membership + grant + containment edges (docs/ADR-graph-database-layer.md §8b / Cypher map).
- [GraphEdge](./GraphEdge.md): A standalone, graph-only relationship hosted on a service (docs/ADR-graph-database-layer.md §4c).
- [GraphQuery](./GraphQuery.md): A declarative graph-traversal query archetype on a service (docs/ADR-graph-database-layer.md §8b).
- [GraphQuerySpec](./GraphQuerySpec.md): The discriminated type-specific payload of a GraphQuery, keyed by `GraphQuery.type` (docs/ADR-graph-database-layer.md §8b).
- [HierarchicalEdge](./HierarchicalEdge.md): One edge of a HierarchicalResourceGraph (docs/ADR-graph-database-layer.md §9).
- [HierarchicalResourceGraph](./HierarchicalResourceGraph.md): The flagship composite graph pattern (docs/ADR-graph-database-layer.md §9).
- [HierarchyTraversalSpec](./HierarchyTraversalSpec.md): Spec shared by `ancestors` and `descendants` — upward or downward traversal of a single hierarchy edge (docs/ADR-graph-database-layer.md §8b).
- [NeighborhoodSpec](./NeighborhoodSpec.md): Spec for `neighborhood` — N-hop expansion around a node (docs/ADR-graph-database-layer.md §8b).
- [PermissionExplainSpec](./PermissionExplainSpec.md): Spec for `permissionExplain` — returns the matched PATH(S) from subject to resource, not just a boolean (docs/ADR-graph-database-layer.md §8b / Cypher map).
- [PermissionInheritancePolicy](./PermissionInheritancePolicy.md): Declared inheritance policy for a HierarchicalResourceGraph.
- [ReachableNodesSpec](./ReachableNodesSpec.md): Spec for `reachableNodes` — variable-length traversal from a source node over given edge types, filtered on the target's projected properties (docs/ADR-graph-database-layer.md §8b / Cypher map).
- [RecommendationSpec](./RecommendationSpec.md): Spec for `recommendation` — a collaborative-filtering traversal: peers who share an edge with the subject, then THEIR other targets (docs/ADR-graph-database-layer.md §8b / §12).
- [ScopedRoleCondition](./ScopedRoleCondition.md): An equality filter on the membership edge of a ScopedRolePermissionSpec (e.g. `status` equals `active`).
- [ScopedRoleDeny](./ScopedRoleDeny.md): Explicit denies of a ScopedRolePermissionSpec.
- [ScopedRoleGrant](./ScopedRoleGrant.md): How the role picked by a ScopedRolePermissionSpec becomes a decision.
- [ScopedRolePermissionSpec](./ScopedRolePermissionSpec.md): Spec shared by `scopedRolePermission` and `scopedRoleExplain` — RBAC over ReBAC.
- [ScopedRoleScope](./ScopedRoleScope.md): One scope level of a ScopedRolePermissionSpec — where a role can be held (e.g. the project itself, or the workspace the project belongs to).
- [ShortestPathSpec](./ShortestPathSpec.md): Spec for `shortestPath` — `shortestPath((a)-[*]-(b))` between two nodes (docs/ADR-graph-database-layer.md §8b).

### JobStream

- [JobStream](./JobStream.md): An async-job-orchestration pattern (docs/ADR-async-job-orchestration-patterns.md).
- [JobStreamAccess](./JobStreamAccess.md): The authorization config of a JobStream (section).
- [JobStreamBasics](./JobStreamBasics.md): Defines a job stream's identity, work topic, partition key and enqueue input schema.
- [JobStreamInputField](./JobStreamInputField.md): One field of a JobStream's enqueue input schema: `name`, `type` and `required`.
- [JobStreamObservation](./JobStreamObservation.md): Configures reconnectable SSE observation and durable event replay for a job stream.
- [JobStreamState](./JobStreamState.md): Configures a job stream's durable status record and result link.
- [JobStreamTargetBinding](./JobStreamTargetBinding.md): Binds a job stream to a processing BusinessApi in the same service.

### LoadShield

- [LoadShield](./LoadShield.md): The service's single in-process priority load shedder (docs/ADR-loadshield-priority-load-shedding.md) — an always-on guard for the WHOLE service against UNPLANNED overload, modeled on Uber's Cinnamon.
- [LoadShieldBasics](./LoadShieldBasics.md): Defines a load shield's identity, enabled flag and target queue latency.
- [LoadShieldExemptions](./LoadShieldExemptions.md): Names APIs that bypass the load shield entirely.
- [LoadShieldTierAssignment](./LoadShieldTierAssignment.md): One explicit shed-priority assignment: `{name?, api, action?, tier}`.
- [LoadShieldTiers](./LoadShieldTiers.md): The shield's per-API/action shed-priority policy (section): the `assignments` list of `LoadShieldTierAssignment` entries.

### NativeBucket

- [NativeBucket](./NativeBucket.md): A self-hosted object-storage bucket backed by a platform-PROVISIONED, SeaweedFS (S3-API-compatible) store (docs/ADR-native-bucket-pattern.md, docs/ADR-seaweedfs-nativebucket.md).
- [NativeBucketStorage](./NativeBucketStorage.md): Storage configuration for a NativeBucket.

### OAuthFlow

- [OAuthFlow](./OAuthFlow.md): A declarative OAuth redirect flow hosted by the service.
- [OAuthFlowBasics](./OAuthFlowBasics.md): Identity and transport of one OAuth flow: the provider it binds to, the requested scopes, the start/callback route shape, the completion Kafka topic, and whether an unknown identity may register.
- [OAuthIdentityGrant](./OAuthIdentityGrant.md): A single identity grant on an OAuthFlow: the provider VERIFIES `identity` (a user verification column) when `condition` (a JS expression over the normalized OAuth `profile`) is truthy.

### RealtimeHub

- [RealtimeHub](./RealtimeHub.md): Defines a bidirectional realtime communication hub powered by Socket.IO.
- [HubAuthScript](./HubAuthScript.md): An MScript-based authorization source for hub room access.
- [HubAuthSource](./HubAuthSource.md): A DataObject-based authorization source for hub room access.
- [HubBasics](./HubBasics.md): Core identity of the realtime hub.
- [HubCustomEvent](./HubCustomEvent.md): Declares an app-specific event that clients emit within the hub, for signals like game actions, cursor positions or custom notifications.
- [HubCustomField](./HubCustomField.md): Defines a single field in a custom message type's content schema.
- [HubCustomMessageType](./HubCustomMessageType.md): Defines a custom (app-specific) message type for the hub.
- [HubEventSettings](./HubEventSettings.md): Configures standard events, auto-bridged DataObject events, custom events, and external Kafka events.
- [HubGuardrails](./HubGuardrails.md): Safety limits, rate controls, moderation settings, and caching for the hub.
- [HubHistorySettings](./HubHistorySettings.md): Controls whether message history is sent to clients when they join a room.
- [HubKafkaEvent](./HubKafkaEvent.md): Bridges a Kafka topic message into the hub as a room-scoped event.
- [HubLogic](./HubLogic.md): Server-side logic hooks for the hub.
- [HubMessageHandler](./HubMessageHandler.md): Intercepts a specific custom message type and routes it through an MScript before broadcast.
- [HubMessageSettings](./HubMessageSettings.md): Controls message structure and persistence.
- [HubRole](./HubRole.md): Defines a named permission set for hub users.
- [HubRoomSettings](./HubRoomSettings.md): Configures how rooms are managed and who can join them.
- [HubScheduledAction](./HubScheduledAction.md): A recurring action that runs on an interval for each active room.

### RemoteBucket

- [RemoteBucket](./RemoteBucket.md): A cloud-storage-backed file bucket.
- [ImageVariant](./ImageVariant.md): One resized copy of every image a bucket stores (see RemoteBucketBasics.imageVariants).
- [RemoteBucketAuthorization](./RemoteBucketAuthorization.md): Authorization settings for read and write access to the remote bucket.
- [RemoteBucketBasics](./RemoteBucketBasics.md): Core settings for the remote bucket including its name, description, size limits, allowed file types, and antivirus scanning.
- [RemoteBucketOwnerConfig](./RemoteBucketOwnerConfig.md): Optional pairing with another data object.
- [RemoteBucketOwnerConfigSettings](./RemoteBucketOwnerConfigSettings.md): Configuration for the owner data object pairing.
- [RemoteBucketSettings](./RemoteBucketSettings.md): Extension settings of a RemoteBucket's auto-generated {name}RemoteFile metadata data object.
- [RemoteBucketStorage](./RemoteBucketStorage.md): Storage configuration for the remote bucket.

### SeedData

- [SeedData](./SeedData.md): A declarative seed-data record upserted into one of the service's DataObjects at service startup, after migrations run and after the kafka producer is wired.
- [DataMapItem](./DataMapItem.md): Represents a single key-value pair used in most context.
- [SeedDataBasics](./SeedDataBasics.md): Identity and upsert policy of one seed record: the target DataObject, the matchBy idempotency key, and the value names that are seeded once and never refreshed.

### ServiceFiles

- [ServiceFiles](./ServiceFiles.md): The service's design-time static files (`service.serviceFiles`): a chapter holding one `manifest` section that lists every file the service carries.
- [ServiceFile](./ServiceFile.md): One design-time service file: `{path, visibility, contentType, size, sha256}`.
- [ServiceFileManifest](./ServiceFileManifest.md): The manifest of the service's files (section): the `files` list of `ServiceFile` entries.

### ServiceLibrary

- [ServiceLibrary](./ServiceLibrary.md): Defines a custom service library for your OpenAPPL service.
- [Calculation](./Calculation.md): A compute *primitive* — the Tier-1 substrate of the compute layer (docs/ADR-calculation-layer.md §1/§5).
- [CalculationExecution](./CalculationExecution.md): Execution policy for a `Calculation` primitive (docs/ADR-calculation-layer.md §1/§8).
- [KernelParam](./KernelParam.md): A single parameter of a `NativeKernel`.
- [KernelSource](./KernelSource.md): A fetchable reference to one source file (or archive) of the existing native library a `NativeKernel` wraps.
- [LibModule](./LibModule.md): Defines a module file in the service library.
- [LibModuleBody](./LibModuleBody.md): Multi-language body of a `LibModule` — one optional body per language/format key.
- [NativeKernel](./NativeKernel.md): Defines a native compute kernel exposed to the service as a library function.
- [PaperMargin](./PaperMargin.md): Page margins for PDF rendering, in millimeters.
- [PdfMetadata](./PdfMetadata.md): Document-level metadata embedded in the generated PDF (visible in PDF readers' document-properties pane and used by some catalog/search systems).
- [PdfTemplate](./PdfTemplate.md): Defines a PDF rendering template used by `RenderPdfAction` to produce styled PDFs (e.g., invoices, receipts, statements).
- [ServiceHook](./ServiceHook.md): One lifecycle hook of the service library: runs the referenced library function (a `functions[]` entry of the SAME service) automatically when the service starts or gracefully stops.
- [WasmExport](./WasmExport.md): One exported function of a `WasmModule`, surfaced to the service library as `LIB.<name>(...)`.
- [WasmModule](./WasmModule.md): Defines a portable WebAssembly module exposed to the service as library functions.
- [WasmParam](./WasmParam.md): A single parameter of a `WasmExport`.
- [WasmSource](./WasmSource.md): A fetchable reference to the `.wasm` binary (or `.wat` text) a `WasmModule` runs.

### ServiceSettings

- [ServiceSettings](./ServiceSettings.md): Defines the foundational settings of the service module, including basic metadata and authentication configurations.
- [GrpcClientConfig](./GrpcClientConfig.md): A named, FOREIGN gRPC server this service can call via a `GrpcCallAction` (docs/ADR-grpc-interservice-and-grpccall.md, Part B).
- [Package](./Package.md): A unified, language-agnostic third-party package dependency declaration.
- [RealtimeConfig](./RealtimeConfig.md): Service-level configuration for the Socket.IO server powering realtime hubs.
- [ServiceBasics](./ServiceBasics.md): Provides core identifiers and metadata for the service.
- [ServiceOptions](./ServiceOptions.md): Defines a configuration class for the basic options of the service for authentication, http and data model

### ShoppingCartConfig

- [ShoppingCartConfig](./ShoppingCartConfig.md): Shopping cart configuration chapter.
- [AutoGeneratedCampaignSettings](./AutoGeneratedCampaignSettings.md): Configuration for the auto-generated Campaign DataObject.
- [CartApiRoutes](./CartApiRoutes.md): Which cart API routes to generate.
- [CartDiscountConfig](./CartDiscountConfig.md): Configuration for discount handling.
- [CartExtraChargeConfig](./CartExtraChargeConfig.md): Configuration for additional charges like handling, packaging, insurance, etc.
- [CartGuestHoldQuota](./CartGuestHoldQuota.md): Bounds on the reservation holds one guest session may accumulate.
- [CartQuantityDiscountPromotion](./CartQuantityDiscountPromotion.md): Static promotion: Tiered discount based on total item quantity.
- [CartQuantityDiscountTier](./CartQuantityDiscountTier.md): A single tier in cart quantity discount promotion.
- [CartShipmentConfig](./CartShipmentConfig.md): Configuration for shipment/delivery charges.
- [CartToOrderPropertyMapping](./CartToOrderPropertyMapping.md): Maps a cart property to an order property, optionally with a transformation.
- [CartTotalDiscountPromotion](./CartTotalDiscountPromotion.md): Static promotion: Tiered discount based on cart total.
- [CartTotalDiscountTier](./CartTotalDiscountTier.md): A single tier in cart total discount promotion.
- [DynamicPromotionSettings](./DynamicPromotionSettings.md): Configuration for complex, database-driven promotions evaluated by the Promotion Engine at runtime.
- [FreeShippingPromotion](./FreeShippingPromotion.md): Static promotion: Free shipping when cart total exceeds threshold.
- [LoyaltyPointsMultiplierPromotion](./LoyaltyPointsMultiplierPromotion.md): Static promotion: Points multiplier based on membership level.
- [MembershipDiscountLevel](./MembershipDiscountLevel.md): Discount configuration for a specific membership level.
- [MembershipDiscountPromotion](./MembershipDiscountPromotion.md): Static promotion: Discount based on customer membership level.
- [PointsMultiplierLevel](./PointsMultiplierLevel.md): Points multiplier configuration for a specific membership level.
- [ProductFieldMappings](./ProductFieldMappings.md): Declares product DataObject property-name mappings.
- [PromotionCacheSettings](./PromotionCacheSettings.md): Redis caching configuration for promotion campaign data.
- [ShoppingCartApiSettings](./ShoppingCartApiSettings.md): Configuration for auto-generated cart management API routes.
- [ShoppingCartBasicSettings](./ShoppingCartBasicSettings.md): Core shopping cart settings with activation flag.
- [ShoppingCartCheckoutSettings](./ShoppingCartCheckoutSettings.md): Configuration for cart-to-order checkout process.
- [ShoppingCartItemSettings](./ShoppingCartItemSettings.md): Configuration for cart line items.
- [ShoppingCartLogisticsSettings](./ShoppingCartLogisticsSettings.md): Configuration for shipping logistics.
- [ShoppingCartLoyaltySettings](./ShoppingCartLoyaltySettings.md): Loyalty program configuration.
- [ShoppingCartPricingSettings](./ShoppingCartPricingSettings.md): Price calculation settings.
- [ShoppingCartProductCatalogSettings](./ShoppingCartProductCatalogSettings.md): Optional product catalog integration.
- [ShoppingCartPromotionSettings](./ShoppingCartPromotionSettings.md): Promotion engine configuration.
- [ShoppingCartRedisSettings](./ShoppingCartRedisSettings.md): Redis-first cart storage settings.
- [ShoppingCartReservationSettings](./ShoppingCartReservationSettings.md): Opt-in TTL stock reservation.
- [StaticPromotionSettings](./StaticPromotionSettings.md): Simple cart-level promotion tiers (free-shipping threshold, cart total and quantity discounts, membership discounts, a loyalty points multiplier).

### VideoRoom

- [VideoRoom](./VideoRoom.md): Defines a video-conference / live-broadcast room surface for the service (docs/ADR-video-conference-pattern-family.md).
- [VideoCustomAnalysis](./VideoCustomAnalysis.md): One domain-specific LLM analysis pass over the room transcript.
- [VideoLiveTranslationSettings](./VideoLiveTranslationSettings.md): Live caption translation for the room.
- [VideoMeetingAgent](./VideoMeetingAgent.md): An AI meeting/voice agent that joins the video room as a participant (docs/ADR-video-live-ai-layer.md §4).
- [VideoMeetingAnalysisSettings](./VideoMeetingAnalysisSettings.md): LLM meeting-analysis passes over the room transcript (requires aiPipeline.transcription.enabled).
- [VideoRoomAiPipeline](./VideoRoomAiPipeline.md): The AI layer on top of the video room (docs/ADR-video-conference-pattern-family.md §8) — pure composition of existing OpenAPPL layers, no new provider system.
- [VideoRoomAuthScript](./VideoRoomAuthScript.md): An MScript-based authorization source for video room access, evaluated with 'user' (session data) and 'room' (room record) as context variables.
- [VideoRoomAuthSource](./VideoRoomAuthSource.md): A DataObject-based authorization source for video room access.
- [VideoRoomBasics](./VideoRoomBasics.md): Core identity of the video room.
- [VideoRoomBroadcastSettings](./VideoRoomBroadcastSettings.md): Live-broadcast delivery for webinar and broadcast room kinds.
- [VideoRoomEventSettings](./VideoRoomEventSettings.md): Kafka lifecycle event publication for the room.
- [VideoRoomGuardrails](./VideoRoomGuardrails.md): Safety limits for the room.
- [VideoRoomRecordingSettings](./VideoRoomRecordingSettings.md): Recording configuration for the room.
- [VideoRoomRole](./VideoRoomRole.md): Defines a named media-capability set for video room users.
- [VideoRoomSessionSettings](./VideoRoomSessionSettings.md): Controls the auto-generated session persistence DataObjects.
- [VideoRoomSettings](./VideoRoomSettings.md): Binds the video room to an existing DataObject and configures who may join and with which roomRole.
- [VideoSimulcastTarget](./VideoSimulcastTarget.md): One external RTMP push target of a broadcast (e.g. a YouTube Live / Twitch / LinkedIn Live endpoint).
- [VideoSmartSearchSettings](./VideoSmartSearchSettings.md): Search over the room's transcripts and insights.
- [VideoTranscriptionSettings](./VideoTranscriptionSettings.md): Speech-to-text configuration for the room.

### WaitingRoom

- [WaitingRoom](./WaitingRoom.md): A PULL-mode admission-control queue pattern (docs/ADR-async-job-orchestration-patterns.md, the WaitingRoom section) — the Taylor-Swift-ticketing turnstile.
- [QueTokenSettings](./QueTokenSettings.md): The admission token config of a WaitingRoom (section): the one-shot, time-boxed `ttlSeconds` and Redis-backed `singleUse` semantics of the QueToken minted when a waiter reaches final admission.
- [WaitingRoomBasics](./WaitingRoomBasics.md): Defines a waiting room's identity, fairness policy and abandonment timeout.
- [WaitingRoomPositionChannel](./WaitingRoomPositionChannel.md): The room's own realtime/SSE position channel (section): the `channelName` clients subscribe to for live position (ZRANK) and admission updates, the `transport`, and `emitPositionEverySeconds`.
- [WaitingRoomStage](./WaitingRoomStage.md): Defines one Redis admission stage with a rate ceiling, optional rate floor and capacity.
- [WaitingRoomStages](./WaitingRoomStages.md): The staged admission gates of a WaitingRoom (section): the ordered `stages` list — room 0 (the entry room a join lands in) through the final room (final admission mints the QueToken).
- [WaitingRoomTargetBinding](./WaitingRoomTargetBinding.md): Binds the PUBLIC BusinessApi a WaitingRoom fronts (section): the target `api` name (a businessLogic[] BusinessApi in THIS service) + `action`.

## Domain: AgentHubConfig

[AgentHubConfig](./AgentHubConfig.md) and the families it contains.

### AgentHubConfig

- [AgentHubConfig](./AgentHubConfig.md): Configuration for the AgentHub service — a centralized AI agent management platform.

### AgentHarness

- [AgentHarness](./AgentHarness.md): An agent harness hosted by agentHub: a long-running, autonomous agent run by an open-source harness runtime (docs/ADR-agent-harness.md).
- [AgentHarnessAssets](./AgentHarnessAssets.md): Skills, documents and scripts of an AgentHarness.
- [AgentHarnessBasics](./AgentHarnessBasics.md): Identity of an AgentHarness: its unique name, description, runtime and enabled flag.
- [AgentHarnessModelSettings](./AgentHarnessModelSettings.md): The model an AgentHarness runs on, and how the session authenticates to it.
- [AgentHarnessNetworkSettings](./AgentHarnessNetworkSettings.md): Outbound network policy of an AgentHarness's sandboxed process (maintainer ruling Q3).
- [AgentHarnessPlugin](./AgentHarnessPlugin.md): A runtime-native plugin of an AgentHarness, installed into the harness profile at runner build.
- [AgentHarnessSessionSettings](./AgentHarnessSessionSettings.md): Frontend access and per-user limits of an AgentHarness's sessions.
- [AgentHarnessToolSettings](./AgentHarnessToolSettings.md): The project tools an AgentHarness may call.
- [AgentHarnessTrigger](./AgentHarnessTrigger.md): A Kafka trigger of an AgentHarness: a matching event starts a background session (origin `kafka`) as the agentHub M2M service identity.
- [AgentHarnessWebTools](./AgentHarnessWebTools.md): Platform web tools offered to an AgentHarness through its session MCP endpoint, each backed by a root `integrations[]` entry of the project.

### AgentHubSettings

- [AgentHubSettings](./AgentHubSettings.md): Hub settings chapter containing the basic configuration and tool source definitions for the Agent Hub service.
- [AgentHubBasics](./AgentHubBasics.md): Core settings for the Agent Hub service including dynamic agent creation controls and tool discovery configuration.
- [AgentHubToolSource](./AgentHubToolSource.md): Defines a service from which the Agent Hub discovers tools.

## Domain: BFFService

[BFFService](./BFFService.md) and the families it contains.

### BFFService

- [BFFService](./BFFService.md): Configuration settings for the BFF (Backend-for-Frontend) service in the project.

### BffServiceSettings

- [BffServiceSettings](./BffServiceSettings.md): Module-level settings chapter for the BFF service.

### DataView

- [DataView](./DataView.md): A DataView defines an aggregated projection of data for the BFF service in OpenAPPL.
- [AggregateItem](./AggregateItem.md): Defines a single mathematical operation to apply to a group of records within a ViewStat.
- [ViewAggregate](./ViewAggregate.md): Defines an aggregate (join) within a DataView that links related objects to the main object, similar to SQL-style joins.
- [ViewBasics](./ViewBasics.md): Configuration for a DataView's identity and structure.
- [ViewStat](./ViewStat.md): Defines a statistical aggregation for a DataView.

## Domain: EnterpriseHubConfig

[EnterpriseHubConfig](./EnterpriseHubConfig.md) and the families it contains.

### EnterpriseHubConfig

- [EnterpriseHubConfig](./EnterpriseHubConfig.md): The project-level enterprise-integration asset hub (module).

### EnterpriseModel

- [EnterpriseModel](./EnterpriseModel.md): A model of one connected enterprise platform's assets (chapter).
- [EnterpriseAction](./EnterpriseAction.md): An invokable platform-side business function (section) — a SAP BAPI / OData function import / action, a Salesforce Apex REST or invocable action, a Dataverse bound/unbound action, etc.
- [EnterpriseEvent](./EnterpriseEvent.md): A business event the model subscribes to (section), mapped to a Kafka topic so the rest of the OpenAPPL application can consume it.
- [EnterpriseModelBasics](./EnterpriseModelBasics.md): Core settings for an EnterpriseModel (section).
- [EnterpriseObject](./EnterpriseObject.md): A reference to a business object in the platform's metadata (section) — e.g. SAP A_BusinessPartner, Salesforce Account, HubSpot contacts.

## Domain: NotificationService

[NotificationService](./NotificationService.md) and the families it contains.

### NotificationService

- [NotificationService](./NotificationService.md): Defines the global notification configuration for the project.

### EventNotification

- [EventNotification](./EventNotification.md): Defines a single event-triggered notification within the project.
- [ContentModeration](./ContentModeration.md): Decision moderation of content that is not a DataObject write: objectModeration applied to RealtimeHub messages and outbound notification content.
- [EventDataSettings](./EventDataSettings.md): Defines how the event notification extracts and processes data from incoming Kafka messages.
- [EventNotificationBasics](./EventNotificationBasics.md): Defines the basic properties of an event notification, including its name, description, storage behavior, and job type.
- [GeofenceTrigger](./GeofenceTrigger.md): Geofence trigger spec — applied to EventNotifications with triggerSource='geofence'.
- [NotificationTarget](./NotificationTarget.md): Defines a recipient or list of recipients for an event notification.
- [NotificationTemplate](./NotificationTemplate.md): Defines a notification template used to render the content of event notifications.
- [NotificationTemplateVariant](./NotificationTemplateVariant.md)
- [NotificationWhatsAppTemplate](./NotificationWhatsAppTemplate.md): An approved WhatsApp template for a jobType='whatsapp' EventNotification: the Meta template name or the Twilio Content SID, its language, and the parameter scripts.
- [WhatsAppTemplateButton](./WhatsAppTemplateButton.md): One button of an approved WhatsApp template (Meta).

### NotificationServiceSettings

- [NotificationServiceSettings](./NotificationServiceSettings.md): Defines the basic notification configuration for the project.
- [NotificationServiceOptions](./NotificationServiceOptions.md): Default notification provider per channel plus storage policy.

### WhatsAppIngressSettings

- [WhatsAppIngressSettings](./WhatsAppIngressSettings.md): Explicit routes of the WhatsApp inbound dispatcher (`notificationService.whatsappIngress`).
- [WhatsAppIngressRoute](./WhatsAppIngressRoute.md): One explicit listener on a WhatsApp provider's door.

## Domain: ProjectAuthentication

[ProjectAuthentication](./ProjectAuthentication.md) and the families it contains.

### ProjectAuthentication

- [ProjectAuthentication](./ProjectAuthentication.md): Defines the authentication and authorization configuration for the entire project.
- [ProfileSettings](./ProfileSettings.md): The project's declaration of a readable user profile — the sanctioned way to show WHO a record belongs to.
- [SessionGeoSensitivity](./SessionGeoSensitivity.md): Activates location-based session sensitivity.
- [SessionGeoSensitivityConfig](./SessionGeoSensitivityConfig.md): Defines how a location change is detected and what happens when it occurs.

### AccessControl

- [AccessControl](./AccessControl.md): Configuration chapter for defining the access control architecture of the project.
- [ABACDefinititon](./ABACDefinititon.md): Defines a single ABAC (Attribute-Based Access Control) rule for a given data object.
- [AbacPermission](./AbacPermission.md): Configuration for Attribute-Based Access Control (ABAC), allowing fine-grained permission control using attribute-level rules on data objects.
- [OBACPermission](./OBACPermission.md): Configuration for Object-Based Access Control (OBAC), which restricts access to specific data objects based on object ownership or association.
- [PermissionBasics](./PermissionBasics.md): Defines the foundational permission model of the project.
- [PermissionBasicsConfig](./PermissionBasicsConfig.md): Configuration details for permission basics, including permission groups.
- [PermissionGroup](./PermissionGroup.md): Defines a group of permissions under a shared namespace.
- [PermissionTypes](./PermissionTypes.md): Defines the active permission mechanisms in the project.
- [RBACSettings](./RBACSettings.md): Configuration for Role-Based Access Control (RBAC) within the project.
- [RBACSettingsConfig](./RBACSettingsConfig.md): Configuration details for RBAC, including roles, role ID data type, custom role lookups, and multi-role support.
- [RoleItem](./RoleItem.md): Represents a role definition in the RBAC system.
- [RolePermission](./RolePermission.md): A single SEED role-to-permission binding (ADR-native-permission-system §9.1).

### AuthBasics

- [AuthBasics](./AuthBasics.md): Defines the fundamental authentication configuration for the project.
- [APIKeyAuth](./APIKeyAuth.md): Enables API key authentication for the project.
- [APIKeyAuthConfig](./APIKeyAuthConfig.md): Fine-tune API key authentication behavior.
- [AuthHttpSettings](./AuthHttpSettings.md): Defines the HTTP configuration of the auth service.
- [CookieSettings](./CookieSettings.md): Arranges the allow-list for the session cookie.
- [JWTAuth](./JWTAuth.md): Defines the configuration for JWT-based authentication, where the project issues and verifies its own JSON Web Tokens.
- [JWTAuthConfig](./JWTAuthConfig.md): Defines the configuration details for JWT-based authentication.
- [ModuleDocumentation](./ModuleDocumentation.md): Holds the module-level frontendDocument UX prompt.
- [RefreshTokenSettings](./RefreshTokenSettings.md): Configures opt-in refresh tokens for the auth service.
- [SSOAuth](./SSOAuth.md): Retained Single Sign-On (SSO) configuration schema.
- [SSOAuthConfig](./SSOAuthConfig.md): Retained external identity provider settings for the unavailable SSO feature.
- [SSOServerSettings](./SSOServerSettings.md): Retained endpoint and credential settings for the unavailable SSO feature.

### ForeignPermissionProvider

- [ForeignPermissionProvider](./ForeignPermissionProvider.md): Project-wide foreign permission server configuration (one foreign server, one transport).
- [ForeignPermissionProviderBasics](./ForeignPermissionProviderBasics.md): Transport and decision policy of the foreign permission server (one server, one transport).
- [ForeignPermissionSessionBinding](./ForeignPermissionSessionBinding.md): One session-field → request-PLACEMENT binding.
- [GrpcClientMetadataItem](./GrpcClientMetadataItem.md): A single STATIC gRPC metadata header sent on every call to a foreign gRPC server (see GrpcClientConfig.metadata).
- [GrpcClientTls](./GrpcClientTls.md): Transport security for a foreign gRPC client (see GrpcClientConfig.tls).

### LoginDefinition

- [LoginDefinition](./LoginDefinition.md): Defines the core login architecture of the project, including the user and tenant structures that underpin authentication and access.
- [LoginDefTenantSettings](./LoginDefTenantSettings.md): Specifies how tenant-based access control is structured for multi-tenant projects.
- [LoginDefTenantSettingsConfig](./LoginDefTenantSettingsConfig.md): Configuration details for tenant-based access control, including tenant registration, naming, and avatar script.
- [LoginDefUserSettings](./LoginDefUserSettings.md): Defines how users are stored, managed, and authenticated within the project.

### SocialLoginSettings

- [SocialLoginSettings](./SocialLoginSettings.md): Configuration for enabling social login support within the project.
- [AppleLoginConfig](./AppleLoginConfig.md): Configuration details for Apple Sign In.
- [AppleLoginSetting](./AppleLoginSetting.md): Configuration for Apple Sign In with Apple.
- [FacebookLoginConfig](./FacebookLoginConfig.md): Configuration details for Facebook OAuth login, including App ID and App Secret.
- [FacebookLoginSetting](./FacebookLoginSetting.md): Configuration for Facebook OAuth login.
- [GithubLoginConfig](./GithubLoginConfig.md): Configuration details for GitHub OAuth login, including client ID and secret.
- [GithubLoginSetting](./GithubLoginSetting.md): Configuration for GitHub OAuth login.
- [GitlabLoginConfig](./GitlabLoginConfig.md): Configuration details for GitLab OAuth login, including client ID and secret.
- [GitlabLoginSetting](./GitlabLoginSetting.md): Configuration for GitLab OAuth login.
- [GoogleLoginConfig](./GoogleLoginConfig.md): Configuration details for Google OAuth login, including client ID and secret.
- [GoogleLoginSetting](./GoogleLoginSetting.md): Configuration for Google OAuth login.
- [LinkedinLoginConfig](./LinkedinLoginConfig.md): Configuration details for LinkedIn OAuth login, including client ID and secret.
- [LinkedinLoginSetting](./LinkedinLoginSetting.md): Configuration for LinkedIn OAuth login.
- [MicrosoftLoginConfig](./MicrosoftLoginConfig.md): Configuration details for Microsoft OAuth login.
- [MicrosoftLoginSetting](./MicrosoftLoginSetting.md): Configuration for Microsoft Azure AD / Microsoft Entra ID OAuth login.

### VerificationServices

- [VerificationServices](./VerificationServices.md): Defines user-related verification features such as password resets and two-factor authentication (2FA).
- [Email2Factor](./Email2Factor.md): Configuration for email-based two-factor authentication.
- [EmailVerification](./EmailVerification.md): Defines the settings for verifying a user's email address.
- [Mobile2Factor](./Mobile2Factor.md): Configuration for mobile-based two-factor authentication.
- [MobileVerification](./MobileVerification.md): Defines the settings for verifying a user's mobile number.
- [PasswordResetByEmail](./PasswordResetByEmail.md): Configuration for enabling password reset via email.
- [PasswordResetByMobile](./PasswordResetByMobile.md): Configuration for enabling password reset via mobile.
- [VerificationConfig](./VerificationConfig.md): Defines the configuration for verification flows, including password resets and two-factor authentication.
- [VerificationSettings](./VerificationSettings.md): General options for all verifications.

## Domain: BusinessApi

[BusinessApi](./BusinessApi.md) and the families it contains.

### BusinessApi

- [BusinessApi](./BusinessApi.md): Defines a Business API, a high-level abstraction representing a specific business operation on a primary data object.

### BusinessApiActionStore

- [BusinessApiActionStore](./BusinessApiActionStore.md): Represents the centralized registry of all executable logic units (actions) that can be used inside a Business API's workflow.
- [AddToContextAction](./AddToContextAction.md): Adds one or more calculated values to the runtime context (`this`) at a specific point in the Business API flow.
- [AddToResponseAction](./AddToResponseAction.md): Adds one or more properties from the current context to the final response object after the main operation completes.
- [AgentCallAction](./AgentCallAction.md): Invokes an AI Agent from within a Business API workflow.
- [AiCallAction](./AiCallAction.md): Invokes an AI model such as OpenAI or Anthropic to perform text generation, refinement, classification, or summarization.
- [AIPromptTemplate](./AIPromptTemplate.md): Defines the structure of an AI prompt using a two-part design: a static system-level instruction and a dynamic user message populated via MScript from the current context.
- [ApiAggregateData](./ApiAggregateData.md): Defines a single property-value pair used to populate a related data object during an aggregated operation.
- [ApiCallAction](./ApiCallAction.md): Calls an external or internal HTTP API during Business API execution.
- [ArrowFunctionAction](./ArrowFunctionAction.md): This action defines a reusable function and sets it to the context with the contextPropertyName name.
- [BulkColumnPolicy](./BulkColumnPolicy.md): The onExisting policy of one column when an UpsertBulkCrudAction updates a matched row.
- [CartCheckoutAction](./CartCheckoutAction.md): Processes shopping cart checkout.
- [CartValidationAction](./CartValidationAction.md): Validates a shopping cart before checkout.
- [CheckMailboxAction](./CheckMailboxAction.md): Checks a MailAccount's mailbox on demand and stores the matching message summaries in the context.
- [CollateListsAction](./CollateListsAction.md): Use CollateListsAction to collate a list of objects to another list of objects like aggregating an adress list to a user list.
- [ContentTransitionAction](./ContentTransitionAction.md): BusinessApiAction that drives the publishing lifecycle of a declared ContentModel record from inside a composed workflow — publish, unpublish, schedule, unschedule, archive, restore.
- [ContextData](./ContextData.md): ContextData is a container object to represent any key-value pair to write or read to/from context.
- [CouponValidationAction](./CouponValidationAction.md): Validates a coupon code for eligibility against the active cart and optionally calculates the discount amount.
- [CreateBulkCrudAction](./CreateBulkCrudAction.md): Defines a bulk creation operation for multiple related data objects—typically child or associated entities—within a Business API.
- [CreateCrudAction](./CreateCrudAction.md): Defines an embedded creation operation for a related data object—typically a child or associated entity—within a Business API.
- [CreateJWTTokenAction](./CreateJWTTokenAction.md): Generates a signed JWT token from a given payload.
- [CreateObjectAction](./CreateObjectAction.md): Constructs an in-memory JavaScript object from key-value pairs and writes it to the context.
- [DataToFileAction](./DataToFileAction.md): Converts a given input into a downloadable file such as CSV, JSON, or XLSX.
- [DecisionAction](./DecisionAction.md): Asks a calibrated decision provider typed questions about a piece of state and writes the typed answers into the workflow context.
- [DecisionCacheSettings](./DecisionCacheSettings.md): Caching for a DecisionAction or a FuzzyDomainFilter - both use the ONE decision cache of the decision layer, stored in the service's Redis.
- [DeleteCrudAction](./DeleteCrudAction.md): Defines an embedded delete operation to remove related records—typically child or connected entities—within a Business API.
- [EmitSseEventAction](./EmitSseEventAction.md): Emits a custom SSE event during the workflow.
- [FetchFromElasticAction](./FetchFromElasticAction.md): Fetches data object data from its elastic search index with a raw elastic search body, and stores a normalized ENVELOPE in the action's context property: `{ items, aggregations, total }`.
- [FetchFromElasticLogAction](./FetchFromElasticLogAction.md): BusinessApiAction that queries a declared ElasticLog by name with an Elasticsearch search body and writes the hits to the action context.
- [FetchObjectAction](./FetchObjectAction.md): Fetches one or more records from a foreign or related data object and stores the result in the context or response.
- [FetchParentAction](./FetchParentAction.md): Fetches selected properties from a parent object related to the current object in context.
- [FetchStatsAction](./FetchStatsAction.md): An action used to compute inline aggregate statistics (e.g., count, min, max, sum) from a data object.
- [FileToDataAction](./FileToDataAction.md): Parses a tabular file into an array of row objects keyed by data-model property names, and stores `{ rows, rejected, total }` in the action's context property.
- [FiscalizeAction](./FiscalizeAction.md): Drives the regulatory fiscalization lifecycle for a fiscalization-enabled DataObject through the generated per-object FiscalizationManager.
- [FunctionCallAction](./FunctionCallAction.md): Defines a reusable logic step that calls a library-defined function using MScript syntax.
- [GraphQueryAction](./GraphQueryAction.md): Runs a parameterized graph traversal and writes mapped records to the action context.
- [GrpcCallAction](./GrpcCallAction.md): Calls a FOREIGN (non-OpenAPPL) gRPC server during Business API execution (docs/ADR-grpc-interservice-and-grpccall.md, Part B).
- [GrpcCallRequest](./GrpcCallRequest.md): The request message for a `GrpcCallAction` — a list of proto-field-to-MScript mappings.
- [HTTPRequest](./HTTPRequest.md): Defines a reusable HTTP request configuration to interact with a remote service and retrieve a JSON response.
- [HTTPRequestParameters](./HTTPRequestParameters.md): Defines the parameters to be sent with an HTTP request.
- [IntegrationAction](./IntegrationAction.md): Calls a third-party API integration from the platform integration catalog (e.g., AWS S3, Stripe, Google Maps).
- [IntegrationParameter](./IntegrationParameter.md): Defines a single named input to be passed to a native integration provider action.
- [InterProjectCallAction](./InterProjectCallAction.md): Calls a Business API in a linked sibling project in the same organization.
- [InterserviceApplyField](./InterserviceApplyField.md): A guarded single-field update on another service's record, applied through that service's typed update API, where the field NAME is computed at runtime and whitelisted at design time.
- [InterserviceCallAction](./InterserviceCallAction.md): Calls another Business API defined in a different microservice.
- [InvoiceAction](./InvoiceAction.md): Drives the accounts-receivable invoice lifecycle for an invoicing-enabled DataObject through the generated per-object InvoiceManager.
- [IteratorAction](./IteratorAction.md): A generic streaming action whose method returns an async iterable.
- [ListMapAction](./ListMapAction.md): This action creates a new list out of a current list by mapping its items with MScript.
- [LoopAction](./LoopAction.md): Defines a repeated execution block within a Business API workflow.
- [MembershipCheckAction](./MembershipCheckAction.md): Defines access control based on membership rules configured on a data object.
- [ObjectData](./ObjectData.md): Represents a single property assignment used when constructing a new object via `CreateObjectAction`.
- [ObjectPermissionCheckAction](./ObjectPermissionCheckAction.md): Performs a permission check scoped to a specific object instance.
- [ParallelAction](./ParallelAction.md): Defines a non-blocking execution group in which multiple actions are executed in parallel.
- [PaymentAction](./PaymentAction.md): Calls the proper native payment provider functions according to the current stage of payment lifecycle.
- [PayoutAction](./PayoutAction.md): Triggers a marketplace payout to a connected sub-merchant account via the bound PaymentProvider.
- [PermissionCheckAction](./PermissionCheckAction.md): Defines a global permission check that evaluates whether the user holds specific platform or service-level permissions.
- [PublishEventAction](./PublishEventAction.md): Publishes a message to an event topic (such as a message bus, queue, or pub/sub channel) as part of the Business API flow.
- [ReadFromRedisAction](./ReadFromRedisAction.md): Reads a value from Redis using a dynamically computed key and writes the result into the context under a specified property name (contextPropertyName).
- [ReadJwtTokenAction](./ReadJwtTokenAction.md): Defines a read jwt token operation from either context, session or request and write its payload to the context with the contextPropertyName after validating it.
- [ReadMailAction](./ReadMailAction.md): Fetches ONE full message from a MailAccount's mailbox by its RFC 5322 `messageId` — bodies (`text`/`html`) plus attachment content — and stores it in the context.
- [RedirectAction](./RedirectAction.md): Redirects the client to a new URL after the API execution.
- [RefundAction](./RefundAction.md): Issues a refund against a prior captured payment via the bound PaymentProvider.
- [RemoveFromResponseAction](./RemoveFromResponseAction.md): Removes one or more properties from the final API response before it is returned to the client.
- [RenderDataAction](./RenderDataAction.md): Renders a literal string with flat ${key} substitutions from inputData on nodejs.
- [RenderPdfAction](./RenderPdfAction.md): Renders a PDF from a `PdfTemplate` + input data, or from pre-rendered HTML.
- [SearchObjectAction](./SearchObjectAction.md): Searches one or more records from the main data object or a foreign or related data object and stores the result in the context as an id array.
- [SendMailAction](./SendMailAction.md): Sends an email using a configured email provider — or, when `mailAccount` is set, ON BEHALF OF a project MailAccount through the mcpbff mail bridge (docs/ADR-mail-account-family.md).
- [SendPushNotificationAction](./SendPushNotificationAction.md): Sends a push notification using a configured provider (e.g., Firebase, OneSignal).
- [SendSmsAction](./SendSmsAction.md): Sends an SMS message using a configured SMS provider.
- [SendWhatsAppAction](./SendWhatsAppAction.md): Sends a WhatsApp Business message using a configured WhatsApp provider — either Meta WhatsApp Cloud API (provider='whatsapp') or Twilio's WhatsApp channel (provider='twilio' with kind='whatsapp').
- [SheetCell](./SheetCell.md): One free cell of an exported worksheet: any address, any MScript.
- [SheetLayout](./SheetLayout.md): The layout of an exported xlsx worksheet around the data table.
- [SheetTotal](./SheetTotal.md): One cell of the totals row written under the exported table.
- [SignDataWithProjectKeyAction](./SignDataWithProjectKeyAction.md): Signs an arbitrary value with the project's Ed25519 private key and stores a verifiable envelope on the workflow context.
- [SubscriptionAction](./SubscriptionAction.md): Creates, updates, cancels, or refreshes a recurring subscription against the bound PaymentProvider.
- [TabularColumnMap](./TabularColumnMap.md): One column of a tabular import or export.
- [TabularTextOptions](./TabularTextOptions.md): Serializer options for the text formats of a ROWS mode export.
- [UpdateCrudAction](./UpdateCrudAction.md): Defines an embedded update operation for related data objects—typically child or connected entities—within a Business API.
- [UpsertBulkCrudAction](./UpsertBulkCrudAction.md): Writes an array of rows into a data object with insert-or-update semantics—the bulk import twin of CreateBulkCrudAction.
- [ValidationAction](./ValidationAction.md): Defines a flexible business rule that performs a dynamic condition check during Business API execution.
- [VerifyWebhookAction](./VerifyWebhookAction.md): Verifies a webhook call of a provider with its signature secret and reads the parameters and writes them to the context.
- [VideoRoomControlAction](./VideoRoomControlAction.md): Performs a provider control-plane operation on a declared VideoRoom.
- [VideoRoomTokenAction](./VideoRoomTokenAction.md): Authorizes a room identity and mints its provider join token or broadcast playback grant.
- [WireKeyMapItem](./WireKeyMapItem.md): A key-value pair whose name is a WIRE key (URL query parameter name or JSON body key).
- [WireTokenMapItem](./WireTokenMapItem.md): A key-value pair whose name is a WIRE-PROTOCOL token (HTTP header or cookie name).
- [WriteToElasticLogAction](./WriteToElasticLogAction.md): BusinessApiAction that appends an object to a declared ElasticLog by name.
- [WriteToRedisAction](./WriteToRedisAction.md): Writes a value to Redis under a computed key.

### BusinessApiBasics

- [BusinessApiBasics](./BusinessApiBasics.md): Groups a BusinessApi's core API options and authentication settings.
- [ApiApprovalRequirement](./ApiApprovalRequirement.md): The step-up approval requirement of one Business API: the channel of its one-time code, the input binding, the code lifetime and the action text the message shows.
- [ApiAuthOptions](./ApiAuthOptions.md): Defines core authentication and authorization settings for a Business API.
- [ApiForeignPermissionCheck](./ApiForeignPermissionCheck.md): Per-BusinessApi foreign-permission question.
- [ApiOptions](./ApiOptions.md): Main configuration section for a Business API.
- [ApiParentOwnershipCheck](./ApiParentOwnershipCheck.md): One PARENT-ownership gate for a Business API.
- [ApiPermissionCheck](./ApiPermissionCheck.md): Per-BusinessApi NATIVE permission gate (ADR-native-permission-system §9.5).
- [VisitContextField](./VisitContextField.md): One analytic dimension captured on a visit history row (visits ADR section 2.3): its name in the row's `context` JSON, and the MScript that computes it at visit time.
- [VisitSettings](./VisitSettings.md): Api-level visit trigger (docs/ADR-object-visits-pattern.md section 2.2).

### BusinessApiControllers

- [BusinessApiControllers](./BusinessApiControllers.md): Transport bindings of a `BusinessApi` (section): the optional REST, gRPC, Kafka, SSE, cron and internal-call controller settings that expose the API.
- [ApiCronSettings](./ApiCronSettings.md): Schedules the Business API for periodic execution using a cron expression.
- [ApiGrpcSettings](./ApiGrpcSettings.md): Enables gRPC interface for the Business API.
- [ApiInternalCallSettings](./ApiInternalCallSettings.md): Marks the Business API as callable IN-PROCESS from ANY MScript-evaluated designer script of the same service, not only from payment lifecycle hooks.
- [ApiKafkaSettings](./ApiKafkaSettings.md): Configures Kafka as a trigger mechanism for the Business API.
- [ApiRestSettings](./ApiRestSettings.md): Defines the REST controller configuration for a Business API.
- [ApiSseSettings](./ApiSseSettings.md): Enables Server-Sent Events (SSE) streaming for a Business API, allowing the API to stream its response as chunks or emit progress events over an SSE connection.
- [KafkaProgressListener](./KafkaProgressListener.md): Configures a Kafka topic subscription for receiving progress updates from remote processes during an SSE connection.
- [StreamSourceConfig](./StreamSourceConfig.md): Reserved: not read by the code generator yet.

### BusinessApiParameters

- [BusinessApiParameters](./BusinessApiParameters.md): Parameter sources of a `BusinessApi` (section): custom `requestParameters` (validated request inputs fed into the workflow context) and `redisParameters` (values read from Redis into the context).
- [BusinessApiParameter](./BusinessApiParameter.md): Defines a customizable input parameter for a Business API.
- [RedisApiParameter](./RedisApiParameter.md): Defines a parameter whose value is fetched from Redis before Business API execution begins.

### BusinessApiQuery

- [BusinessApiQuery](./BusinessApiQuery.md): Data-access shape of a `BusinessApi` (section): the select / where / data clauses plus delete / get / list / pagination options that drive the API's primary data-object query.
- [DeleteOptions](./DeleteOptions.md): Options block of a `delete`-type Business API.
- [ExtendedClause](./ExtendedClause.md): Defines an optional filtering clause that is dynamically included in the query when a single MScript condition is met.
- [FuzzyDomainFilter](./FuzzyDomainFilter.md): Narrows a list API by a judgement no column holds, by classifying the DISTINCT VALUES of one column with a decision provider, never the rows (ADR binding point A).
- [GetOptions](./GetOptions.md): Options specific to `get`-type Business APIs for customizing how a single record is fetched.
- [ListJointFilter](./ListJointFilter.md): ListJointFilter definition object for a joint filter from the main object to another related data object to filter the main list result.
- [ListJointFilterSettings](./ListJointFilterSettings.md): The settings definition for a list api to define any joint filter and combine them with an AND or OR operator
- [ListMembershipFilter](./ListMembershipFilter.md): A settings object to add a membership filter to the WHERE clause of the list.
- [ListOptions](./ListOptions.md): Behavioral options for Business APIs of type `list`.
- [ListOrderSet](./ListOrderSet.md): One named row order a list api can switch to per request: the `key` a `listOrderSelector` request value is matched against, and the `sortBy` items that become the order when it matches.
- [ListPermissionFilter](./ListPermissionFilter.md): Permission-based filter that operate on list queries before execution.
- [ListRuntimeFilterSettings](./ListRuntimeFilterSettings.md): Per-list-API runtime filter behavior.
- [ListSearchFilter](./ListSearchFilter.md): Searches one or more records from the main data object and uses the id array in the where clause of the list.
- [PaginationOptions](./PaginationOptions.md): Defines how pagination is handled in list-type Business APIs.
- [SelectClauseSettings](./SelectClauseSettings.md): Defines which fields are included in the response of a Business API.
- [SelectJoin](./SelectJoin.md): Select join is a definition object for a join from the main object to another related data object to select additional properties from it.
- [SortByItem](./SortByItem.md): Sort clause configuration for list operations.
- [WhereClauseSettings](./WhereClauseSettings.md): Defines how records are filtered in a Business API.

### BusinessWorkflow

- [BusinessWorkflow](./BusinessWorkflow.md): Defines the execution flow milestones of a Business API.
- [CreateBusinessWorkflow](./CreateBusinessWorkflow.md): Defines the standard execution milestones for a `create`-type Business API.
- [DeleteBusinessWorkflow](./DeleteBusinessWorkflow.md): Defines the execution milestones for a `delete`-type Business API, which removes or soft-deletes a single record.
- [GetBusinessWorkflow](./GetBusinessWorkflow.md): Defines the execution milestones for a `get`-type Business API, which retrieves a single record.
- [ListBusinessWorkflow](./ListBusinessWorkflow.md): Defines the execution milestones for a `list`-type Business API, which returns a paginated set of records.
- [UpdateBusinessWorkflow](./UpdateBusinessWorkflow.md): Defines the execution milestones for an `update`-type Business API, used to modify an existing record.

## Domain: DataObject

[DataObject](./DataObject.md) and the families it contains.

### DataObject

- [DataObject](./DataObject.md): A DataObject is the core building block of a service in OpenAPPL.

### DataProperty

- [DataProperty](./DataProperty.md): The definition of a data property within a data object.
- [DecisionQuestion](./DecisionQuestion.md): One typed question inside a DecisionAction's bundle.
- [PropertyBasicSettings](./PropertyBasicSettings.md): Defines the core structure and behavior of a data property.
- [PropertyDecisionSource](./PropertyDecisionSource.md): Write-time classification of one DataProperty by a decision provider.
- [PropertyGraphEdge](./PropertyGraphEdge.md): Projects an FK-relation property as a graph edge (docs/ADR-graph-database-layer.md §4a).
- [PropertyIndexSettings](./PropertyIndexSettings.md): Index configuration for the data property across supported storage and caching layers.
- [PropertyRelation](./PropertyRelation.md): Defines the foreign-key relationship for this property to another data object.
- [PropertySessionSettings](./PropertySessionSettings.md): Defines how this property is populated from the session context when this block is populated.
- [PropertyStaticJoin](./PropertyStaticJoin.md): Static join settings define how this property's value is derived from another data object at the time of creation when this block is populated.
- [PropertyUploadSettings](./PropertyUploadSettings.md): Where the through-server upload of a RemoteBucket / NativeBucket takes a `{name}RemoteFile` twin column from.

### ObjectSettings

- [ObjectSettings](./ObjectSettings.md): Configuration settings that govern the behavior, access control, and optimization strategies of a data object.
- [Checkout](./Checkout.md): Provider-neutral one-time-payment activation for a DataObject.
- [CheckoutConfig](./CheckoutConfig.md): Configuration for provider-neutral one-time payments.
- [CompositeIndex](./CompositeIndex.md): Defines a composite index for a data object.
- [DefaultChoice](./DefaultChoice.md): A default row per scope for a data object (`objectSettings.defaultChoice`).
- [EnterpriseFieldMapItem](./EnterpriseFieldMapItem.md): One property↔field binding in an EnterpriseProjection.fieldMap (subsection).
- [EnterpriseProjection](./EnterpriseProjection.md): Projects a DataObject onto an EnterpriseObject (section, under objectSettings).
- [FiscalInternetSaleConfig](./FiscalInternetSaleConfig.md): Bindings sourcing the internet-sales content of a fiscal document from the owning DataObject.
- [Fiscalization](./Fiscalization.md): Regulatory fiscalization activation for a DataObject.
- [FiscalizationConfig](./FiscalizationConfig.md): Configuration for regulatory fiscalization on a DataObject.
- [FiscalLifecycleHook](./FiscalLifecycleHook.md): A designer-authored MScript handler fired by the fiscal dispatcher when the fiscal document state machine advances.
- [FiscalPartyConfig](./FiscalPartyConfig.md): Identity of one party (seller or buyer) on a fiscal document.
- [GraphEdgeEnd](./GraphEdgeEnd.md): One end of an edge-shaped projection (docs/ADR-graph-database-layer.md §4b).
- [GraphEdgeProjection](./GraphEdgeProjection.md): Projects each row of the owning DataObject as a graph relationship.
- [GraphProjection](./GraphProjection.md): Projects a DataObject into a graph database (docs/ADR-graph-database-layer.md §3/§4b/§5).
- [InteractionSource](./InteractionSource.md): A resolved descriptor of interaction records with known roles (recommendation ADR section 2).
- [InvoiceCollectionConfig](./InvoiceCollectionConfig.md): How finalized invoices on an invoicing-enabled DataObject are collected.
- [InvoiceLifecycleHook](./InvoiceLifecycleHook.md): A designer-authored MScript handler fired by the invoice dispatcher when the invoice state machine advances.
- [InvoiceLineRelation](./InvoiceLineRelation.md): How an invoicing-enabled object relates to its line item object (provider-neutral sibling of StripeOrderItemRelation).
- [InvoiceNumberingConfig](./InvoiceNumberingConfig.md): Invoice numbering configuration for an invoicing-enabled DataObject.
- [Invoicing](./Invoicing.md): Provider-neutral accounts-receivable invoicing activation for a DataObject.
- [InvoicingConfig](./InvoicingConfig.md): Configuration for provider-neutral accounts-receivable invoicing on a DataObject.
- [LedgerAdditionalProperties](./LedgerAdditionalProperties.md): Designer-declared extra columns on the generated satellite objects — full DataProperty declarations, relations included.
- [LedgerApiBinding](./LedgerApiBinding.md): Binding overrides for one generated ledger API.
- [LedgerBalance](./LedgerBalance.md): Defines the available, pending and reserved balances returned by getBalance.
- [LedgerConfig](./LedgerConfig.md): Configuration for the append-only ledger owned by each row of the decorated DataObject.
- [LedgerEntryMaturity](./LedgerEntryMaturity.md): Lot maturity.
- [LedgerEntrySource](./LedgerEntrySource.md): Configures the source-reference column and optional owner/source uniqueness of credited lots.
- [LedgerEvents](./LedgerEvents.md): Event emission for the ledger.
- [LedgerExpiry](./LedgerExpiry.md): Lot expiry sweep and pre-expiry reminders.
- [LedgerGeneratedApis](./LedgerGeneratedApis.md): Per-API bindings for the generated roster.
- [LedgerParties](./LedgerParties.md): Names of the generated party-reference columns on the movement rows: earn carries a SOURCE ref (what granted the value), consume/reserve carry a TARGET ref (what the value was spent on).
- [LedgerPartyRef](./LedgerPartyRef.md): Column names for one party side of a movement.
- [LedgerReservation](./LedgerReservation.md): Two-phase holds: reserve places a hold (available → reserved), commitReservation consumes it, releaseReservation returns it.
- [LedgerSettings](./LedgerSettings.md): Append-only-ledger activation for a DataObject.
- [LedgerUnit](./LedgerUnit.md): The ledger's unit of account.
- [LifecycleHook](./LifecycleHook.md): A designer-authored MScript handler fired by the payment dispatcher when a normalized payment event advances the state machine.
- [Marketplace](./Marketplace.md): Provider-neutral marketplace activation for a DataObject.
- [MarketplaceConfig](./MarketplaceConfig.md): Configuration for marketplace payouts on a DataObject.
- [MembershipRolePermission](./MembershipRolePermission.md): A single CONFIG-ONLY membership-role-to-permission binding (ADR-native-permission-system §9.3).
- [MembershipSettings](./MembershipSettings.md): Configuration settings for membership-based access control of a data object.
- [MembershipSettingsConfig](./MembershipSettingsConfig.md): Configuration settings for membership-based access control of a data object.
- [ObjectAuthorization](./ObjectAuthorization.md): Defines access control scope for this data object, including tenant scoping and public accessibility.
- [ObjectBasicSettings](./ObjectBasicSettings.md): Basic configuration for a data object, including its identity, documentation, and deletion strategy.
- [ObjectGeoSettings](./ObjectGeoSettings.md): Design-time settings for the /geo REST surface a data object's geo-typed properties generate.
- [PaymentResultMap](./PaymentResultMap.md): Defines how normalized payment outcomes (started, success, failed, canceled) map to internal order status values using MScript expressions.
- [PayoutGateConfig](./PayoutGateConfig.md): Invoice-gated payout release (the TR marketplace MERCHANT model's mutabakat step).
- [RecommendationApi](./RecommendationApi.md): Serving-route options of a recommendation list (recommendation ADR section 5.4).
- [RecommendationEvidence](./RecommendationEvidence.md): One evidence relation of a recommendation list (recommendation ADR section 3): the relation, the source that feeds it and its weight in an explicit blend.
- [RecommendationFilters](./RecommendationFilters.md): Deterministic serve-time filters of a recommendation list (recommendation ADR section 5.2).
- [RecommendationList](./RecommendationList.md): One recommendation list of an item object (recommendation ADR section 4).
- [RecommendationListPolicy](./RecommendationListPolicy.md): Diversity and dedupe rules of a recommendation list, applied to the filtered, ranked page.
- [RecommendationRerank](./RecommendationRerank.md): Optional decision-provider rerank of a recommendation list (recommendation ADR section 7).
- [RecommendationSettings](./RecommendationSettings.md): Recommendation lists of a data object as the ITEM being recommended (docs/ADR-recommendation-engine.md section 4).
- [RedisEntityCacheSettings](./RedisEntityCacheSettings.md): Configuration for Redis-based entity-level caching.
- [SellerOnboardingConfig](./SellerOnboardingConfig.md): Role-to-property map that lets the FRAMEWORK PROVISION a seller's connected sub-merchant account (level 2), instead of a designer hand-pasting a provider-side key into `sellerAccountProperty`.
- [SettlementGateConfig](./SettlementGateConfig.md): Invoice gate on the approve step of platformSettled settlement instructions (MarketplaceConfig.settlementGate).
- [SettlementReleaseConfig](./SettlementReleaseConfig.md): When a providerSplit marketplace sale's seller share is released (MarketplaceConfig.settlementRelease).
- [StripeOrderItemRelation](./StripeOrderItemRelation.md): Declares the local join between an order and its order items: item[orderItemLocalKey] matches order[orderForeignKey].
- [Subscription](./Subscription.md): Provider-neutral subscription activation for a DataObject.
- [SubscriptionConfig](./SubscriptionConfig.md): Configuration for recurring subscriptions on a DataObject.
- [VisitTracking](./VisitTracking.md): Object-level visit storage (docs/ADR-object-visits-pattern.md section 2.1): WHERE the visits of this object go.

## Standalone patterns

- [BusinessApiAction](./BusinessApiAction.md): Abstract base class for all Business API actions.
- [DataClauseSettings](./DataClauseSettings.md): Defines additional data values to be used in create or update operations.
- [DataObjectName](./DataObjectName.md): Represents a reference to a data object within the project.
- [LocalDataObjectName](./LocalDataObjectName.md): Represents a reference to a data object within the same service.
- [MScript](./MScript.md): Represents an OpenAPPL expression used for logic, validation, or configuration.
- [PropRefer](./PropRefer.md): Represents a reference to a property of a data object, optionally renaming it in the current context.
- [RemoteServiceAuthentication](./RemoteServiceAuthentication.md): Not available: AuthBasics carries this type only as a disabled slot, so no blueprint can enable it and nothing is generated from it.
- [RemoteServiceAuthenticationConfig](./RemoteServiceAuthenticationConfig.md): Not available: reachable only through the disabled RemoteServiceAuthentication slot of AuthBasics, so nothing is generated from it.
- [RemoteSession](./RemoteSession.md): Not available: AuthBasics carries this type only as a disabled slot, so no blueprint can enable it and nothing is generated from it.
- [RemoteSessionConfig](./RemoteSessionConfig.md): Not available: reachable only through the disabled RemoteSession slot of AuthBasics, so nothing is generated from it.
- [SimpleCheck](./SimpleCheck.md): Defines a lightweight conditional validation.
- [ViewLookup](./ViewLookup.md): Defines a lookup operation in a DataView, typically used to enrich an object with a human-readable label or translated text from a dictionary index.
