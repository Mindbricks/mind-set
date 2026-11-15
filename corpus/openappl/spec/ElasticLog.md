# ElasticLog

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ElasticLog in Part 1](../ontology/ElasticLog.md)

**Name:** an instance is named by `name`.

A single ES-only append log declaration. Sibling of DataObject but with NO relational baggage (no SQL/Mongo model, no soft-delete, no relations). Declares its own mapping fields, a self-owned timestamp field, and a retention window. The mcpbff creates + maintains the ES index (mapping + ILM + rolling write alias); services write with writeToESLog_<name>(obj) and read with queryESLog_<name>(body) directly against ES.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique log identifier within the project. Used as the ES index/alias base (`<codename>_<name>`), the lookup key from writeToElasticLogAction.logName, and the generated helper suffix (writeToESLog_<name>). Must be a valid codeName. |
| `description` | `Text` | no |  |  |  | An optional human-readable description of what this log records and why. |
| `ownerService` | `String` | no |  |  |  | Optional name of the service that owns the admin read surface for this log. The mcpbff always owns the index lifecycle (mapping/ILM); ownerService only scopes where the low-volume admin search route is generated. When null, every service that writes the log can also read it directly. |
| `timestampField` | `String` | no | `"@timestamp"` |  |  | Name of the self-owned timestamp field stamped on every appended log line (the ILM / time-range query anchor). Defaults to `@timestamp`. |
| `retentionDays` | `Integer` | no | `30` |  |  | Retention window in days. The mcpbff registers an ES ILM policy that deletes indices older than this. 0 or negative disables retention (operators manage it externally). |
| `fields` | [`ElasticLogField`](./ElasticLogField.md)[] | no |  |  |  | The mapping fields of this log. Each field becomes an Elasticsearch mapping property; `filterable` fields are emitted as keyword/exact-match searchable. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `fields` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
