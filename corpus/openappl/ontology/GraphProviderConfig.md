# GraphProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [GraphProviderConfig in Part 2](../spec/GraphProviderConfig.md)

Graph-database connection credentials and defaults. Fields are a flat superset across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env. `password` is secret (masked in API responses, emitted to GRAPH_<NAME>_PASSWORD).

## Contained in

- [GraphProvider](./GraphProvider.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
