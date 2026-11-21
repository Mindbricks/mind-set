---
title: AgentCallAction
---

# AgentCallAction

Invokes a configured AI agent from inside a Business API workflow. The agent is referenced by name and dispatched local-first: it runs in-process when the calling service deploys it, otherwise on the `agentHub` service.

`AgentCallAction` is the structured counterpart to [`AiCallAction`](./ai-call-action.md). `AiCallAction` is one-shot prompt-in / completion-out; `AgentCallAction` invokes a declared **agent** with its own tool set, system prompt, and policy.

## When to use it

- Call a multi-step agent (with tools, system prompt, memory) from a workflow without inlining all of its plumbing.
- Re-use a project-wide agent declared in `agentHub.aiAgents` across multiple services.
- Compose deterministic actions with non-deterministic agent steps in the same workflow: `agentCall` writes the agent's result onto context so downstream actions can inspect it.
- When you just need to fill a string completion or extract JSON from a single prompt, use [`AiCallAction`](./ai-call-action.md) instead.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `agentName` | `String` | yes | The `agentBasics.name` of an agent defined under `agentHub.aiAgents` (recommended) or in the service's own `aiAgents` array. |
| `inputData` | `MScript` | no | Expression that builds the agent's request body from the current context (`this`, `this.data`, `this.session`, prior action results). If omitted, the agent receives an empty object `{}`. |

## Behaviour

1. Evaluate `inputData` (an empty object `{}` when it is omitted).
2. Dispatch, local-first. The compiler decides the target from the blueprint:
   - **Local**: the calling service's own agent layer deploys the agent: it is in the service's `aiAgents`, or it is an `agentHub.aiAgents` entry whose `agentBasics.assignedService` names the calling service. The agent runs in-process with the caller's request id and `Authorization` header (so forwarded-user tool calls keep the caller's identity), under the identity the agent's REST route or the hub route would give the same caller: a caller keeps its user session only when that session is exactly the one the request's `Authorization: Bearer <token>` header alone resolves to - the bearer must be the very token the session was resolved from - because the route only ever sees that forwarded header. Every other caller - a cron or internal controller, a public API, a Kafka-triggered API whose session is the event payload's `actor` (a user identity taken from event data never becomes the agent's session), a user whose session came from a query `access_token`, a cookie or a codename header, or one whose header carries a different token, `Bearer null`, an empty bearer or another scheme - runs under the system session (`roleId: 'system'`) minted from the calling service's own M2M identity, subject to that service's `allowedM2MClients` / `blockedM2MClients` lists, exactly as the route mints it from the service token. In a multi-tenant project that system session runs in the CALLER's tenant: it carries the caller session's tenant under the project's tenant field (`<tenantName>Id`) and `tenantId`, so a Kafka-triggered API of tenant B runs its agent, the run row and the agent's in-process api and CRUD tools in tenant B, never in the root tenant. A tool argument naming another tenant does not change it: the session tenant wins. A caller with no tenant (a cron or internal controller, a root or cross-tenant system job) gets the tenant-less system session, which runs as the root tenant. The one exception is the route's own: an agent with `endpointSettings.authRequired: false` and a REST route at `/agents/<name>` never resolves a machine identity, so a sessionless caller runs it as a guest (public tools only) on both routes. No inter-service hop is needed and no agent hub address has to be configured; a project without an `agentHub` service can call its service-local agents.
     A Kafka-triggered agent run follows the same rule: its listener runs the agent under the minted system session, never the event author's. On both paths the user identity that did not become the session is kept as data only: the local run receives the caller's user identity attributes (`userId`, `roleId`, `roles`, tenant) as `onBehalfOf` (`guardrails.inputValidation` reads `this.onBehalfOf`, tools `ctx.onBehalfOf`) and inputValidation sees `this.source === 'internal'`; the run is budgeted as the system session it runs under.
     One deliberate difference from the hub route: the caller-list check is the CALLING service's own (the lists its agent REST route applies), not the `agentHub` service's. So when the `agentHub` service blocks the calling service but the calling service admits itself, a hub agent assigned to the calling service runs locally under the calling service's system session, where the hub route would have left the caller a guest (or answered 401 for an auth-required agent).
   - **AgentHub**: any other agent. The action POSTs to `/agents/<agentName>` on the `agentHub` service with a signed M2M token, forwarding the caller's bearer when there is one. The token carries the caller session's tenant as its signed `callerTenantId` claim; when the receiving route mints a system session from the token (no bearer it resolves to a user), that session runs in the claim's tenant, the same session the local route mints for the same caller. The route reads the tenant only from the verified token, never from a header or the request body; a token without the claim mints the tenant-less session. The transport timeout is the agent's `guardrails.timeout` (default 120 s) plus a 15 s margin.
   - The `agentHub` service's own `AgentCallAction`s use the HTTP route. Its wildcard route applies the hub runtime control plane (agent overrides, disabled agents) to agents without their own REST route at that path. An agent's own REST route is registered first and handles that path directly. The exception is an agent the hub deploys that has no `rest` surface (a declared `endpointSettings.surfaces[]` without `rest`, or `hasRestEndpoint: false` with no declared list): the wildcard refuses it with `404`, so the hub runs it in-process, as the local path above does. An agent disabled through an agent override is still refused there.
3. Return the agent's response and store it on `this.<contextPropertyName>` (when set), or write it to the response when `writeToResponse` is true. A run paused for human approval returns the paused-run handle (`__agentRunPaused`, `runId`, `pendingApproval`) on both routes.

Provider wiring, tool registration, system prompts, and policy live on the agent definition itself (see [AI agents](../system-services/agent-hub.md)). This page does not document them; `AgentCallAction` is purely a workflow invocation.

## Example

Given an agent named `documentSummarizer` declared under `agentHub.aiAgents`:

```json
{
  "name": "summarizeReport",
  "writeToResponse": false,
  "contextPropertyName": "summary",
  "agentName": "documentSummarizer",
  "inputData": { "js": "({ text: this.report.body, language: this.session.preferredLanguage })" }
}
```

A later action can use the result:

```json
{
  "name": "emailSummary",
  "writeToResponse": false,
  "to": { "js": "this.report.recipient" },
  "subject": { "js": "'Report summary'" },
  "body": { "js": "this.summary.text" }
}
```

## Errors

- An `agentName` the calling service does not deploy goes to the hub; with no `agentHub` service configured that call fails with `[InterService] no URL configured for service "agentHub"`. Declare the agent in the calling service (or assign the hub agent to it) to run it locally.
- A hub call that outlives its timeout throws, naming the orphaned hub-side run (the hub still completes it and records it in `sys_agentExecution`).
- An agent without a `rest` surface - one that declares `endpointSettings.surfaces[]` without `rest`, or sets `hasRestEndpoint: false` with no declared list - is still callable from this action. The surfaces govern public exposure: the hub's `POST /agents/<agentName>` answers `404` for such an agent to a user or anonymous caller, but this action's call carries a verified service token (`x-m2m-token`), and a conforming agent hub runs any blueprint agent for a verified caller its caller lists admit. A token that cannot be verified yet answers the retryable `503`, which the client retries once. The `agentHub` service's own calls to an agent it deploys run in-process. An agent hub that does not run such an agent for a verified service caller still refuses the call with `404` (it reaches the caller as the generic hub failure below); validation warns about it (`AGENT_CALL_SURFACE_NOT_REST`): add `rest` to the agent's surfaces (or set `hasRestEndpoint` back to `true`), assign the agent to the calling service so the call runs in-process, or use an agent hub that runs it.
- An agent or AI-provider failure answers the API caller the same way on both routes: a generic `500 INTERNAL_ERROR`. The agent runtime's own status (a `422` input validation, a `429` budget denial, a `504` timeout) and a provider's status and error text are never reflected to the caller; the full error is logged server-side under the request id.
- `inputData`, when set, is compiled MScript. Validation errors surface at build time.
- Provider failures inside the agent propagate per the agent's own configuration; on the workflow side, use `onActionError: "completeApi"` to inspect them via `this.<actionName>Error`.

## See also

- [`AiCallAction`](./ai-call-action.md): single-shot LLM call
- [`IteratorAction`](./iterator-action.md): streaming async-iterable producer
- [AI agents](../system-services/agent-hub.md)
- [AI providers](../providers/ai.md)
