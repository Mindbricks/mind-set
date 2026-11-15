# DecisionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [DecisionAction in Part 2](../spec/DecisionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Asks a calibrated decision provider typed questions about a piece of state and writes the typed answers into the workflow context. They land under `this.decisions.<actionName>.<questionName>` as { value, confidence, probabilities, model }. Sits between ValidationAction (an MScript boolean) and AiCallAction (a full LLM call): it answers the judgements MScript cannot express without paying for text generation, at ~250-400 ms and free output tokens. It NEVER makes an authorization decision - a calibrated probability has no rationale and cannot be audited or explained, so DECISION_ON_AUTHZ_SURFACE refuses a decision standing in for permissionCheck, membershipCheck, objectPermissionCheck or an absoluteRoles bypass. See docs/ADR-decision-layer-system-one.md.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `decisionActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.decisionActions`
- `services.businessLogic.actions.decisionActions`

## Contains

- `questions`: [DecisionQuestion](./DecisionQuestion.md), a list
- `cache`: [DecisionCacheSettings](./DecisionCacheSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
