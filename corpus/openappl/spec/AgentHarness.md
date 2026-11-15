# AgentHarness

**Level:** `chapter` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarness in Part 1](../ontology/AgentHarness.md)

**Name:** an instance is named by `harnessBasics.name`.

An agent harness hosted by agentHub: a long-running, autonomous agent run by an open-source harness runtime (docs/ADR-agent-harness.md). It works from skills, documents and scripts, keeps a private working directory, calls the project's tools over MCP and can be extended with runtime-native plugins. agentHub drives the runtime over the Agent Client Protocol (ACP); the emitted harness runner system service starts one sandboxed process per session (bubblewrap/nsjail, no host environment, CPU/memory/time limits). The workspace is one directory per (tenant, user, harness), shared by that user's sessions and never by two users; Kafka-triggered sessions use `/<tenant>/_system/<harnessName>/`. The model key never enters the sandbox: the harness reaches its model through the runner's model gateway, which adds the key from the agentHub AI provider entry and enforces the cost ceilings. Every tool call runs as the session owner: the user's own bearer for a frontend session; for a Kafka-triggered one, the agentHub M2M service identity in the event's tenant, so a triggered session calls only the harness's m2mTools. Clients start, follow and cancel sessions through agentHub's /harnesses and /harness-sessions APIs only.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `harnessBasics` | [`AgentHarnessBasics`](./AgentHarnessBasics.md) | yes |  |  |  | Identity of the harness: name, description, runtime and whether it is enabled. |
| `modelSettings` | [`AgentHarnessModelSettings`](./AgentHarnessModelSettings.md) | yes |  |  |  | The model the harness runs on: an agentHub AI provider entry and a model id. The provider's API shape must be one the runtime speaks. |
| `assets` | [`AgentHarnessAssets`](./AgentHarnessAssets.md) | no |  |  |  | The skills, documents and scripts copied read-only into every session's harness home. Each is a path in the agentHub service files under `harness/<name>/skills/`, `harness/<name>/docs/` or `harness/<name>/scripts/`. |
| `plugins` | [`AgentHarnessPlugin`](./AgentHarnessPlugin.md)[] | no |  |  |  | Runtime-native plugins installed into this harness's profile when the runner image is built, never per user or per request. Each entry is pinned to one exact version and comes from a source the runtime allows. |
| `toolSettings` | [`AgentHarnessToolSettings`](./AgentHarnessToolSettings.md) | no |  |  |  | The project tools the harness may call, served to it by the per-session MCP endpoint and executed as the session owner. Same tool selection vocabulary as AIAgent.toolSettings (apiTools, m2mTools, agentTools, approvalRequiredTools), plus the platform web tools. |
| `networkSettings` | [`AgentHarnessNetworkSettings`](./AgentHarnessNetworkSettings.md) | no |  |  |  | Outbound network policy of the sandboxed process: open (the default) or limited to listed hosts. |
| `sessionSettings` | [`AgentHarnessSessionSettings`](./AgentHarnessSessionSettings.md) | no |  |  |  | Who may start sessions from a frontend and the per-user session, idle and workspace retention limits. |
| `triggers` | [`AgentHarnessTrigger`](./AgentHarnessTrigger.md)[] | no |  |  |  | Kafka triggers that start a background session of this harness when a matching event arrives. A triggered session runs as the agentHub M2M service identity in the event's tenant: it sees only the harness's M2M tools (m2mTools on M2MAllowed apis) and the web tools, and it is visible to admins. |
| `guardrails` | [`AgentGuardrails`](./AgentGuardrails.md) | no |  |  |  | Turn guardrails, reusing AgentGuardrails. The harness runner and agentHub enforce timeout (the wall-clock limit of one prompt turn, in ms), maxToolCalls (per prompt turn), dailyCostCeilingUsd and costCeilingScope (the same CostGovernor ceilings agents use). Only authored values count: an unset timeout is 30 minutes (1800000 ms) and an unset maxToolCalls is 200, never the AgentGuardrails defaults of 2 minutes and 25 calls, which are sized for one in-process agent request. A stored value equal to one of those AgentGuardrails defaults (120000, 25) is read as unset, because a design tool writes the defaults into a new guardrails section; author any other value to set a limit. A turn past timeout ends the session timed_out; one past maxToolCalls ends it failed. The other AgentGuardrails fields belong to the in-process agent runtime and are not applied to a harness (warning AGENT_HARNESS_GUARDRAIL_NOT_APPLIED). |

## Constraints

Property rules:

- `harnessBasics`, `modelSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `plugins` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `triggers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
