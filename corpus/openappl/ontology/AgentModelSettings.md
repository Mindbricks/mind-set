# AgentModelSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentModelSettings in Part 2](../spec/AgentModelSettings.md)

AI provider and model configuration for the agent. Defines which LLM or generative model to use, its parameters, and optional dynamic system prompt sources that inject contextual data into the system message at runtime.

## Contained in

- [AIAgent](./AIAgent.md) as `modelSettings`

Blueprint paths:

- `agentHub.aiAgents.modelSettings`
- `services.aiAgents.modelSettings`

## Contains

- `systemPromptSources`: [AgentContextSource](./AgentContextSource.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
