# BigLoadProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BigLoadProvidersSettings in Part 2](../spec/BigLoadProvidersSettings.md)

Container for big-load datastore provider configurations. Each entry is a named hot/cold/analytics store referenced by an `EventStream`'s hotStore / coldSink / analytics bindings. The generator emits BIGLOAD_<NAME>_* environment variables per provider so service code resolves the store client at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array. No separate big-load system service (consistent with the buckets/graph have-no-service precedent).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `bigLoadProvidersSettings`

Blueprint paths:

- `projectSettings.bigLoadProvidersSettings`

## Contains

- `bigLoadStores`: [BigLoadStoreProvider](./BigLoadStoreProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
