# AIPromptTemplate

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [AIPromptTemplate in Part 1](../ontology/AIPromptTemplate.md)

Defines the structure of an AI prompt using a two-part design: a static system-level instruction and a dynamic user message populated via MScript from the current context. Used in AiCallAction to guide AI model behavior.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `systemPrompt` | `Text` | yes |  |  |  | A fixed instruction string that sets the tone or role for the AI model. Examples include guidance like 'You are a helpful assistant' or 'You are a strict validator'. |
| `userPrompt` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | A dynamic MScript expression that generates the user-facing part of the prompt. This often references contextual variables such as `this.username`, `this.itemName`, or `this.description` to personalize or situate the model's response. It is an EXPRESSION, not prompt text: codegen splices it into `await Promise.resolve(<userPrompt>)`, so write prompt text as a template literal in backticks, e.g. { "js": "`Classify this customer message: ${this.data.message}`" }. Bare text (or a template literal that is never closed) is refused at validation with INVALID_MSCRIPT_SYNTAX and a wrap-it-in-backticks hint; a blueprint that reaches codegen anyway has its text emitted as a template literal. |

## Constraints

Property rules:

- `systemPrompt`, `userPrompt` must be present. (`REQUIRED_FIELD_MISSING`)
