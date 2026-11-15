# AgentGuardrails

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentGuardrails in Part 2](../spec/AgentGuardrails.md)

Safety limits and cost controls for the agent. Prevents runaway costs, excessive tool usage, and enforces input/output validation. These limits are enforced at runtime by the agent execution loop.

## Contained in

- [AgentHarness](./AgentHarness.md) as `guardrails`
- [AIAgent](./AIAgent.md) as `guardrails`

Blueprint paths:

- `agentHub.aiAgents.guardrails`
- `agentHub.harnesses.guardrails`
- `services.aiAgents.guardrails`

## Contains

- `decisionGate`: [AgentDecisionGate](./AgentDecisionGate.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
