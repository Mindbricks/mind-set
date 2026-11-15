# AgentOrchestrationSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentOrchestrationSettings in Part 2](../spec/AgentOrchestrationSettings.md)

Multi-agent orchestration configuration for orchestrator-mode agents. Defines the execution strategy and the steps to coordinate. Only applicable when executionMode is 'orchestrator'. Steps dispatch as durable, idempotent child runs — see AIAgent.orchestrationSettings.

## Contained in

- [AIAgent](./AIAgent.md) as `orchestrationSettings`

Blueprint paths:

- `agentHub.aiAgents.orchestrationSettings`
- `services.aiAgents.orchestrationSettings`

## Contains

- `orchestrationSteps`: [AgentOrchestrationStep](./AgentOrchestrationStep.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
