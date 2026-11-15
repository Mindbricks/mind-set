# AgentBasics

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentBasics in Part 1](../ontology/AgentBasics.md)

Core identity, execution mode and service placement of the AI agent. The name serves as the asset identifier and is used in endpoint paths, inter-agent references, and code generation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique agent name within the service. Used in endpoint paths (/agents/{name}), inter-agent tool references, and generated code file names. Must be camelCase. |
| `description` | `Text` | yes |  |  |  | Human-readable description of what this agent does. Used in documentation, MCP tool descriptions, and the design UI. |
| `executionMode` | `AgentExecutionMode` | yes |  | `task`, `chat`, `orchestrator` |  | How the agent processes requests: 'task' for one-shot execution, 'chat' for multi-turn conversations with history, 'orchestrator' for coordinating multiple sub-agents. |
| `modality` | `AgentModality` | yes |  | `text`, `vision`, `image`, `audio`, `video` |  | The primary input/output modality: 'text' for text generation with tool calling, 'vision' for text+image input, 'image'/'audio'/'video' for media generation. |
| `assignedService` | `String` | no |  |  |  | Service assignment for a project-level agentHub agent (agentHub.aiAgents). When set to a service name, this hub agent ALSO fans out into that service's agent-layer — it is generated there exactly like a service-local aiAgents entry and can be referenced hub-wide (e.g. by a videoRooms[].meetingAgents[].agentName). Null (default) keeps the agent hub-only. Ignored on service-level aiAgents. |

## Constraints

Property rules:

- `name`, `description`, `executionMode`, `modality` must be present. (`REQUIRED_FIELD_MISSING`)
- `executionMode`, `modality` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
