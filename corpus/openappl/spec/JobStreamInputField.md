# JobStreamInputField

**Level:** `subsection` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamInputField in Part 1](../ontology/JobStreamInputField.md)

**Name:** an instance is named by `name`.

One field of a JobStream's enqueue input schema: `name`, `type` and `required`. The enqueue handler validates the request body against these fields and maps them onto the target BusinessApi input (per `targetApi.inputMapping`). Keep the payload small — large inputs belong in a bucket, referenced by key.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The input field name as it appears in the enqueue body and is mapped onto the target API input. |
| `type` | `DataTypes` | no | `"String"` | 16 values, see [DataTypes](#datatypes) |  | The field DataType. Defaults to String. |
| `required` | `Boolean` | no | `false` |  |  | When true, the enqueue handler rejects a body missing this field (400). |

## Allowed values

### DataTypes

`ID`, `String`, `Text`, `Integer`, `Boolean`, `Double`, `Decimal`, `Float`, `Short`, `Object`, `Date`, `Enum`, `GeoPoint`, `GeoRoute`, `GeoArea`, `Blob`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
