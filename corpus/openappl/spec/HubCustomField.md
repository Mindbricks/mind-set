# HubCustomField

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubCustomField in Part 1](../ontology/HubCustomField.md)

**Name:** an instance is named by `name`.

Defines a single field in a custom message type's content schema. Fields are stored inside the message's content JSONB column and validated before persistence and broadcast. For Enum types, provide comma-separated allowed values in enumValues.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Field name in the custom message content JSON. Must be a valid JavaScript identifier. Example: 'from', 'piece', 'bidAmount', 'animation'. |
| `fieldType` | `HubCustomFieldType` | yes |  | 9 values, see [HubCustomFieldType](#hubcustomfieldtype) |  | Data type of this field. Determines validation and serialization. Use 'Enum' with enumValues for fixed-choice fields. |
| `required` | `Boolean` | no | `false` |  |  | When true, messages of this custom type must include this field. Validated before persistence and broadcast. |
| `description` | `String` | no |  |  |  | Human-readable description of the field's purpose. Used in documentation and AI context. |
| `enumValues` | `String` | no |  |  |  | Comma-separated list of allowed values when fieldType is 'Enum'. Example: 'pawn,rook,knight,bishop,queen,king'. Ignored for other field types. |
| `defaultValue` | `String` | no |  |  |  | Default value for this field if not provided in the message payload. Stored as a string and coerced to the field type at runtime. |

## Allowed values

### HubCustomFieldType

`String`, `Text`, `Integer`, `Decimal`, `Boolean`, `ID`, `DateTime`, `Enum`, `JSON`

## Constraints

Property rules:

- `name`, `fieldType` must be present. (`REQUIRED_FIELD_MISSING`)
- `fieldType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
