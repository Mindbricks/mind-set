# ChatHandlerParameter

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlerParameter in Part 1](../ontology/ChatHandlerParameter.md)

**Name:** an instance is named by `name`.

One name and template value pair of a chat handler: an API parameter of `action.parameters`, or a data key a push prompt records (`prompts[].data`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The API parameter name (action) or the data key (prompt data, read back as `prompt.data.<key>`). The names `__proto__`, `constructor` and `prototype` cannot be carried by the runtime and are refused (CHAT_HANDLER_NAME_RESERVED): rename such a parameter or data key. |
| `value` | `String` | yes |  |  |  | A template: literal text with `{{path}}` placeholders over a closed set of roots (`text`, `args`, `match`, `location`, `media`, `contact`, `sender`, `user`, `channel`, `provider`, `prompt`; prompt data reads `event`). A value that is exactly one placeholder keeps the JSON type of its source (a latitude stays a number). An unknown root is refused (CHAT_HANDLER_PLACEHOLDER_UNKNOWN); an unknown path at runtime renders empty. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
