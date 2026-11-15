# AgentOrchestrationSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentOrchestrationSettings in Part 1](../ontology/AgentOrchestrationSettings.md)

Multi-agent orchestration configuration for orchestrator-mode agents. Defines the execution strategy and the steps to coordinate. Only applicable when executionMode is 'orchestrator'. Steps dispatch as durable, idempotent child runs — see AIAgent.orchestrationSettings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `strategy` | `AgentOrchestrationStrategy` | yes |  | `sequential`, `parallel`, `adaptive` |  | How steps are executed: 'sequential' runs steps in declaration order (consecutive steps marked parallel form a concurrent group), 'parallel' runs every step concurrently, 'adaptive' exposes each step as a run_step_<name> tool to the orchestrator's own model, which plans/delegates/collates within maxIterations. |
| `maxIterations` | `Integer` | no | `10` |  | min 1 | Safety limit for the orchestrator: in 'adaptive' mode the maximum provider turns of the planner loop; in sequential/parallel mode the maximum total step dispatches. Default: 10. |
| `completionCondition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluated after each completed step (adaptive: after each tool turn). The orchestrator stops early and collates when this evaluates to true. Has access to 'stepResults' (all completed step outputs). Example: `{ "js": "stepResults.validation?.approved === true" }`. |
| `orchestrationSteps` | [`AgentOrchestrationStep`](./AgentOrchestrationStep.md)[] | no |  |  |  | The sequence of steps the orchestrator executes. Each step invokes a sub-agent with mapped input, captures its output, and optionally runs conditionally or in parallel with other steps. |

## Constraints

Property rules:

- `strategy` must be present. (`REQUIRED_FIELD_MISSING`)
- `strategy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `maxIterations` must be at least 1. (`VALUE_OUT_OF_RANGE`)
- The items of `orchestrationSteps` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
