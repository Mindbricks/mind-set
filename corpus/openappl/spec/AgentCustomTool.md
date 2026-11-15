# AgentCustomTool

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentCustomTool in Part 1](../ontology/AgentCustomTool.md)

**Name:** an instance is named by `name`.

Defines a custom tool that the agent can invoke during its execution loop. Custom tools are used when existing CRUD, API, or library tools are not sufficient. Each tool has a name, description (shown to the AI), a JSON Schema defining its parameters, and a handler pointing to a library function.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Tool name as exposed to the AI model. Should be descriptive and unique within the agent's tool set. Example: 'searchProducts', 'sendEmail'. |
| `description` | `String` | yes |  |  |  | Human-readable description of what the tool does. This text is included in the tool definition sent to the AI model and helps it decide when to use the tool. |
| `parameters` | `Text` | no |  |  |  | JSON Schema defining the tool's input parameters. The AI model uses this schema to generate valid arguments. Example: '{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}'. Validated at design time: must parse to a structurally valid JSON Schema object with a root type of 'object'. |
| `handler` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Name of the service library function that implements the tool — e.g. 'searchProducts' (a `library.functions[].moduleName`). A leading 'lib.' prefix is accepted and stripped by the codegen. The function receives the parsed parameters as its argument. |

## Constraints

Property rules:

- `name`, `description`, `handler` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INVALID_TOOL_PARAMETERS_JSON` | error | parameters is not valid JSON: … |
| `INVALID_TOOL_PARAMETERS_SCHEMA` | error | parameters must be a JSON Schema OBJECT (e.g. |
| `UNKNOWN_TOOL_HANDLER` | warning | handler "…" does not match any library function…. |
