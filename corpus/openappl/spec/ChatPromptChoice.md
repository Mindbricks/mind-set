# ChatPromptChoice

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatPromptChoice in Part 1](../ontology/ChatPromptChoice.md)

**Name:** an instance is named by `id`.

One choice of a push prompt: the id a `promptReply` handler matches and the title shown on the button or list row.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `String` | yes |  |  |  | The choice id, 1-24 characters of `a-z`, `0-9` and `_`, unique within the prompt; it rides the button payload. The ids `__proto__`, `constructor` and `prototype` cannot be carried by the runtime and are refused (CHAT_HANDLER_NAME_RESERVED). |
| `title` | `String` | yes |  |  |  | The button or list row title, 1 to 20 characters. |

## Constraints

Property rules:

- `id`, `title` must be present. (`REQUIRED_FIELD_MISSING`)
