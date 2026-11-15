# AgentEvalSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentEvalSettings in Part 1](../ontology/AgentEvalSettings.md)

Declarable evaluation suite for the agent. Cases are executed by the hub's role-gated eval runner (POST /agents/{name}/eval — same approver roles as the human-in-the-loop API): each case runs the agent for real and reports pass/fail per case plus suite totals. Each case is charged to the calling approver's tenant, so the runner requires the agent to declare guardrails.dailyCostCeilingUsd (the per-tenant daily spend bound): without it the route answers 409 AGENT_EVAL_COST_CEILING_REQUIRED before any provider call, and design time warns AGENT_EVAL_WITHOUT_COST_CEILING.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `evalCases` | [`AgentEvalCase`](./AgentEvalCase.md)[] | no |  |  |  | The evaluation cases of this agent's suite. Each is executed as a REAL agent run (source 'eval', durable run row, normal guardrails/budgets apply) by the hub eval runner. |

## Constraints

Property rules:

- The items of `evalCases` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
