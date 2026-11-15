# BigLoadStoreProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BigLoadStoreProvider in Part 1](../ontology/BigLoadStoreProvider.md)

**Name:** an instance is named by `name`.

A named big-load datastore provider configuration. The `name` is the lookup key used by `EventStream` hotStore / coldSink / analytics bindings and the env-var prefix (e.g. `mainHot` → `BIGLOAD_MAINHOT_*`). The `engine` enum selects the backend driver and decides which credentials in `configuration` are read.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from EventStream hotStore / coldSink / analytics bindings and the env-var prefix. Must be a valid codeName. |
| `engine` | `BigLoadEngine` | no | `"cassandra"` | `cassandra`, `clickhouse`, `s3Parquet`, `spark` |  | The big-load datastore backend type. `cassandra` = write-optimized hot/time-series store (current-state + last-N + TTL); `clickhouse` = columnar OLAP analytics store (rollups/aggregations/KPI); `s3Parquet` = cold columnar archive / data lake (full append-only history as Parquet objects, reuses the RemoteBucket S3 credential shape). |
| `configuration` | [`BigLoadStoreConfig`](./BigLoadStoreConfig.md) | no |  |  |  | Connection details for the store. The required keys depend on `engine` (flat superset, same modeling BucketProviderConfig/GraphProviderConfig use). Secret keys (password, secretAccessKey) are masked in API responses and emitted to BIGLOAD_<NAME>_<KEY> env vars at codegen time. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `engine` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `BIGLOAD_STORE_LOOPBACK_ENDPOINT` | warning | Big-load … provider "…" points at a loopback endpoint. |
| `BIGLOAD_STORE_MISSING_CONFIG` | error | Big-load store "…" (engine "…") is missing required configuration key(s): …. |
| `RETIRED_BIGLOAD_ENGINE` | error | Redis big-load stores are retired: no generated runtime implements them. |
