# HubCustomMessageType

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubCustomMessageType in Part 1](../ontology/HubCustomMessageType.md)

**Name:** an instance is named by `name`.

Defines a custom (app-specific) message type for the hub. Custom message types extend the built-in types with designer-defined names and field schemas. Each custom type adds its name to the messageType enum in the generated DataObject. The content JSONB column stores the fields defined here, validated at runtime. Examples: 'chessMove' with from/to/piece fields, 'nudge' with animation field, 'bid' with amount/currency fields.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique name for this custom message type. Becomes an entry in the messageType enum alongside built-in types. Must be a valid code name (camelCase). Examples: 'chessMove', 'nudge', 'bid', 'pollVote'. |
| `description` | `String` | no |  |  |  | Human-readable description of what this message type represents and when it is used. |
| `fields` | [`HubCustomField`](./HubCustomField.md)[] | no |  |  |  | Typed fields that make up this custom message type's content schema. Each field has a name, type, and optional constraints. Fields are validated before broadcast and persistence. The entire set is stored in the message's content JSONB column. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `fields` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
