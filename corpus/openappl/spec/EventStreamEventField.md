# EventStreamEventField

**Level:** `subsection` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [EventStreamEventField in Part 1](../ontology/EventStreamEventField.md)

**Name:** an instance is named by `name`.

One field of an EventStream's telemetry schema — a typed column the ingest API validates and the hot store persists. The partitionKey / clusteringKey reference these by name.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The field name as it appears in the ingest body and the hot store column. |
| `type` | `DataTypes` | no | `"String"` | 16 values, see [DataTypes](#datatypes) |  | The field DataType. Maps to a CQL column type in the Cassandra hot store (String/Text→text, Integer/Short→int, Double/Float→double, Boolean→boolean, Date→timestamp, ID→uuid, Object/Any→text JSON, GeoPoint→text). Defaults to String. |
| `required` | `Boolean` | no | `false` |  |  | When true, the ingestion handler rejects a body missing this field (400). The partition key is always implicitly required. |

## Allowed values

### DataTypes

`ID`, `String`, `Text`, `Integer`, `Boolean`, `Double`, `Decimal`, `Float`, `Short`, `Object`, `Date`, `Enum`, `GeoPoint`, `GeoRoute`, `GeoArea`, `Blob`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
