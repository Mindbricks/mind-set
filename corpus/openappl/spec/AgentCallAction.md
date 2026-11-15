# AgentCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [AgentCallAction in Part 1](../ontology/AgentCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Invokes an AI Agent from within a Business API workflow. The agent must be defined under `agentHub/aiAgents` (recommended — runtime-managed agents); legacy in-service `aiAgents` are also resolved when present. The agent is executed using a data payload constructed from the current API context via an MScript expression, and its result is stored in the workflow context for subsequent actions or response writing. This enables tight integration between structured API logic and AI agent capabilities.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `agentName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The name of the AI Agent to invoke. Must match the `agentBasics.name` of an agent defined under `agentHub/aiAgents` (recommended) or in the service's local `aiAgents` array. Codegen auto-detects the dispatch target: local-first, then AgentHub. An agent the calling service deploys itself (its own `aiAgents`, or an `agentHub/aiAgents` entry whose `agentBasics.assignedService` names that service) runs in-process; any other agent is called on the agentHub service (`SERVICE_AGENTHUB_URL`). Example: 'contentAnalyzer', 'summarizer'. |
| `inputData` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression that builds the data object to pass to the agent as its request body. Has access to `this` (the API context), including `this.data`, `this.session`, and any context properties set by previous actions. Example: `{ "js": "{ message: this.data.description, context: this.fetchedProfile.bio }" }`. If null, the agent receives an empty object `{}` on both dispatch routes; `this.data` is not forwarded implicitly, so pass it explicitly (`{ "js": "this.data" }`) to forward it. |

## Constraints

Property rules:

- `agentName` must be present. (`REQUIRED_FIELD_MISSING`)
- `agentName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_CALL_RESPONSE_NOT_JSON` | warning | Agent "…" declares a responseSchema (structured output) but its responseFormat is '…' — this call receives raw text, not the schema-shaped JSON. |
| `AGENT_CALL_SURFACE_NOT_REST` | warning |  |
| `UNKNOWN_AGENT_NAME` | warning | Agent "…" not found in the service or the agent hub. |

## Example

Use to invoke a defined AI Agent (from agentHub/aiAgents) inside a workflow, building its input payload from context — for multi-tool / multi-step reasoning that a single AiCallAction can't express.

```json
{
  "name": "runContentAnalyzer",
  "description": "Run the contentAnalyzer agent over the submitted article plus the author's prior context.",
  "agentName": "contentAnalyzer",
  "inputData": { "js": "{ text: this.data.body, authorBio: this.author.bio, locale: this.session.locale }" },
  "contextPropertyName": "analysis",
  "writeToResponse": true
}
```
