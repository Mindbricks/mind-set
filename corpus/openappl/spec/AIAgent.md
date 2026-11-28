# AIAgent

**Level:** `chapter` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AIAgent in Part 1](../ontology/AIAgent.md)

**Name:** an instance is named by `agentBasics.name`.

Defines a standalone AI agent at the service level. Each agent encapsulates a model configuration, system prompt, input/output pipeline, optional tool access, and conversation management. Agents support multiple execution modes (task, chat, orchestrator) and modalities (text, image, audio, video, vision). They are exposed as dedicated REST and/or SSE endpoints and can be invoked by other agents as tools.

### Field support matrix

Every AIAgent field is either WIRED into the generated runtime or was REMOVED from the schema — no field validates-and-no-ops.

| Field | Status |
| --- | --- |
| agentBasics (name, description, modality, executionMode task/chat/orchestrator) | wired |
| agentBasics.executionMode = 'orchestrator' | wired (supervisor/worker orchestration driven by orchestrationSettings: sequential/parallel step pipelines and an adaptive planner loop; steps are durable child runs) |
| modelSettings (providerName, model, systemPrompt, temperature, maxTokens) | wired |
| modelSettings.responseFormat = 'json' | wired on EVERY provider family (native JSON/structured mode where available, prompt-based emulation + repair loop elsewhere) |
| modelSettings.responseSchema, strictOutput | wired (schema-validated structured output with bounded repair loop) |
| modelSettings.fallbackProviders | wired (retry with backoff, then fall down the declared provider chain) |
| modelSettings.toolChoice, parallelToolCalls | wired (mapped to each provider's native tool-choice control) |
| modelSettings.reasoningEffort | wired (sent as reasoning_effort to OpenAI-family reasoning models; on Anthropic models it switches thinking on and sets its effort or budget, unset = thinking off; ignored by other providers) |
| modelSettings.contextWindowTokens | wired (context-compaction trigger override) |
| modelSettings.systemPromptSources | wired (fetched into the system message as named context segments; cached per chatSettings.refreshSystemPrompt + per-source cacheTtlSeconds; fetch failures are fail-soft) |
| inputSettings.promptTemplate, acceptsUpload, maxFiles | wired (uploads reach the model as image/document content blocks on vision-capable providers) |
| inputSettings.contextSources | wired (fetched per run; variables bind into promptTemplate — without a template they append as a context block on the user message; fetch failures are fail-soft) |
| inputSettings.autoResize / autoConvert | removed (auto-migrated off existing blueprints) |
| outputSettings.responseProperty, postProcess | wired |
| outputSettings.requiresApproval | wired (draft-then-approve: the final output is held as a draft in the 'paused_approval' run state until an approver releases or rejects it via the hub approval API) |
| outputSettings.storeTo | removed (auto-migrated off existing blueprints) |
| toolSettings (enableCrudTools, crudScopes, apiTools, agentTools, libraryTools, customTools, integrationTools) | wired; list entries are existence-checked at design time |
| toolSettings.approvalRequiredTools | wired (human-in-the-loop: the run pauses BEFORE the tool fires; the hub approval API approves — the run resumes through its tool journal — or rejects with a clean rejection tool_result) |
| chatSettings.historyStorage, maxHistoryMessages | wired |
| chatSettings.summarizeAfter, pinnedRecentMessages | wired (context compaction: sliding window or recursive summarization with a pinned recent window) |
| chatSettings.refreshSystemPrompt | wired (per-turn re-evaluation vs once-per-instance caching of the whole system message pipeline, dynamic systemPromptSources included) |
| orchestrationSettings (strategy, maxIterations, completionCondition, orchestrationSteps incl. cross-service 'service:agent' steps) | wired (durable supervisor/worker graph: steps dispatch as child runs keyed by originKey — idempotent retries; a paused/failed child pauses/fails the parent coherently) |
| imageSettings / audioSettings / videoSettings | wired |
| customEndpoint | wired (legacy direct-endpoint binding; prefer a 'custom'-type project AI provider) |
| endpointSettings (REST/SSE/basePath/authRequired/chatSurfaces) | wired |
| guardrails.maxToolCalls, maxFileSizeMb, timeout, allowedMimeTypes, maxAgentDepth | wired |
| guardrails.maxTokenBudget, maxToolResultChars | wired (cumulative token budget from provider usage feedback; tool-result truncation) |
| guardrails.inputValidation, outputValidation | wired (MScript gates: input rejection is a clean 4xx-style error before any provider call; output failure repairs once in strict mode, else annotates) |
| guardrails.dailyTokenBudgetPerUser, dailyCostCeilingUsd | wired (per-user/day token and per-tenant/day USD ceilings enforced before every provider call — deny-before-checkpoint; cost from the model price table, run records carry tokenUsage.costUsd) |
| guardrails.logPreviewChars, logMaskFields | wired (configurable redaction of the tool-call audit trail; default 0 = metadata/sizes only — the WS2 posture) |
| evalSettings.evalCases | wired (declared eval suite; executed by the hub's role-gated POST /agents/:agentName/eval runner, which requires guardrails.dailyCostCeilingUsd) |
| kafkaControllers (name, topic, groupId, dataMapping, enabled) | wired |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `approvalExpiryDays` | `Integer` | no |  |  |  | Agent-level approval expiry in days, shared by approvalRequiredTools and requiresApproval. Null or unset on stored agents disables expiry; newly created agents start at 30 days through the new-instance defaults registry only. A configured value must be a positive safe integer number. Implemented for Node.js, Rust, .NET and Java: every deployment host, including assignedService, must emit the sweep or validation refuses it. Pauses older than the window become terminal expired without executing tools or releasing drafts. The independent hourly UTC sweep is claimed by one replica and bounded to 200 rows per page and 10 pages per agent per tick, with a cursor across ticks. Approve/reject of an expired run returns 410 AGENT_APPROVAL_EXPIRED; polling retains terminal metadata. Expired runs are eligible for conversation retention and user erasure. |
| `agentBasics` | [`AgentBasics`](./AgentBasics.md) | yes |  |  |  | Core identity and execution mode of the agent, including its name, description, modality, and how it processes requests. |
| `modelSettings` | [`AgentModelSettings`](./AgentModelSettings.md) | yes |  |  |  | AI provider and model configuration, including the system prompt and optional dynamic prompt sources that inject context into the system message. |
| `inputSettings` | [`AgentInputSettings`](./AgentInputSettings.md) | yes |  |  |  | Defines how incoming request data is transformed into the agent's prompt or input, including file upload support and dynamic context enrichment. |
| `outputSettings` | [`AgentOutputSettings`](./AgentOutputSettings.md) | no |  |  |  | Controls how the AI model's response is transformed before returning to the client. |
| `toolSettings` | [`AgentToolSettings`](./AgentToolSettings.md) | no |  |  |  | Configures which tools the agent can call during execution. Only applicable for text and vision modality agents. Includes CRUD tools, API tools, sub-agent tools, library function tools, and custom tool definitions. |
| `chatSettings` | [`AgentChatSettings`](./AgentChatSettings.md) | no |  |  |  | Conversation history management settings. Only applicable when executionMode is 'chat'. |
| `orchestrationSettings` | [`AgentOrchestrationSettings`](./AgentOrchestrationSettings.md) | no |  |  |  | Multi-agent orchestration configuration. Only applicable when executionMode is 'orchestrator'. Defines the execution strategy and the steps to coordinate. Steps run as DURABLE child runs (sub-agent executions keyed by '<supervisor-run-id>:<step-name>' — a crashed or re-driven supervisor never re-executes a completed step) under the ORIGINAL caller's identity (per-step scoped permissions); a paused child (human-in-the-loop) pauses the supervisor, a failed child fails it. |
| `imageSettings` | [`AgentImageSettings`](./AgentImageSettings.md) | no |  |  |  | Image generation parameters. Only applicable when modality is 'image'. |
| `audioSettings` | [`AgentAudioSettings`](./AgentAudioSettings.md) | no |  |  |  | Audio generation or transcription parameters. Only applicable when modality is 'audio'. |
| `videoSettings` | [`AgentVideoSettings`](./AgentVideoSettings.md) | no |  |  |  | Video generation parameters. Only applicable when modality is 'video'. |
| `customEndpoint` | [`AgentCustomEndpoint`](./AgentCustomEndpoint.md) | no |  |  |  | Custom provider endpoint configuration — binds the agent directly to an OpenAI/Anthropic-compatible endpoint when no project-level AI provider is referenced. Ignored when modelSettings.providerName is set (declare a 'custom'-type provider in projectSettings.aiProvidersSettings.aiProviders[] instead). Every agent must have either modelSettings.providerName or this customEndpoint. |
| `endpointSettings` | [`AgentEndpointSettings`](./AgentEndpointSettings.md) | yes |  |  |  | Controls how the agent is exposed as an API endpoint, including REST/SSE toggles, path customization, and authentication. |
| `guardrails` | [`AgentGuardrails`](./AgentGuardrails.md) | no |  |  |  | Safety limits and cost controls including token budgets, timeouts, file size limits, and input/output validation. |
| `evalSettings` | [`AgentEvalSettings`](./AgentEvalSettings.md) | no |  |  |  | Declarable evaluation suite for the agent: named prompt/assertion cases executed on demand by the hub's role-gated eval runner (POST /agents/{name}/eval). Each case runs the agent for real (a normal durable run with source 'eval') and passes/fails on expectedContains and/or an MScript assertion. The runner requires guardrails.dailyCostCeilingUsd on the agent: without it the suite is refused with 409 AGENT_EVAL_COST_CEILING_REQUIRED. |
| `kafkaControllers` | [`AgentKafkaController`](./AgentKafkaController.md)[] | no |  |  |  | Kafka-triggered controllers for the agent. Each controller listens on a Kafka topic and maps the incoming message payload to the agent's input format before executing the agent. Multiple controllers can be defined for different topics with different data mappings. |

## Constraints

Property rules:

- `agentBasics`, `modelSettings`, `inputSettings`, `endpointSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `kafkaControllers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_API_TOOL_NOT_ON_HOST_SERVICE` | warning | … of … apiTools target BusinessApis outside this agent's host service, …, with no REST controller: …. |
| `AGENT_APPROVAL_EXPIRY_INVALID` | error | approvalExpiryDays must be null/unset or a positive safe integer number of days. |
| `AGENT_APPROVAL_EXPIRY_LANGUAGE_NOT_SUPPORTED` | error | approvalExpiryDays is implemented for … and … only for now: … (…) generates for …, which does not emit the approval expiry sweep. |
| `AGENT_CALLBACK_NOT_INSTRUCTED` | warning | Agent "…" is kafka-triggered (fire-and-forget — no caller receives its output) and declares custom tool… … as its effect channel, but the prompt text mentions none of them — the model is never instructed to invoke the … |
| `AGENT_CHAT_MANY_API_TOOLS_NO_DELEGATION` | warning | Chat agent declares … apiTools and no toolSettings.agentTools. |
| `AGENT_COMPLETION_CONDITION_INEFFECTIVE` | warning | completionCondition with strategy 'parallel' only evaluates AFTER the single all-steps group settles — it cannot stop steps early. |
| `AGENT_CUSTOM_ENDPOINT_IGNORED` | warning | customEndpoint is ignored when modelSettings.providerName is set — the project-level provider wins. |
| `AGENT_FIELD_DISCARDED` | warning | outputSettings.responseProperty "…" is not a top-level property of the responseSchema (…) — the unwrap resolves to undefined and the whole structured output is discarded. |
| `AGENT_ORCHESTRATION_STEPS_MISSING` | warning | executionMode is 'orchestrator' but no orchestrationSettings.orchestrationSteps are declared — the agent has no workers to supervise and will execute as a plain task. |
| `AGENT_ORPHAN` | warning | Agent "…" has no design-time caller or schedule: no enabled kafkaControllers, no declared surfaces, no chat bindings, and nothing references it by agentName (agentCallActions / orchestrationSteps / videoRoom … |
| `AGENT_PROMPT_ENUM_MISSING` | warning | responseSchema field "…" restricts output to an enum, but the prompt text never mentions … … — the model cannot reliably emit a vocabulary it was never shown. |
| `AGENT_PROMPT_PARAM_MISSING` | warning | Agent "…" maps input field… … from kafka controller "…", but the prompt text never mentions … — the model receives data it was never told about. |
| `AGENT_PROMPT_TEMPLATE_BARE_IDENTIFIER` | warning | inputSettings.promptTemplate is the single bare word "…". |
| `AGENT_PROVIDER_BINDING_MISSING` | error | Agent has no provider binding. |
| `AGENT_REQUIRED_TOOL_NOT_REGISTERED` | error | requiredToolCalls entry "…" does not match any tool registered by this agent's toolSettings — the runtime journal can never contain a successful call to it, so EVERY run of this agent would end failed with … |
| `AGENT_RESPONSE_SCHEMA_EMPTY` | warning | Agent "…" declares a responseSchema with no properties ('{}' or an object schema with nothing in it). |
| `AGENT_RESPONSE_SCHEMA_FORMAT_MISMATCH` | warning | responseSchema is declared but responseFormat is '…'. |
| `AGENT_RESPONSE_SCHEMA_TOO_COMPLEX` | warning | Agent "…" has a responseSchema with …, above anthropic's documented structured-output limits; the provider is likely to refuse it as too complex to compile. |
| `AGENT_SECTION_INAPPLICABLE` | warning | … is declared but … — the generator ignores this section. |
| `AGENT_SURFACE_FLAG_CONTRADICTION` | warning | Surface '…' is declared but endpointSettings.… is false — the declaration wins and the endpoint IS emitted. |
| `AGENT_SURFACE_NOT_DECLARED` | warning | The agent binds a … chatSurfaces[] entry but surfaces[] does not declare '…' — the binding is suppressed (no webhook/handler is generated). |
| `AGENT_SURFACE_PREREQUISITE_MISSING` | error | Surface '…' is declared but its prerequisite is missing — … |
| `AGENT_TOOL_CHOICE_WITHOUT_TOOLS` | warning | toolChoice '…' is set but the agent has no usable tool surface (toolSettings …) — the control has nothing to act on. |
| `VALUE_OUT_OF_RANGE` | error | temperature must be <= 1 for provider "…" (provider=… accepts 0.0-1.0). |

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `assignedService` | moved | `agentBasics.assignedService` | Write the value at the new path. |
