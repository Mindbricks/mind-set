# BigLoadStoreProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BigLoadStoreProvider in Part 2](../spec/BigLoadStoreProvider.md)

A named big-load datastore provider configuration. The `name` is the lookup key used by `EventStream` hotStore / coldSink / analytics bindings and the env-var prefix (e.g. `mainHot` → `BIGLOAD_MAINHOT_*`). The `engine` enum selects the backend driver and decides which credentials in `configuration` are read.

## Contained in

- [BigLoadProvidersSettings](./BigLoadProvidersSettings.md) as `bigLoadStores` (a list)

## Contains

- `configuration`: [BigLoadStoreConfig](./BigLoadStoreConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
