# AiCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [AiCallAction in Part 1](../ontology/AiCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Invokes an AI model such as OpenAI or Anthropic to perform text generation, refinement, classification, or summarization. The prompt is composed from a template and context, and the result is stored in the context and optionally exposed in the response.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Reference to a project-level AI provider by codeName. Must match an entry in projectSettings.aiProvidersSettings.aiProviders[].name. When set, the action's request is routed to that provider's adapter at runtime (credentials read from AI_PROVIDER_<NAME>_* env vars). When null, the runtime falls back to model-name sniffing (gpt-* → openai, claude-* → anthropic) against the project's legacy `aiSettings.openAiApiKey` / `anthropicApiKey` keys — works for back-compat but emits a deprecation warning at validation. New actions should set providerName. |
| `promptTemplate` | [`AIPromptTemplate`](./AIPromptTemplate.md) | yes |  |  |  | Defines both the static system message and dynamic user message. These are passed to the AI model to guide its behavior. Supports MScript in the user prompt. |
| `isArray` | `Boolean` | yes |  |  |  | Descriptive: marks an action whose result is a list of items. The runtime does not reshape the result on this flag. A responseSchema must have an object root, so a list result under a schema is declared as an array property of that object (e.g. {"type":"object","properties":{"items":{"type":"array","items":{...}}},"required":["items"]}) and read as this.<contextPropertyName>.items. |
| `responseFormat` | `String` | yes |  |  |  | Expected format of the model's output: `json` for structured output or `text` for plain text. With `json` the reply is parsed after stripping ONE surrounding markdown fence (```json / ```) and its whitespace; a reply that still does not parse FAILS the action with a 502 coded AI_CALL_RESPONSE_NOT_JSON, and so does one that parses to a scalar or null (a bare string, number, boolean or null) when no responseSchema is declared, because the actions after it read fields (the raw text is never passed on; declare onActionError: completeApi to branch on this.<actionName>Error.code instead). `text` returns the reply unchanged. Pair `json` with responseSchema to enforce a specific shape - plain `json` is not enforced on the wire by every provider (the Anthropic adapter enforces only a schema). |
| `responseSchema` | `Text` | no |  |  |  | JSON Schema (as a JSON string) that the model's reply must validate against - the same form as AIAgent.modelSettings.responseSchema. Implies JSON output: the reply is parsed and validated whatever responseFormat says (set responseFormat to 'json' to silence the design-time warning). Providers with native structured output (openai-compatible json_schema strict, anthropic current-gen output_config, google responseSchema) receive the schema on the wire; other providers do not see it, so spell the shape out in the prompt as well. The runtime strips one surrounding markdown fence, parses, and validates with the agent runtime's JSON-Schema subset (type, enum, const, required, properties, additionalProperties:false, items); a reply that does not parse or does not validate FAILS the action with a 502 coded AI_CALL_RESPONSE_NOT_JSON / AI_CALL_RESPONSE_SCHEMA_MISMATCH. There is no repair retry (unlike AIAgent): declare onActionError: completeApi to handle the failure in the workflow. Object-root schemas only. Declare one on every decision, moderation or classification call whose result a later action branches on. Example: '{"type":"object","properties":{"decision":{"type":"string","enum":["approve","reject","escalate"]},"reason":{"type":"string"}},"required":["decision","reason"]}'. |
| `model` | `String` | yes |  |  |  | The identifier of the LLM model to be used, such as `gpt-4`, `claude-3`, or any provider-accessible variant. |

## Constraints

Property rules:

- `promptTemplate`, `isArray`, `responseFormat`, `model` must be present. (`REQUIRED_FIELD_MISSING`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AI_CALL_ACTION_MISSING_PROVIDER` | error | AiCallAction has no providerName set. |
| `AI_CALL_RESPONSE_SCHEMA_FORMAT_MISMATCH` | warning | responseSchema is declared but responseFormat is '…'. |
| `INVALID_AI_MODEL` | error | Unrecognized AI model "…"…. |

## Example

Use to call an LLM for generation, classification, or summarization — bind it to a named project AI provider via providerName, and when a later action reads a field of the result (a decision, a category, a moderation verdict) declare a responseSchema: the reply is then enforced natively where the provider can, validated, and a reply that does not match fails the action instead of silently taking a default branch.

```json
{
  "name": "classifyTicket",
  "description": "Classify an incoming support message into a category and urgency.",
  "providerName": "openaiPrimary",
  "model": "gpt-4o",
  "promptTemplate": {
    "systemPrompt": "You are a support triage assistant. Respond ONLY with JSON: category is one of billing, technical, account, other; urgency is one of low, medium, high; summary is one sentence.",
    "userPrompt": { "js": "`Classify this customer message: ${this.data.message}`" }
  },
  "responseFormat": "json",
  "responseSchema": "{\"type\":\"object\",\"properties\":{\"category\":{\"type\":\"string\",\"enum\":[\"billing\",\"technical\",\"account\",\"other\"]},\"urgency\":{\"type\":\"string\",\"enum\":[\"low\",\"medium\",\"high\"]},\"summary\":{\"type\":\"string\"}},\"required\":[\"category\",\"urgency\",\"summary\"],\"additionalProperties\":false}",
  "isArray": false,
  "contextPropertyName": "triage",
  "writeToResponse": true
}
```
