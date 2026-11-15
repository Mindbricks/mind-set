# AiCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [AiCallAction in Part 2](../spec/AiCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Invokes an AI model such as OpenAI or Anthropic to perform text generation, refinement, classification, or summarization. The prompt is composed from a template and context, and the result is stored in the context and optionally exposed in the response.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `aiCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.aiCallActions`
- `services.businessLogic.actions.aiCallActions`

## Contains

- `promptTemplate`: [AIPromptTemplate](./AIPromptTemplate.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
