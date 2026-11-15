# AIAgent

**Level:** `chapter` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AIAgent in Part 2](../spec/AIAgent.md)

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

## Contained in

- [AgentHubConfig](./AgentHubConfig.md) as `aiAgents` (a list)
- [Service](./Service.md) as `aiAgents` (a list)

Blueprint paths:

- `agentHub.aiAgents`
- `services.aiAgents`

## Contains

- `agentBasics`: [AgentBasics](./AgentBasics.md)
- `modelSettings`: [AgentModelSettings](./AgentModelSettings.md)
- `inputSettings`: [AgentInputSettings](./AgentInputSettings.md)
- `outputSettings`: [AgentOutputSettings](./AgentOutputSettings.md)
- `toolSettings`: [AgentToolSettings](./AgentToolSettings.md)
- `chatSettings`: [AgentChatSettings](./AgentChatSettings.md)
- `orchestrationSettings`: [AgentOrchestrationSettings](./AgentOrchestrationSettings.md)
- `imageSettings`: [AgentImageSettings](./AgentImageSettings.md)
- `audioSettings`: [AgentAudioSettings](./AgentAudioSettings.md)
- `videoSettings`: [AgentVideoSettings](./AgentVideoSettings.md)
- `customEndpoint`: [AgentCustomEndpoint](./AgentCustomEndpoint.md)
- `endpointSettings`: [AgentEndpointSettings](./AgentEndpointSettings.md)
- `guardrails`: [AgentGuardrails](./AgentGuardrails.md)
- `evalSettings`: [AgentEvalSettings](./AgentEvalSettings.md)
- `kafkaControllers`: [AgentKafkaController](./AgentKafkaController.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
