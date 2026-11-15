# AgentContextSource

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentContextSource in Part 1](../ontology/AgentContextSource.md)

**Name:** an instance is named by `name`.

Defines a dynamic data source that fetches context at runtime. Used in both systemPromptSources (injected into the system message) and contextSources (injected into the user prompt). Each source produces a named variable accessible via MScript in templates.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Variable name used to reference this source's data in MScript templates. Example: if name is 'userProfile', access it as 'userProfile.email' in the promptTemplate. |
| `sourceType` | `AgentContextSourceType` | yes |  | `dataObject`, `libraryFunction`, `apiCall` |  | How data is fetched: 'dataObject' queries a DataObject, 'libraryFunction' calls a library function, 'apiCall' invokes a BusinessApi or external endpoint. |
| `config` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Source-specific configuration as an MScript expression evaluated per fetch (access to 'this.request' / 'this.session'). It must return: for 'dataObject' → { object: '<DataObjectName>', query: {...}, list?: boolean } (runs get<Object>ByQuery / list); for 'libraryFunction' → { function: '<moduleName>', args?: [...] } (calls the service library function); for 'apiCall' → { url: 'https://…', method?, headers?, body?, timeoutMs? } (bounded HTTP fetch, JSON parsed when possible). A missing config makes the source unfetchable — flagged at design time. |
| `cacheTtlSeconds` | `Integer` | no |  |  | min 0 | Cache the fetched value for this many seconds (per runtime instance). 0 or null = no caching: contextSources re-fetch every run; systemPromptSources re-fetch whenever the system message pipeline re-evaluates (see chatSettings.refreshSystemPrompt). |

## Constraints

Property rules:

- `name`, `sourceType` must be present. (`REQUIRED_FIELD_MISSING`)
- `sourceType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `cacheTtlSeconds` must be at least 0. (`VALUE_OUT_OF_RANGE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_CONTEXT_SOURCE_CONFIG_MISSING` | warning | Context source "…" declares no config — the runtime cannot fetch it (the source is skipped fail-soft on every run). |
