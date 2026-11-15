# AgentKafkaController

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentKafkaController in Part 2](../spec/AgentKafkaController.md)

Defines a Kafka-triggered controller for the AI agent. When enabled, a KafkaListener is created that subscribes to the specified topic. Incoming messages are mapped to the agent's request format using the dataMapping expression, then the agent is executed under a minted SYSTEM session (roleId 'system', userId 'system:kafka:<agent>.<controller>', in the event's tenant). The event author (the envelope actor) is never the run's session and the run is not charged to the author's dailyTokenBudgetPerUser; the author is kept as onBehalfOf data (guardrails.inputValidation this.onBehalfOf, tool handlers' ctx.onBehalfOf, request.onBehalfOf). A controller can decline events that are not its own - an optional condition that evaluates falsy, or a declared dataMapping that returns null - and a declined event is skipped (no run, no retry, no dead-letter). Optionally, the agent's response can be published to a response topic. Multiple controllers can be defined per agent for different topics with different data mappings.

## Contained in

- [AIAgent](./AIAgent.md) as `kafkaControllers` (a list)

Blueprint paths:

- `agentHub.aiAgents.kafkaControllers`
- `services.aiAgents.kafkaControllers`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
