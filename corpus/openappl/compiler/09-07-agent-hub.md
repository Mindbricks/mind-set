---
title: Agent hub
---

# 9.7 Agent hub

The `agentHub` section of the project declares AI agents: model-backed workers that
answer requests, call tools (the project's own APIs among them) and stream their work.

## Activation

The compiler **MUST** generate a service named `agentHub` when the hub declares at least
one agent, enables dynamic agents, or enables a harness. An agent whose
`agentBasics.assignedService` names a business service is also served by that service.

## Per-agent routes

Each agent is served under its base path, `/agents/<agentName>` by default
(`endpointSettings.basePath`):

| Route | Answer |
|---|---|
| `POST <basePath>` | **200** `{ success, data }`; **202** `{ success, paused: true, runId, runState: "paused_approval", pendingApproval }` when a tool call waits for approval |
| `POST <basePath>/stream` | a server-sent event stream (below) |
| `GET <basePath>/runs/:runId` | the caller's own run; another caller's run or an unknown id: **404** `AGENT_RUN_NOT_FOUND` |
| `GET\|DELETE <basePath>/conversations…` | chat history, for chat agents that store it |

- Endpoints require a session (or a machine token) unless `endpointSettings.authRequired`
  is `false`.
- Errors are problem documents ([chapter 5](05-business-apis.md#56-error-body)).

**Stream frames** (`event: <name>`, JSON `data`): `run { runId, agentName, sessionId }`
first; then `token { content }`, `tool_start { name, id }`, `tool_result { name, id, result }`,
`step_start`, `step_result`, `step_skipped`, `progress`, `validation`,
`paused { runId, runState, pendingApproval }`, `done { content }`,
`error { message, code, retryable? }`; and always `complete {}` last. Refusals before the
stream opens are ordinary problem responses. A client disconnect **MUST NOT** cancel the
run.

> **To verify:** that the `run` frame is sent first on every reference target (documented
> for the primary one).

## Hub service routes

`GET /agents` (catalogue), `POST /agents/:agentName`, `POST /agents/:agentName/stream`,
`GET /tools`, and the approval routes `GET /agent-runs/pending`,
`POST /agent-runs/:runId/approve`, `POST /agent-runs/:runId/reject`,
`POST /agent-runs/:runId/resume`. Every agent-serving service also exposes run logs:
`GET /agent-runs`, `GET /agent-runs/:runId`, `GET /agent-runs/:runId/events`.

> Generated table goes here (S9): the agent route catalogue.

## Tools

Tools are opted in per agent (`toolSettings`): data-object tools per declared scope, the
project's business APIs by name (with their real parameter schema and their normal
authorization), machine calls, other agents, library functions and custom tools.

- A tool call **MUST** run with the identity of the run (the caller, or the system
  identity of an event-triggered run) and pass the called API's own gates.
- Tools listed as approval-required, or judged so by a decision gate, pause the run until
  an approver acts.
- The number of tool calls per run is bounded by the agent's guardrails.

## Data objects

`sys_agentExecution` (one per run: agent, caller, tenant, masked input, output, tool
calls, token usage, duration, `status`, `runState`, parent and root run ids),
`sys_agentRunEvent`, `sys_agentConversation`, `sys_agentMessage`, `sys_toolCatalog`,
`sys_agentOverride`, and `sys_dynamicAgent` when dynamic agents are enabled.

## Events

- Every completed run publishes `<serviceCodename>-agent-<agentName>-result`, with
  secrets redacted.
- An agent's `kafkaControllers[]` subscribe it to topics; each message starts a run as
  a system identity, with the message mapped to the agent's input. Failing runs are
  retried, then dead-lettered to `<topic>.dlq`.

## Providers

AI providers are declared in `projectSettings.aiProvidersSettings`. There is no fallback:
a run whose provider has no credentials fails at call time
([chapter 10](10-configuration-and-secrets.md#103-missing-provider-credentials)).
