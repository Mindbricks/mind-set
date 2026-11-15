# ElasticLogField

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ElasticLogField in Part 1](../ontology/ElasticLogField.md)

**Name:** an instance is named by `name`.

One mapping field of an ElasticLog — becomes an Elasticsearch mapping property of the given type.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The field name as it appears in the ES mapping and in the logged object. |
| `type` | `ElasticLogFieldType` | no | `"keyword"` | 9 values, see [ElasticLogFieldType](#elasticlogfieldtype) |  | The Elasticsearch field type. 'keyword' = exact-match string; 'text' = full-text analyzed; 'long'/'double' = numeric; 'boolean'; 'date'; 'object' = free-form JSON (mapped as ES `flattened`: every leaf is indexed as an exact-match keyword whatever JSON type it carries, so mixed value shapes under one key can never poison the index; a leaf that needs numeric range/aggregation support belongs in its own typed field); 'ip' = IP address; 'geo_point' = lat/lon. |
| `filterable` | `Boolean` | no | `false` |  |  | When true, this field is intended to be used in admin search filters (exact-match / range). Informational hint surfaced to the generated read route + mcpbff mapping; analyzed `text` fields are searchable regardless. |

## Allowed values

### ElasticLogFieldType

`keyword`, `text`, `long`, `double`, `boolean`, `date`, `object`, `ip`, `geo_point`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
