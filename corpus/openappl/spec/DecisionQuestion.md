# DecisionQuestion

**Level:** `subsection` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [DecisionQuestion in Part 1](../ontology/DecisionQuestion.md)

**Name:** an instance is named by `name`.

One typed question inside a DecisionAction's bundle. Every question in a request is judged in parallel against the same state, so adding a question is nearly free - ask for everything the workflow needs about this state in one action rather than splitting it.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Question identifier within the action, and the key the answer is written under in the context: `this.decisions.<actionName>.<name>`. Must be a valid codeName. |
| `type` | `DecisionQuestionType` | yes |  | `noul`, `choice`, `score` |  | The question shape (DecisionQuestionType). The provider entry's `capabilities` must advertise support for it, or the build fails with DECISION_QUESTION_TYPE_UNSUPPORTED rather than surprising at runtime. |
| `instructions` | `Text` | yes |  |  |  | The statement or instruction the provider judges, in plain language. For `noul` it is a statement that is either true or false of the state ('the customer is asking for a refund'), NOT a question. There is no prompt and no system message: a System One model takes the state and the instruction and answers typed, so prompt-engineering idioms (role play, few-shot examples, output-format demands) belong nowhere in this field. |
| `criteria` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | [choice] The option map: each entry's `name` is the key the answer returns and its `value` is the description the provider judges against. [score] The ordered levels, lowest first - entry ORDER is the scale. Ignored for `noul`. A `choice` MUST include an escape option ('other', 'none of these') or validation fails with DECISION_CHOICE_NO_ESCAPE_OPTION: measured, a forced choice none of whose options fit produced a wrong pick at confidence 0.51, so the only signal of the mismatch is a confidence somebody has to remember to check. Forcing the escape option is cheaper. The entry count must stay within the provider's advertised maxChoiceOptions (DECISION_CHOICE_OVER_CEILING); 121 options measured correct at full confidence, so the ceiling is the brand's, not a framework guess. |
| `defaultAnswer` | `String` | no |  |  |  | The answer substituted when `onLowConfidence` or `onProviderError` is `defaultAnswer`. For `noul` a 'true'/'false' string, for `choice` one of the criteria keys, for `score` a level. Required when either option selects defaultAnswer (DECISION_DEFAULT_ANSWER_MISSING). |

## Constraints

Property rules:

- `name`, `type`, `instructions` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `criteria` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
