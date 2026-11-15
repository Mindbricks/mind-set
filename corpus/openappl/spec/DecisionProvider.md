# DecisionProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [DecisionProvider in Part 1](../ontology/DecisionProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [decisionProvider](./providers/decisionProvider.md).

A named calibrated decision provider configuration. The `name` is the lookup key used by decision-consuming patterns (DecisionAction.providerName and its siblings) and the env-var prefix (e.g. `mainJev` → `DECISION_PROVIDER_MAINJEV_*`). The `provider` enum selects the adapter shipped under `_common/nodejs/src/common/decision-providers/`. The `capabilities` block advertises what the adapter behind this entry supports (question types, choice-option ceiling, context ceilings); its defaults are derived from `provider` at codegen time, so a decision surface that needs more than the entry advertises fails validation at design time instead of surprising at runtime. The `configuration` is a typed flat config — only the fields relevant to the selected `provider` are read (see DecisionProviderConfig). The model version MUST be pinned (e.g. `jev-1.13.0`): a floating tag like `jev-latest` is refused with validation ERROR DECISION_MODEL_NOT_PINNED, because an unpinned model means the same blueprint answers differently on two consecutive days, reddening tests with no attributable cause and poisoning every cache whose key includes the model version. A decision provider answers typed questions with calibrated probabilities; it NEVER makes authorization decisions (DECISION_ON_AUTHZ_SURFACE). Native nodejs, java and dotnet adapters implement this provider contract. Java and dotnet support the qualified DecisionAction, agent gate, property source, fuzzy query, enumerable classify and data-object/hub/notification and staged ContentModel editorial moderation surfaces (dotnet data-object moderation in mode staged only). Other unported languages retain their refusal gates.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from decision-consuming patterns and as the env-var prefix. Must be a valid codeName. |
| `provider` | `DecisionProviderType` | no | `"typesafe"` | `typesafe`, `custom`, `mock` |  | The backend provider implementation. Selects which DecisionProviderConfig fields are read, which capabilities the entry defaults to, and which adapter the codegen wires up. `mock` is a REAL transport — it answers deterministically with no key and never reaches the network. |
| `capabilities` | [`DecisionCapabilities`](./DecisionCapabilities.md) | no |  |  |  | Per-entry capability flags. Defaults are derived from `provider` at codegen time so designers don't fill them; advanced users can narrow them per-entry (e.g. disable score questions on an entry meant only for yes/no gating). Designers should leave this null unless intentionally restricting what the provider would otherwise support. |
| `configuration` | [`DecisionProviderConfig`](./DecisionProviderConfig.md) | no |  |  |  | Provider credentials and settings. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env; sensitive fields are marked secret and masked in API responses. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_CONFIG_LIST_CANONICALIZED` | warning | Decision provider "…" configuration was written as a [{name,value}] list — the DataMapItem idiom the OTHER provider families use. |
| `UNIQUE_DECISION_PROVIDER_NAME` | error | Decision provider name "…" is used by … entries in projectSettings.decisionProvidersSettings.decisionProviders[]. |
