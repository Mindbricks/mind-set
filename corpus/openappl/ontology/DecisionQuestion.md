# DecisionQuestion

**Level:** `subsection` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [DecisionQuestion in Part 2](../spec/DecisionQuestion.md)

One typed question inside a DecisionAction's bundle. Every question in a request is judged in parallel against the same state, so adding a question is nearly free - ask for everything the workflow needs about this state in one action rather than splitting it.

## Contained in

- [AgentDecisionGate](./AgentDecisionGate.md) as `questions` (a list)
- [CleaningClassifySettings](./CleaningClassifySettings.md) as `question`
- [DecisionAction](./DecisionAction.md) as `questions` (a list)
- [PropertyDecisionSource](./PropertyDecisionSource.md) as `question`

## Contains

- `criteria`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
