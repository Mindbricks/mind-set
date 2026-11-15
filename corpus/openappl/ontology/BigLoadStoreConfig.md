# BigLoadStoreConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BigLoadStoreConfig in Part 2](../spec/BigLoadStoreConfig.md)

Big-load datastore connection credentials and defaults. Fields are a flat superset across all engine types — only those relevant to the selected `engine` are read at runtime and emitted to env. `password` and `secretAccessKey` are secret (masked in API responses).

## Contained in

- [BigLoadStoreProvider](./BigLoadStoreProvider.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
