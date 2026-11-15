# AgentDecisionGate

**Level:** `subsection` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentDecisionGate in Part 2](../spec/AgentDecisionGate.md)

A calibrated decision gate over an agent's tool calls. Declared on `guardrails.decisionGate`, it asks the bound decision provider about each tool call BEFORE the tool runs, with the tool name and its arguments as the state. It answers the question an MScript `inputValidation` cannot: is this particular call about to do damage. The gate runs after the static `toolSettings.approvalRequiredTools` check, so a call that would pause for approval anyway never costs a provider request, and before the tool registry's own guest and role guards; a denied call returns a typed refusal to the model loop rather than aborting the run. It is NOT an authorization check - it judges the ACTION, never the caller's right to act, and the verdict never reaches a permissionCheck.

## Contained in

- [AgentGuardrails](./AgentGuardrails.md) as `decisionGate`

## Contains

- `questions`: [DecisionQuestion](./DecisionQuestion.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
