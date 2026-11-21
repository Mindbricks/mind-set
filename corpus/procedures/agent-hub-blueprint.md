# AgentHub module authoring — core procedure

Harness-agnostic. Every step names the blueprint path it reads or edits. Extracted
from the Ada corpus (#4400); provenance and translation notes in
`../README.md`. Companion to `blueprint-authoring.md` — its tool semantics
(section 3), authoring loop (section 9), MScript descriptor rule, and
result discipline apply here unchanged. This guide covers only what is
DIFFERENT about the AgentHub module.

**Task shape.** You are given the project's `agent-hub-spec` (the design
document `design/agent-hub-spec.md`, written in the design phase) and the current blueprint
state. You author the `agentHub` module — hub settings, tool sources, and
the AI agents — validate clean, and prove completeness against the spec.

**Lifecycle position: Phase 4, independent** (`project-lifecycle.md`) —
no dependency on the bff/notifications pair; runs in parallel with them,
after the domain services exist (agents reference their APIs and data
objects). Gated by `hasAgentHub` in `project-basic-setup`.

## 1. What AgentHub is

A project-level AI agent service — a dedicated microservice hosting
general-purpose agents accessible across services and directly by clients.
It sits alongside `authentication`, `bffService` and `notificationService`
at the project root.

- **All AI agents in a project belong here.** Agents live under
  `agentHub/aiAgents/<AgentName>`, NEVER under `services/<svc>/aiAgents` —
  that per-service chapter exists only for legacy backward compatibility.
  (`blueprint-authoring.md` section 2 carries the same rule for domain
  authoring.)
- **The hub auto-activates when the first agent is authored.** There is no
  enable flag for the hub itself.
- **`enableDynamicAgents` is NOT the hub's on/off switch.** It governs
  RUNTIME user-created agents (persisted in the `sys_dynamicAgent` table,
  authored by end users through the generated UI, gated by
  `dynamicAgentRoles`; empty = the tenancy's platform operators, i.e.
  `superAdmin` / `saasAdmin` in a multi-tenant project, which has no role
  named `admin` - #5701). Leave it `false` unless user-authored AI
  assistants are part of the product's value proposition; never set it
  "to enable the hub".

### Structural map — how it differs from the generic service shape

Top-level pattern `AgentHubConfig` — two chapters:

| Blueprint path | Pattern | What it holds |
|---|---|---|
| `agentHub/hubSettings/hubBasics` | `AgentHubBasics` | `description`, `frontendDocument`, `enableDynamicAgents`, `dynamicAgentRoles`, `maxDynamicAgents`, `toolRefreshIntervalMinutes` |
| `agentHub/hubSettings/toolSources/<serviceName>` | `AgentHubToolSource` | which services' BusinessApis are exposed as callable tools — `serviceName` (or `"*"`), `includeApis`, `excludeApis` |
| `agentHub/aiAgents/<AgentName>` | `AIAgent` | one named item per agent, composed of the sections below |

Auto-generated system objects are never authored: `sys_agentOverride`,
`sys_dynamicAgent`, `sys_agentExecution`, `sys_toolCatalog`,
`sys_agentConversation` — codegen emits them when the hub builds. The
generated service builds under the system service name **`agentHub`**.

## 2. Agent composition — canonical sections and field names

Each agent is ONE named item with keyed sections. Exact section and field
names matter — invented names are silently ignored
(`blueprint-authoring.md` section 4); when unsure,
the pattern page `openappl/spec/AIAgent.md` and the sub-pattern pages are
cheaper than a retry.

- **`agentBasics`** — `name` (camelCase), `description`, `executionMode`
  (`task` | `chat` | `orchestrator`), `modality` (`text` default),
  `assignedService` (nullable; a hub agent assigned to a service also
  fans out into that service's agent layer). `assignedService` lives
  INSIDE `agentBasics` — at the agent root it is refused.
- **`modelSettings`** — `providerName`, `model`, `systemPrompt`,
  `temperature`, `maxTokens` (plus `responseFormat`,
  `systemPromptSources` when needed). **`providerName` references a
  project-level AI provider by codename** — it must match an entry in
  `projectSettings/aiProvidersSettings` (`aiProviders[].name`, bound in
  Phase 1); a missing provider entry is a Phase 1 gap to surface, not a
  string to invent. Copy `systemPrompt` from the spec VERBATIM — never
  shorten it. Keep temperature low (0.0-0.3) for deterministic workflow
  agents. Do not hardcode stale model snapshots; use the model the spec
  or the provider entry designates, preferring the provider's current
  generation.
- **`inputSettings`** — `promptTemplate` (MScript, NOT Handlebars: a
  descriptor like `{ "js": "\`Analyze orders for
  ${this.request.body.merchantId}\`" }` — `{{var}}` syntax does not
  work), `contextSources`, `acceptsUpload`, `maxFiles`.
- **`toolSettings`** — `enableCrudTools`, `crudScopes`, `apiTools`,
  `agentTools`, `libraryTools`, `customTools`, `integrationTools`. The
  list-valued fields are **comma-separated strings, not arrays**:
  `apiTools: "getOrder,listOrders"`.
- **`chatSettings`** — chat mode only: `historyStorage` (`"memory"` |
  `"database"` — the field is NOT `storageType`), `maxHistoryMessages`,
  optional `summarizeAfter`, `refreshSystemPrompt`,
  `maxToolResultCharsInHistory`, `retentionDays`. `retentionDays` (days,
  >= 1; unset = keep forever, no default) makes a periodic sweep
  hard-delete conversations idle longer than the window, with their
  messages and runs; it needs `historyStorage: "database"` and a nodejs
  agentHub for now (validation refuses it otherwise). Set it only when the
  spec asks for a retention period. Users can list and delete their own
  conversations of a database-history agent whether or not it is set.
- **`endpointSettings`** — `hasRestEndpoint`, `hasSseEndpoint`,
  `authRequired`, `basePath`. They govern PUBLIC exposure: an agent only
  other services call (through an `AgentCallAction`) can set
  `hasRestEndpoint: false` and stays callable by them on a nodejs agentHub
  (the call carries a verified service token). There is NO `checkRoles` /
  `loginRequired` / `hasStreamEndpoint` here — role gating goes through
  `guardrails.inputValidation` (below).
- **`guardrails`** — `maxTokenBudget` (a SINGLE combined budget — a spec
  giving separate input/output caps sums into it; reaching it after the
  first model turn FINISHES the run with a partial result
  `{ truncated: true, truncatedReason: 'tokenBudget', partial, tokenBudget }`
  instead of failing it), `maxToolCalls`, `maxToolResultChars`,
  `elideToolResultsAfter`, `elideToolResultsOverChars`,
  `maxFileSizeMb`, `timeout` (ms), `inputValidation`, `outputValidation`,
  `allowedMimeTypes`. NOT `maxInputTokens` / `maxOutputTokens` /
  `maxExecutionsPerMinute`.
- **`kafkaControllers`** — event-triggered agents: `name`, `topic`,
  optional `condition`, `dataMapping`, `enabled` (see section 3).

**Role gating on agent endpoints.** Endpoints support only the boolean
`authRequired`. To gate by role, put an MScript check in
`guardrails.inputValidation` — return `true` to allow, any string to
reject with that message:
`{ "js": "['admin', 'superAdmin'].includes(this.session.roleId) || 'Forbidden — admin role required'" }`.
Use role VALUES that actually exist — the built-ins plus
`authentication/accessControl/roleSettings` `roleItems[].value` — never
invent.

## 3. Design rules

- **Tool sources are selective.** Start with read APIs (`list*`, `get*`);
  add write APIs only where an agent's purpose requires them; exclude
  destructive / admin-only APIs explicitly.
- **Verify every referenced API exists** in the service's routes as the
  blueprint defines them (`openappl/compiler/05-business-apis.md` derives
  them) before naming it in `apiTools`
  or exposing its service in `toolSources`. A service with no APIs gets
  no toolSources entry and no apiTools references — record the gap in
  your report so a later change request can add the tools when that
  service's design lands.
- **Do not duplicate the platform assistant.** The `mcpbff` transform
  service already provides a general-purpose chat assistant over the
  project's APIs — design agents that add SPECIFIC business value (a
  domain-intelligence task agent, a workflow/orchestrator agent), per the
  spec's agent list.
- **Orchestrator agents** declare their sub-agents in
  `toolSettings.agentTools`; every named sub-agent must itself exist
  under `agentHub/aiAgents`.
- **Keep chat agents' token use flat.** Every provider call of a run
  re-sends the whole conversation, every earlier tool result included, so
  a chat agent that does bulk work (read 100 records, update each) in one
  context grows its input superlinearly; the runtime logs
  `AgentRunInputGrowth` when it happens. Design against it:
  - **Delegate bulk work.** The chat agent plans; a task worker agent named
    in its `toolSettings.agentTools` does the bulk part. The worker runs as
    `invoke_agent_<name>({ message })` in a FRESH context under the caller's
    own session, and only its answer comes back. Validation warns
    (`AGENT_CHAT_MANY_API_TOOLS_NO_DELEGATION`) on a chat agent with 8 or more
    `apiTools` and no `agentTools`.
  - **Set `chatSettings.summarizeAfter`** (for example `40`) on chat agents
    with tool loops. The default `0` only drops the oldest messages once the
    model window is nearly full.
  - **Elide old tool results:** `guardrails.elideToolResultsAfter` (keep the
    newest N results whole, stub the older ones) and/or
    `elideToolResultsOverChars` (stub only the large ones), and
    `chatSettings.maxToolResultCharsInHistory` (cap tool results in the
    stored history, for example `4000`). All three are off by default.
  - **Bound the run:** `guardrails.maxTokenBudget` finishes a runaway run
    with a partial answer; `maxToolResultChars` (default 16000) caps one
    result.
  - **Compact list APIs.** A list API an agent calls should be paged and
    return few columns (a dedicated index API whose
    `selectClause.selectProperties` names them beats the full record list).
- **Kafka-triggered agents:** `dataMapping` is evaluated with `message`
  bound to the FULL published event envelope, not the bare record. For
  API/DB events the record sits under its data-object name — reach fields
  as `message.<dataObjectName>.<field>` (`message.review.comment`), never
  `message.<field>` (that reads the envelope, silently yields
  `undefined`, and the agent sees empty input). Derive topic names from the
  blueprint and the event-bus rules (`openappl/compiler/07-event-bus.md`);
  when the shape is uncertain, write a sample envelope from those rules and
  check that every mapped field resolves in it rather than to `undefined`.

## 4. Write order (sharded)

Scaffold-then-fill: derive the inventory from the spec first (hub basics,
one toolSources entry per exposed service, the agent list with each
agent's sections), then author one named item at a time. Run
`mindset validate blueprint.json` after each write and resolve every
error before moving on.

1. **`agentHub/hubSettings/hubBasics`**: merge in `description`,
   `enableDynamicAgents` (with `dynamicAgentRoles` / `maxDynamicAgents`
   only when true), `toolRefreshIntervalMinutes`, and the
   `frontendDocument` (section 5).
2. **Each tool source: ONE complete edit at
   `agentHub/hubSettings/toolSources/<serviceName>`**: `{ serviceName,
   includeApis, excludeApis? }`.
3. **Each agent: ONE bundled edit at
   `agentHub/aiAgents/<AgentName>`** with ALL of its sections in the same
   payload (named-item semantics — send each agent complete; omit unused
   sections entirely, no empty placeholders).

## 5. Document UX intent (`frontendDocument`)

Unlike the other modules, the field lives ON the hub-basics section:
`agentHub/hubSettings/hubBasics/frontendDocument` (there is no separate
`documentation` section). Write 5-10 sentences the frontend generation
reads for the agent UI: chat surface placement (dedicated page, embedded
panel, slide-out), per-agent identity (named agents with avatars vs a
single assistant), tool-call visibility (stepwise, collapsed, hidden),
history model (persistent per-user, ephemeral, threaded), streaming
expectation, and — only when `enableDynamicAgents` is true — how end
users author new agents.

## 6. Validate, build, gate

1. Validate the module (`mindset validate blueprint.json`, then an OpenAPPL
   validation tool or compiler when one is available) and drive `agentHub` to zero errors.
2. Building the system service **`agentHub`** and checking its health
   happen on the hosting platform, outside this procedure.
3. **Machine completeness gate:** diff the spec inventory (every agent
   with its mode/tools/endpoints, every tool source) against the live
   state (`agentHub` in `blueprint.json`). Every spec agent must exist;
   every extra must be intentional; every skipped tool reference must be
   a recorded gap.
4. Report: agents written (mode + tool surface each), tool sources,
   dynamic-agents decision, cross-service gaps (services whose APIs were
   intended as tools but do not exist yet), provider-binding gaps routed
   to Phase 1, validation status.
