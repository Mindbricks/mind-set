# AgentInputSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentInputSettings in Part 1](../ontology/AgentInputSettings.md)

Defines how incoming request data is transformed into the agent's prompt or input. Includes the prompt template (an MScript expression that builds the user message from request body, params, and context), file upload support for vision/audio agents, and dynamic context sources that fetch additional data to enrich the prompt. The legacy autoResize/autoConvert flags were removed (never consumed by any generator) — the migrator drops them from old blueprints.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `promptTemplate` | [`MScript`](./MScript.md) | no |  |  | MScript kind `prose` | MScript expression that builds the user message from request data. Has access to 'this.request.body', 'this.request.params', and any context source variables. Example: `{ "js": "this.request.body.message" }` or a template literal combining multiple fields. Plain prose that is not a JS expression is read as a template-literal body, so 'Summarize ${this.request.body.ticket}' interpolates and text without interpolations is sent as written. A template that throws while it is evaluated (for example `${this.request.body.company.id}` on a request whose body has no company - an orchestration step or kafka body of another shape) FAILS the run with a 422 AGENT_PROMPT_TEMPLATE_EVAL_FAILED error naming agent.<name>.promptTemplate and the error class (the full evaluation message is written to the service log only, never to the response or the run row); the template source is never sent to the model. A designer-thrown typed 4xx keeps its own status and message, and the run row prefixes the path. An async template (one that returns a Promise, e.g. an awaited LIB call inside an async function) is awaited before any provider call; a rejection is handled exactly like a thrown error. One exception, kept for compatibility: a template that is a single bare word that does not resolve (e.g. Summarize, or session - only this.session is bound) is sent as that literal text; validation warns about it (AGENT_PROMPT_TEMPLATE_BARE_IDENTIFIER) - quote it or use a template literal. Words that resolve (request, this, JavaScript/Node globals such as JSON or Math) are evaluated, and reserved words are read as prose. Guard optional fields with ?. / ?? when the agent is invoked with more than one body shape. |
| `acceptsUpload` | `Boolean` | no | `false` |  |  | When true, the agent's endpoint accepts multipart/form-data with file uploads. A dedicated upload manager middleware is generated to handle validation and temporary storage. NOT required for an audio STT agent: an stt agent ALWAYS gets the upload pipeline, whatever this flag says, because its runtime leg cannot run without audio bytes. Set it for vision (image) agents, or for any other agent that should accept a file. The upload pipeline is served on the agent's own route (`POST <basePath>` and `<basePath>/stream`) only; the agent hub wildcard `POST /agents/:agentName` reads no multipart body. |
| `maxFiles` | `Integer` | no |  |  | min 1 | Maximum number of files accepted per request. Default: 1. Relevant whenever the agent has an upload pipeline - that is acceptsUpload = true OR an audio STT agent, which gets one regardless. Exceeding it answers 400 TOO_MANY_FILES. |
| `contextSources` | [`AgentContextSource`](./AgentContextSource.md)[] | no |  |  |  | Dynamic data sources fetched at runtime to enrich the user prompt. Each source provides a named variable accessible in the promptTemplate via MScript (e.g. 'this.userProfile.email'); when the agent declares NO promptTemplate the fetched values are appended to the user message as a bounded '[Context]' block. Sources are fetched per run (honoring each source's cacheTtlSeconds); a fetch failure is FAIL-SOFT — the run continues without that variable (logged warning). Use these to inject database records, computed values, or external data into the conversation. |

## Constraints

Property rules:

- `maxFiles` must be at least 1. (`VALUE_OUT_OF_RANGE`)
- The items of `contextSources` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
