# AgentToolSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentToolSettings in Part 2](../spec/AgentToolSettings.md)

Configures which tools the agent can invoke during its execution loop. Only applicable for text and vision modality agents. Tools follow the OpenAI/Anthropic function calling convention. The agent's tool-calling loop continues until the model stops requesting tools or the maxToolCalls guardrail is hit.

## Contained in

- [AIAgent](./AIAgent.md) as `toolSettings`

Blueprint paths:

- `agentHub.aiAgents.toolSettings`
- `services.aiAgents.toolSettings`

## Contains

- `customTools`: [AgentCustomTool](./AgentCustomTool.md), a list
- `integrationTools`: [AgentIntegrationToolConfig](./AgentIntegrationToolConfig.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
