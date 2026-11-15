# AgentHubConfig

**Level:** `module` · **Family:** [AgentHubConfig](../ontology/families.md#agenthubconfig)

**Ontology:** [AgentHubConfig in Part 1](../ontology/AgentHubConfig.md)

Configuration for the AgentHub service — a centralized AI agent management platform. The hub hosts design-time agents (with runtime reconfiguration), discovers tools from all project services, and optionally allows end-users to create and manage their own agents at runtime.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hubSettings` | [`AgentHubSettings`](./AgentHubSettings.md) | no |  |  |  | Hub settings chapter: the hub's core configuration (dynamic agent creation, tool discovery) and the tool sources the hub discovers tools from. |
| `aiAgents` | [`AIAgent`](./AIAgent.md)[] | no |  |  |  | The hub-hosted AI agents. Same `AIAgent` pattern as service-level agents; hub agents can use tools discovered from any project service and support runtime reconfiguration. |
| `harnesses` | [`AgentHarness`](./AgentHarness.md)[] | no |  |  |  | The hub-hosted agent harnesses (`AgentHarness`, docs/ADR-agent-harness.md): long-running, autonomous, skill-driven agents run by an open-source harness runtime (DeepSeek Harness `dsh` by default, `goose`, `codex`, `claude-code`, or `opencode`) that agentHub drives over the Agent Client Protocol. Each harness carries its own skills, documents and scripts, runtime-native plugins, the project tools it may call, its network and session limits, and optional Kafka triggers. A project with at least one enabled harness gets a harness runner system service; clients still talk only to agentHub. Harness names are unique within the hub. Harnesses are nodejs only (ADR D7): a project whose agentHub generates for another language is refused with AGENT_HARNESS_LANGUAGE_NOT_SUPPORTED. |
| `serviceFiles` | [`ServiceFiles`](./ServiceFiles.md) | no |  |  |  | Design-time static files of the agentHub service (an optional singular chapter, `ServiceFiles`, the same shape as `service.serviceFiles`). AgentHarness assets live here: every `harnesses[].assets.skills\|documents\|scripts` entry must name a file of this manifest, or a folder holding at least one (a skill is a folder with a SKILL.md), under `harness/<harnessName>/skills\|docs\|scripts/`. Upload each file with the `uploadServiceFile` tool and serviceName `agentHub`; keep harness assets private (a public file is served by the agentHub at `/service-files/<path>`). The build writes the files to `service-files/<visibility>/<path>` of the agentHub repo, and the harness runner copies a harness's declared assets from that tree, read-only, into each session. A private file is NOT secret: never put credentials in one. Null/absent when the hub carries no files. |

## Constraints

Property rules:

- The items of `aiAgents` must have distinct names (`agentBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `harnesses` must have distinct names (`harnessBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_HUB_INVALID_MAX_AGENTS` | error | Maximum dynamic agents must be at least 1. |
| `AGENT_HUB_INVALID_REFRESH_INTERVAL` | error | Tool refresh interval must be at least 1 minute. |
| `AGENT_HUB_REDUNDANT_TOOL_SOURCES` | warning | Tool source '*' (all services) is defined alongside specific services. |
