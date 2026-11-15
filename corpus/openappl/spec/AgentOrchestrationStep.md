# AgentOrchestrationStep

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentOrchestrationStep in Part 1](../ontology/AgentOrchestrationStep.md)

**Name:** an instance is named by `name`.

Defines a single step in an orchestrator agent's workflow. Each step invokes a sub-agent with mapped input and captures its output. Steps can be conditional and can run in parallel with other steps.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique step identifier within the orchestration workflow. Used in logging, progress events, and result references. |
| `agentName` | `String` | yes |  |  |  | Name of the sub-agent to invoke for this step. Either a local agent name (an AIAgent of the same service / the agent hub — checked against the declared agents at design time) or 'serviceName:agentName' for CROSS-SERVICE delegation: the step is dispatched over the signed inter-service path (x-m2m-token) to that service's /agents/<agentName> route, with the supervisor's originKey forwarded so retries stay idempotent. |
| `inputMapping` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression that prepares the input for the sub-agent. Has access to 'this.request' (original request) and 'stepResults' (outputs from previously completed steps). Example: `{ "js": "{ message: stepResults.research.summary }" }`. |
| `outputMapping` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression that transforms the sub-agent's output before storing it in stepResults. Has access to 'result' (the sub-agent's raw response). Example: `{ "js": "result.choices[0].message.content" }`. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluated before executing this step. The step is skipped if it evaluates to false. Has access to 'stepResults'. Example: `{ "js": "stepResults.triage?.needsReview === true" }`. |
| `parallel` | `Boolean` | no | `false` |  |  | When true, this step can run concurrently with other parallel steps. Sequential steps wait for all preceding parallel steps to complete before running. |

## Constraints

Property rules:

- `name`, `agentName` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INVALID_STEP_AGENT_REF` | error | "…" is not a valid step target. |
| `UNKNOWN_AGENT_NAME` | warning | Cross-service step targets agent "…" on service "…", which is not declared anywhere in the project. |
| `UNKNOWN_SERVICE_NAME` | warning | Cross-service step targets service "…", which is not declared in the project. |
