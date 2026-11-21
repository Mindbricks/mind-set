---
title: AiCallAction
---

# AiCallAction

Runs a single-shot chat completion against a configured AI provider (OpenAI, Anthropic, ...) and writes the result onto the workflow context. Use it for one-prompt-in / one-completion-out flows: for multi-step tool loops use [`AgentCallAction`](./agent-call-action.md), and for streaming see [`IteratorAction`](./iterator-action.md).

## When to use it

- Classify, summarise, rewrite, or translate a field on the request or a fetched object.
- Produce a JSON projection from natural-language input (set `responseFormat: "json"`, and declare a `responseSchema` when a later action reads a field of it).
- Take a decision a later action branches on (moderation verdict, routing, triage): declare a `responseSchema` - see [Decision and moderation flows](#decision-and-moderation-flows).
- Generate user-facing copy as part of a workflow (replies, descriptions, alt text).
- For richer agent behaviour with tools, system policy, and memory, prefer [`AgentCallAction`](./agent-call-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` | no (in the pattern) | Reference to a project-level AI provider; must match an entry in `projectSettings.aiProvidersSettings.aiProviders[].name`. **Required in practice**: the runtime throws if it is unset. |
| `promptTemplate` | `AIPromptTemplate` | yes | The system + user prompt pair (see below). |
| `isArray` | `Boolean` | yes | Descriptive: the result is a list of items. The runtime does not reshape the result on this flag; under a `responseSchema` (object root only) declare the list as an array property of the object. |
| `responseFormat` | `String` | yes | `"json"` for structured output (the reply is parsed; see [Behaviour](#behaviour)), or `"text"` for plain text. |
| `responseSchema` | `Text` | no | JSON Schema, as a JSON string, the reply must validate against - the same form as `AIAgent.modelSettings.responseSchema`. Implies JSON output. Object root only. |
| `model` | `String` | yes | The model identifier, passed verbatim to the provider `providerName` resolves to (e.g. `gpt-5-mini` on `openai`, `claude-haiku-4-5` on `anthropic`, `gemini-2.5-flash` on `google`, `grok-4` on `xai`). Validation (`INVALID_AI_MODEL`) checks the name against the resolved provider: `openai` (gpt, o1/o3/o4), `anthropic` (claude), `google` (gemini, gemma), `xai` (grok), `deepseek`, `moonshot` (moonshot, kimi); an OpenAI or Anthropic name is accepted on every provider. `azure-openai` deployment names, `bedrock` model ids, `ollama` tags and `custom` endpoints take any id. |

`AIPromptTemplate` fields:

| Property | Type | Req | Description |
|---|---|---|---|
| `systemPrompt` | `Text` | yes | Fixed instruction string establishing role / behaviour. |
| `userPrompt` | `MScript` | yes | Expression that builds the user-side message. Has access to `this`. Write prompt text as a template literal in backticks (`` `Comment: ${this.comment.body}` ``); see [The userPrompt is an expression](#the-userprompt-is-an-expression). |

### The userPrompt is an expression

The compiled action evaluates `userPrompt` as an expression and awaits its value, so it is an MScript **expression**, not prompt text. Prompt text goes in a template literal: `` { "js": "`Summarize: ${this.ticket.body}`" } ``. A plain string literal (`"'Hello'"`) or any other expression that yields a string works too.

- Validation refuses a `userPrompt` that is not an expression - bare text (`Summarize this ticket`), a `Label: value` line (it parses only as an object body), or a template literal that is opened and never closed - with `INVALID_MSCRIPT_SYNTAX` at `...promptTemplate.userPrompt`. The message says to wrap the prompt in backticks, and `details.suggestedSource` carries the wrapped source.
- A blueprint that reaches the compiler with such a prompt anyway does not break the build: the text is emitted as a template-literal body (a missing closing backtick is added, inner backticks are escaped, `${...}` interpolates), or as a plain string literal when even that would not parse.

As a code slot, `userPrompt` also gets the usual MScript lint (unknown root names are errors, undeclared `this.<name>` reads are warnings).

## Behaviour

At runtime the service:

1. Compiles `userPrompt` MScript against the current context.
2. Resolves the AI provider named by `providerName` with the `model`, `responseFormat` and `responseSchema`; its credentials come from the provider configuration, not from the blueprint. A declared `responseSchema` is enforced natively on the wire where the provider can: OpenAI-compatible `json_schema` (strict), Anthropic current-generation models `output_config`, Google `responseSchema`. Other providers do not see the schema, so spell the shape out in the prompt as well.
3. Sends `[ { role: 'system', content: systemPrompt }, { role: 'user', content: <compiled userPrompt> } ]` as a chat completion.
4. When JSON is expected (`responseFormat === "json"`, or a `responseSchema` is declared) the reply is read strictly:
   - ONE surrounding markdown fence (```` ```json ```` or ```` ``` ````) and the whitespace around it is stripped, then the text is JSON-parsed. Nothing looser: prose around a fenced block is not JSON.
   - Without a `responseSchema`, the parsed value must be an object or an array: a reply that parses to a scalar or `null` (`"approve"`, `42`, `true`, `null`) is refused like prose, because the actions after this one read fields off the result.
   - With a `responseSchema`, the parsed value is validated with the agent runtime's JSON-Schema subset (`type`, `enum`, `const`, `required`, `properties`, `additionalProperties: false`, `items`).
   - A reply that does not parse FAILS the action with `AI_CALL_RESPONSE_NOT_JSON`; a value that does not validate FAILS it with `AI_CALL_RESPONSE_SCHEMA_MISMATCH`. Both errors carry `statusCode: 502` and `code`. The raw text is never passed on, and the log line (`AiCallActionResponseRejected`) names the action and the provider and carries at most a short prefix of the reply.
   - There is no repair retry (an `AIAgent` with a `responseSchema` has one; this single-shot action does not).

   With `responseFormat: "text"` and no schema the raw `content` is returned unchanged.
5. The result is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true.

> Note: `providerName` is the canonical wiring. The runtime does not pick a provider from the model name; the service throws if `providerName` is not configured.

Streaming is not wired through `AiCallAction`. For token-level streaming use [`IteratorAction`](./iterator-action.md).

## Example

```json
{
  "name": "summarizeTicket",
  "writeToResponse": false,
  "contextPropertyName": "ticketSummary",
  "providerName": "openai",
  "model": "gpt-4o-mini",
  "responseFormat": "json",
  "responseSchema": "{\"type\":\"object\",\"properties\":{\"summary\":{\"type\":\"string\"},\"urgency\":{\"type\":\"string\",\"enum\":[\"low\",\"med\",\"high\"]}},\"required\":[\"summary\",\"urgency\"],\"additionalProperties\":false}",
  "isArray": false,
  "promptTemplate": {
    "systemPrompt": "You are a customer-support triage assistant. Return JSON: { summary: string, urgency: 'low'|'med'|'high' }.",
    "userPrompt": { "js": "`Customer wrote: \"${this.ticket.body}\" - produce the JSON.`" }
  }
}
```

Downstream actions can branch on `this.ticketSummary.urgency` via their `condition` field: the schema guarantees the field is there and is one of the three values, or the action failed.

## Decision and moderation flows

> **Prefer [`DecisionAction`](./decision-action.md) for this.** A decision provider answers a typed
> question with a calibrated confidence in 250-400 ms, always within the options you declare, and
> bills no output tokens - so for a moderation verdict, an approve / reject / escalate decision or a
> routing target it is cheaper than a chat completion with a schema, and there is no reply to parse
> back into a value. Reach for `AiCallAction` here when you need the REASON as prose, which a decision provider
> cannot give you; the two compose through `DecisionAction.escalateTo`. See
> [The decision layer](../capabilities/decision-layer.md). To moderate what users write to a data
> object, use [Object content moderation](../capabilities/object-moderation.md): no action to author.

When you do take the decision with this action, and a later action branches on a field of the
model's answer, declare a `responseSchema` with an `enum` for the decision field: the schema guarantees the field is there and holds one of the declared values, or the action fails.

```json
{
  "name": "moderateComment",
  "contextPropertyName": "moderation",
  "providerName": "anthropicMain",
  "model": "claude-haiku-4-5",
  "responseFormat": "json",
  "responseSchema": "{\"type\":\"object\",\"properties\":{\"decision\":{\"type\":\"string\",\"enum\":[\"approve\",\"reject\",\"escalate\"]},\"reason\":{\"type\":\"string\"}},\"required\":[\"decision\",\"reason\"],\"additionalProperties\":false}",
  "isArray": false,
  "onActionError": "completeApi",
  "promptTemplate": {
    "systemPrompt": "You moderate user comments. Answer with JSON only: decision is one of approve, reject, escalate; reason is one sentence.",
    "userPrompt": { "js": "`Comment: ${this.comment.body}`" }
  }
}
```

- Name the enum values in the prompt too: providers without native structured output never see the schema.
- With `onActionError: "completeApi"` a rejected reply does not abort the api: `this.moderation` stays unset and `this.moderateCommentError.code` is `AI_CALL_RESPONSE_NOT_JSON` or `AI_CALL_RESPONSE_SCHEMA_MISMATCH`, so the workflow can route the item to manual review deliberately rather than by accident. With the default `throwError` the api fails with a 502.

## Errors

- `providerName` must resolve to a configured `aiProviders[]` entry. The runtime throws a clear error pointing at `projectSettings.aiProvidersSettings.aiProviders[]` when it is missing.
- Provider-level errors (auth, rate limit, content policy) propagate from the provider adapter. Use `onActionError: "completeApi"` to inspect them via `this.<actionName>Error` instead of aborting the workflow.
- When JSON is expected and the reply does not parse (or, with no `responseSchema`, parses to a scalar or `null`), the action fails with `AI_CALL_RESPONSE_NOT_JSON` (502); when it does not match the `responseSchema`, with `AI_CALL_RESPONSE_SCHEMA_MISMATCH` (502). The raw string is never returned. Through the service's error handler a 5xx answers the client with the generic `INTERNAL_ERROR` body; the specific code is in the service log and, under `onActionError: "completeApi"`, on `this.<actionName>Error.code`.
- Design time: a `responseSchema` that is not JSON is `INVALID_RESPONSE_SCHEMA_JSON`, one that is not an object-root JSON Schema is `INVALID_RESPONSE_SCHEMA` (errors); a schema with `responseFormat` other than `"json"` is `AI_CALL_RESPONSE_SCHEMA_FORMAT_MISMATCH` (warning).

## See also

- [`AgentCallAction`](./agent-call-action.md): multi-step agent with tools
- [`IteratorAction`](./iterator-action.md): async-iterable streaming
- [AI providers](../providers/ai.md)
- [AI agents](../system-services/agent-hub.md)
- [`BusinessApiAction`](../../spec/BusinessApiAction.md), [`AIPromptTemplate`](../../spec/AIPromptTemplate.md)
