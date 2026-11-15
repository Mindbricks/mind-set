# BigLoadProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BigLoadProvidersSettings in Part 1](../ontology/BigLoadProvidersSettings.md)

Container for big-load datastore provider configurations. Each entry is a named hot/cold/analytics store referenced by an `EventStream`'s hotStore / coldSink / analytics bindings. The generator emits BIGLOAD_<NAME>_* environment variables per provider so service code resolves the store client at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array. No separate big-load system service (consistent with the buckets/graph have-no-service precedent).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `bigLoadStores` | [`BigLoadStoreProvider`](./BigLoadStoreProvider.md)[] | no |  |  |  | List of configured big-load datastore providers. Add one entry per store you want available project-wide. Multiple entries can share the same engine (e.g. two ClickHouse clusters). |

## Constraints

Property rules:

- The items of `bigLoadStores` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
