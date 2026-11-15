# DecisionProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [DecisionProvidersSettings in Part 1](../ontology/DecisionProvidersSettings.md)

Container for calibrated decision provider configurations — System One models that answer typed questions about a piece of state with a calibrated probability (docs/ADR-decision-layer-system-one.md). Each entry is a named provider that decision-consuming patterns reference by name. The generator emits DECISION_PROVIDER_<NAME>_* environment variables per provider so service code can construct the adapter at runtime without revisiting the project config. Mirrors the bucketProvidersSettings shape — a named array; multiple entries can share the same provider type (e.g. one typesafe entry pinned to jev-1.13.0 in production use + a second entry pinned to a newer version under evaluation).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `decisionProviders` | [`DecisionProvider`](./DecisionProvider.md)[] | no |  |  |  | List of configured decision providers. Add one entry per decision backend you want available. Multiple entries can share the same provider type (e.g. two typesafe entries pinned to different model versions). |

## Constraints

Property rules:

- The items of `decisionProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
