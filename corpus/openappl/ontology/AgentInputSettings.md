# AgentInputSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentInputSettings in Part 2](../spec/AgentInputSettings.md)

Defines how incoming request data is transformed into the agent's prompt or input. Includes the prompt template (an MScript expression that builds the user message from request body, params, and context), file upload support for vision/audio agents, and dynamic context sources that fetch additional data to enrich the prompt. The legacy autoResize/autoConvert flags were removed (never consumed by any generator) — the migrator drops them from old blueprints.

## Contained in

- [AIAgent](./AIAgent.md) as `inputSettings`

Blueprint paths:

- `agentHub.aiAgents.inputSettings`
- `services.aiAgents.inputSettings`

## Contains

- `contextSources`: [AgentContextSource](./AgentContextSource.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
