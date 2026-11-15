# DecisionProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [DecisionProvider in Part 2](../spec/DecisionProvider.md)

A named calibrated decision provider configuration. The `name` is the lookup key used by decision-consuming patterns (DecisionAction.providerName and its siblings) and the env-var prefix (e.g. `mainJev` → `DECISION_PROVIDER_MAINJEV_*`). The `provider` enum selects the adapter shipped under `_common/nodejs/src/common/decision-providers/`. The `capabilities` block advertises what the adapter behind this entry supports (question types, choice-option ceiling, context ceilings); its defaults are derived from `provider` at codegen time, so a decision surface that needs more than the entry advertises fails validation at design time instead of surprising at runtime. The `configuration` is a typed flat config — only the fields relevant to the selected `provider` are read (see DecisionProviderConfig). The model version MUST be pinned (e.g. `jev-1.13.0`): a floating tag like `jev-latest` is refused with validation ERROR DECISION_MODEL_NOT_PINNED, because an unpinned model means the same blueprint answers differently on two consecutive days, reddening tests with no attributable cause and poisoning every cache whose key includes the model version. A decision provider answers typed questions with calibrated probabilities; it NEVER makes authorization decisions (DECISION_ON_AUTHZ_SURFACE). Native nodejs, java and dotnet adapters implement this provider contract. Java and dotnet support the qualified DecisionAction, agent gate, property source, fuzzy query, enumerable classify and data-object/hub/notification and staged ContentModel editorial moderation surfaces (dotnet data-object moderation in mode staged only). Other unported languages retain their refusal gates.

## Contained in

- [DecisionProvidersSettings](./DecisionProvidersSettings.md) as `decisionProviders` (a list)

## Contains

- `capabilities`: [DecisionCapabilities](./DecisionCapabilities.md)
- `configuration`: [DecisionProviderConfig](./DecisionProviderConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
