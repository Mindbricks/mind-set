# AgentVideoSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentVideoSettings in Part 2](../spec/AgentVideoSettings.md)

Video generation parameters. Only applicable when modality is 'video'. Video generation is typically asynchronous — the agent polls for completion and streams progress events via SSE.

## Contained in

- [AIAgent](./AIAgent.md) as `videoSettings`

Blueprint paths:

- `agentHub.aiAgents.videoSettings`
- `services.aiAgents.videoSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
