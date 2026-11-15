# DecisionProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [DecisionProvidersSettings in Part 2](../spec/DecisionProvidersSettings.md)

Container for calibrated decision provider configurations — System One models that answer typed questions about a piece of state with a calibrated probability (docs/ADR-decision-layer-system-one.md). Each entry is a named provider that decision-consuming patterns reference by name. The generator emits DECISION_PROVIDER_<NAME>_* environment variables per provider so service code can construct the adapter at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array; multiple entries can share the same provider type (e.g. one typesafe entry pinned to jev-1.13.0 in production use + a second entry pinned to a newer version under evaluation).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `decisionProvidersSettings`

Blueprint paths:

- `projectSettings.decisionProvidersSettings`

## Contains

- `decisionProviders`: [DecisionProvider](./DecisionProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
