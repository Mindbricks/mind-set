# AgentEndpointSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentEndpointSettings in Part 2](../spec/AgentEndpointSettings.md)

Controls how the agent is exposed as an API endpoint. Each agent can have a REST endpoint (synchronous) and/or an SSE endpoint (streaming). Authentication requirements and path customization are configured here.

## Contained in

- [AIAgent](./AIAgent.md) as `endpointSettings`

Blueprint paths:

- `agentHub.aiAgents.endpointSettings`
- `services.aiAgents.endpointSettings`

## Contains

- `chatSurfaces`: [ChatSurfaceSettings](./ChatSurfaceSettings.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
