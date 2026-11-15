# AgentOutputSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentOutputSettings in Part 2](../spec/AgentOutputSettings.md)

Controls how the AI model's response is transformed before returning to the client. Supports extracting a specific property from JSON responses and applying post-processing transformations. The legacy storeTo field (bucket persistence of generated media) was removed — never consumed by any generator; the migrator drops it from old blueprints.

## Contained in

- [AIAgent](./AIAgent.md) as `outputSettings`

Blueprint paths:

- `agentHub.aiAgents.outputSettings`
- `services.aiAgents.outputSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
