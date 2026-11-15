# Writer guide: agent-hub-spec

The design of the project's AI layer: the final roster of AI agents hosted by
the agent hub, a project-level service beside auth, the BFF and
notifications. The agent-hub blueprint procedure
(`procedures/agent-hub-blueprint.md`) transcribes it. Owed when `hasAgentHub` is
on; written after every service spec, in parallel with the notification
definitions.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-basic-setup` (AI providers under `## Providers`, flags),
  `prd`, `use-cases`, `microservice-definitions` (the `## AI Agents` DRAFT
  roster, the Event Contracts table).
- Supplementary: every service spec (`service-spec-*`) - their
  `## AI Agent Needs` revisions; the project codename (the blueprint's
  `codename`).
- Canon: `procedures/design/canon/event-envelope.md`,
  `procedures/design/canon/capability-map.md` (the two homes of AI).

**Reconcile, do not transcribe.** The msd sketched the agents early as a
draft; each service spec then honored or DELIBERATELY REVISED its part. You
produce the authoritative reconciliation: one agent per real need across all
services. The service-spec contracts win for names, payloads and topics. You
MAY merge near-duplicate needs into one shared agent or split an overloaded
one, stating the rationale. A draft agent no service still needs is dropped
(note it); a need the draft missed is added.

**Filter first - not every AI need is an agent.** The hub is for AGENTIC AI:
agents that call tools or other services' APIs, read live cross-service
state, reason over several steps, collaborate, or improve over a feedback
loop. A need that is a one-shot, tool-free, stateless transform of an input
the calling API already holds is an in-service `AiCallAction`, not an agent:
note it under `## Open Questions` as "should be an in-service AiCallAction in
<service>.<api>" and build no agent for it.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `agent-hub-spec` in `procedures/design/pipeline.json`; write
each exactly as given. The per-agent H2 sections between them are named after
each agent.

- `## Hub Settings`
- `## Notification Needs`
- `## BFF DataView Needs`
- `## Open Questions`

## Document skeleton

```markdown
# Agent Hub Spec

## Hub Settings
## <AgentName>        <- one H2 per agent, repeated
## Notification Needs
## BFF DataView Needs
## Open Questions
```

## The only two integration patterns

- **event:** the agent has a kafka controller consuming the DERIVED topic of
  the triggering API and DELIVERS its result by calling the service's declared
  M2M callback Business API as a tool. `toolSources` includes that service, and
  the guardrails PERMIT that call (never "must not modify anything" for an
  agent whose contract IS a callback write - scope it to "only the designated
  callback API").
- **call:** a Business API invokes the agent via `agentCallActions` and waits;
  the agent returns its output; no kafka controller, no callback tool.

Agents can NOT publish Kafka events: never spec a response topic. **Event is
the default**; a service that declared `call` without a real in-request
dependency on the result is flagged as a design concern.

Hard rules for event agents:

- **Topic** - the derived, lowercase string from the Event Contracts table
  (event-envelope canon section 3); lowercase it if the table is wrong and
  note the discrepancy.
- **No feedback loops** - never subscribe to a topic produced (only or mostly)
  by the API that applies the agent's own decisions (`comment-updated` when
  the only publisher is the agent's own applier creates an endless
  re-processing cycle). Subscribe to USER-action topics. Content moderation
  on a DataObject write does not reach this rule at all: `objectModeration`
  decides synchronously inside the write request, through the bound decision
  provider - there is no applier event and no agent in that loop (see
  `## <AgentName>` below for the pattern's OWN agent, the `escalateTo`
  analysis step). This rule is for the standalone-moderation EXCEPTION
  (`microservice-definitions.md`, "Moderation") and for any other
  event-pattern agent that writes back to the object it read.
- **Decision literals are EXACT enum strings** - the values the agent outputs
  are the callback parameter's enum strings as the service spec declares them
  (passive forms: `approved`, `rejected`, `escalated`), never imperative
  variants.
- **Data mapping** - an agent kafka controller WITH a data mapping reads the
  envelope, so its paths are `data.<key>` (event-envelope canon section 1).

## Per-agent contract

```markdown
## <AgentName>
- **purpose:** <what it does, in business terms>
- **pattern:** event | call
- **executionMode:** task | chat | orchestrator
- **modality:** text | vision | image | audio | video   (tool calling only for text/vision)
- **trigger:** event -> the raising service+API and the derived topic; call -> the calling service+API
- **result delivery:** event -> the exact M2M callback API (service:apiName); call -> in-workflow return
- **model:** provider NAME from the project's AI providers + model + fallbackProviders
- **output contract:** responseFormat (text|json|url|binary); for json the responseSchema fields with types and exact enum literals; strictOutput
- **prompt plan:** systemPrompt intent (2-4 sentences of WHAT it instructs) + promptTemplate input fields + contextSources (name, sourceType dataObject|libraryFunction|apiCall, what it fetches, cacheTtl)
- **kafka controller** (event only): topic, groupId, dataMapping intent
- **tool surface:** apiTools by exact API name; crudScopes per object (explicit opt-in); approvalRequiredTools; custom tools (name + params + handler library function)
- **inputs / outputs:** <payload fields consumed / result fields produced>
- **chat settings** (chat mode only): historyStorage (`database` for production, never `memory`), history limits, surfaces (rest/sse/telegram/whatsapp + identity strategy, auth decision for public widgets). A chat surface names a CHANNEL PROVIDER (`chatSurfaces[].provider`: a `kind: whatsapp` Meta Cloud or `kind: telegram` notification provider); the provider's kind is the surface type and it owns every credential, so one agent is reachable over WhatsApp and Telegram at once through two entries. Chat bots are retired. A whatsapp surface has no webhook: the provider's ONE door on the notification service (`/v1/whatsapp-webhooks/meta/<providerName>`) receives, never a per-agent path, app secret or verify token - one Meta number serves the agent and the notifications through that door; a telegram surface is a webhook of the host service verified with the provider's `telegramWebhookSecret`. A provider backs at most ONE conversational consumer (one agent surface or the mcpbff exposure)
- **orchestration** (orchestrator mode only): strategy (sequential|parallel|adaptive), steps, completion condition, maxIterations
- **guardrails:** maxToolCalls / timeout / maxAgentDepth + token and cost budgets (required for every user-facing agent); input/output validation - always permitting the declared callback
- **media handling:** for a moderation `escalateTo` analysis agent or the
  standalone-moderation exception, the media URL requirement or `text-only`
  (matching the Event Contracts row, when one exists)
- **evals:** 2-5 cases (input -> expected assertion)
```

Omit only the mode-scoped fields that do not apply (kafka controller for
call; chat settings for task agents; orchestration for non-orchestrators) -
every other field is required for every agent.

Worked example (shape, not content). This is `objectModeration`'s
`escalateTo` seam (`microservice-definitions.md`, "Moderation"): the pattern
makes the accept/reject/review DECISION itself, through the bound decision
provider, never through an agent; the agent below only WRITES THE REASON, and
only runs when `wantReason` is set and the verdict is `reject` or `review`:

```markdown
## ListingModerationAnalyst
- **purpose:** explain a listing's reject/review moderation verdict, once for
  the reviewer and once for the author
- **pattern:** call
- **executionMode:** task
- **modality:** text
- **trigger:** call -> marketplace:createListing / marketplace:updateListing
  (objectModeration's `escalateTo`, not a Business API `agentCallActions`
  the designer wrote)
- **result delivery:** call -> in-workflow return: a string (the analysis) or
  `{ analysis, userMessage }`; the engine persists it on the review row and
  never republishes it
- **model:** provider openaiMain - gpt-5-mini; fallbackProviders: [anthropicBackup]
- **output contract:** responseFormat json; responseSchema: analysis (Text,
  reviewer-only), userMessage (Text, shown to the author only when
  `userMessageMode: llm`); strictOutput: true
- **prompt plan:** systemPrompt instructs it to explain the SUPPLIED verdict
  against the supplied policy, in two registers - a reviewer-facing analysis
  and a plain author-facing message - and NEVER to change or re-derive the
  verdict; promptTemplate fields: snapshot, verdict, policy; contextSources:
  (none - the call already carries everything it needs)
- **tool surface:** apiTools: (none - an analysis agent writes text, it never
  decides or writes); crudScopes: (none); approvalRequiredTools: (none)
- **inputs / outputs:** consumes `{ snapshot, verdict, policy }` -> produces a
  string or `{ analysis, userMessage }`
- **guardrails:** maxToolCalls 0; timeout 20s; output validation refuses any
  attempt to emit a decision value - this agent writes reasons, never verdicts
- **media handling:** text-only, unless the moderated object's
  `moderatedProperties` carry a media URL, in which case this agent needs
  `vision` modality and the same URL
- **evals:** "policy-violating wording" -> an analysis citing the specific
  policy clause; "borderline, low confidence" -> an analysis naming the
  ambiguity rather than restating the verdict
```

**The exception** (`microservice-definitions.md`, "Moderation"): when a
standalone moderation service is actually justified, its decision-making
agent keeps the OLD shape this replaced - `pattern: event`, a kafka
controller on the content's creation topic, and `result delivery` an M2M
callback whose decision literals are exact enum strings (`approved` \|
`rejected` \| `escalated`, passive forms). Build that shape only for the
stated exception, never as the default moderation agent.

## `## Hub Settings`

```markdown
## Hub Settings
- **description:** <the hub's purpose>
- **enableDynamicAgents:** true/false - ON only if end users authoring their
  own runtime agents is part of the product (default false; not a hub switch)
- **dynamicAgentRoles:** <roles allowed to author runtime agents, if enabled>
- **maxDynamicAgents:** <cap, if enabled>
- **toolSources:** one line per service agents may call - service name +
  include/exclude API lists (least privilege; `*` only when justified)
- **approvalRoles:** <roles that resume runs paused on approvalRequiredTools -
  required whenever any agent lists one>
- **toolRefreshIntervalMinutes:** <default unless the requirements demand otherwise>
```

Do not design the generated system objects (agent executions, dynamic-agent
tables, the tool catalog, conversations).

## `## Notification Needs` / `## BFF DataView Needs`

```
- <event> -> <role(s)> - <why>          (notifications the hub's agents trigger)
- <ViewName> - <main object + joins> - <why>          (views an agent reads)
```

`- (none)` when empty. If the project genuinely needs no AI agents, say so
explicitly.

## Completeness check

1. Every service spec's `## AI Agent Needs` entry has a matching agent honoring
   its pattern, payload and callback API name exactly, or is filtered to an
   in-service `AiCallAction` with a note.
2. Every PRD-implied AI requirement no service declared is flagged as a gap,
   not silently adopted.
3. Every event agent: a lowercase Event Contracts topic on a USER-action topic,
   `toolSources` including the callback's service, guardrails permitting it.
4. Decision literals copied exactly from the callback parameter (passive
   forms); no agent publishes events.
5. Every model line names a project AI provider with fallbacks; no
   credentials anywhere.
6. Chat agents state their history storage; user-facing agents have token AND
   cost budgets; every agent has 2-5 evals; moderation agents state media
   handling.
7. Hub Settings: least-privilege tool sources; approval roles when any
   approval-required tool exists; dynamic agents off unless the product needs
   them.
8. Every unresolved item is under `## Open Questions` marked `OPEN`.

## Output

Write the document to `design/agent-hub-spec.md` (writer contract section 4).
