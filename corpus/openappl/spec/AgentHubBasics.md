# AgentHubBasics

**Level:** `section` · **Family:** [AgentHubSettings](../ontology/families.md#agenthubsettings) (domain `AgentHubConfig`)

**Ontology:** [AgentHubBasics in Part 1](../ontology/AgentHubBasics.md)

Core settings for the Agent Hub service including dynamic agent creation controls and tool discovery configuration.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `description` | `Text` | no | `"AI Agent Hub"` |  |  | Human-readable description of the Agent Hub service. |
| `frontendDocument` | `Text` | no |  |  |  | Module-level UX prompt for MindUI. Describes how the agent-chat surface should be presented (chat placement, agent personalities, tool-call visibility, history, streaming, dynamic-agent UX). MindUI reads this when generating agent pages; empty falls back to a basic chat list. |
| `enableDynamicAgents` | `Boolean` | no | `false` |  |  | When true, end-users with the appropriate roles can create, configure, and run their own AI agents at runtime. When false, only design-time agents defined in this configuration are available. |
| `dynamicAgentRoles` | `String`[] | no | `[]` |  |  | Roles allowed to create and manage dynamic agents at runtime. Default: empty, which means the platform operators of the project's tenancy - superAdmin and admin in a single-tenant project, superAdmin and saasAdmin in a multi-tenant project (a multi-tenant project has no role named admin; naming admin here is an ERROR there, except the old default [superAdmin, admin], which only warns). Add additional roles as needed (e.g., 'tenantOwner'). |
| `approvalRoles` | `String`[] | no | `[]` |  |  | Roles allowed to list and decide human-in-the-loop approvals — paused agent runs (approval-required tools and draft outputs) — via the hub approval API (/agent-runs/*) and, on nodejs, the same /agent-runs/* routes a business service mounts for the runs paused on its own agent routes. Default: empty, which means the platform operators of the project's tenancy - superAdmin and admin in a single-tenant project, superAdmin and saasAdmin in a multi-tenant project (a multi-tenant project has no role named admin; naming admin here is an ERROR there, except the old default [superAdmin, admin], which only warns). Machine callers (the M2M 'system' role) are NOT approvers by default; the nodejs runtime refuses a machine (M2M) session even when 'system' is listed here. |
| `maxDynamicAgents` | `Integer` | no | `50` |  |  | Declared runtime dynamic-agent limit, default 50. Node.js currently does not enforce creation admission against this value. Do not rely on it as a runtime bound. Enforcing the documented default requires an explicit compatibility and quota-population ruling. |
| `toolRefreshIntervalMinutes` | `Integer` | no | `5` |  |  | How often (in minutes) the hub re-discovers tools from project services. Tools can also be refreshed manually via the refresh API. Default: 5 minutes. |
| `httpPort` | `Integer` | no |  |  |  | The HTTP port the generated agentHub service listens on, like a normal service's serviceOptions.httpPort. Drives the hub's local dev port, its HTTP_PORT env and the SERVICE_AGENTHUB_URL sibling binding. Leave null for the platform defaults (deployed serviceOptions port 4003; local dev port 3006). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
