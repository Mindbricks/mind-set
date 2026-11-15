# AgentEvalSettings

**Level:** `section` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentEvalSettings in Part 2](../spec/AgentEvalSettings.md)

Declarable evaluation suite for the agent. Cases are executed by the hub's role-gated eval runner (POST /agents/{name}/eval — same approver roles as the human-in-the-loop API): each case runs the agent for real and reports pass/fail per case plus suite totals. Each case is charged to the calling approver's tenant, so the runner requires the agent to declare guardrails.dailyCostCeilingUsd (the per-tenant daily spend bound): without it the route answers 409 AGENT_EVAL_COST_CEILING_REQUIRED before any provider call, and design time warns AGENT_EVAL_WITHOUT_COST_CEILING.

## Contained in

- [AIAgent](./AIAgent.md) as `evalSettings`

Blueprint paths:

- `agentHub.aiAgents.evalSettings`
- `services.aiAgents.evalSettings`

## Contains

- `evalCases`: [AgentEvalCase](./AgentEvalCase.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
