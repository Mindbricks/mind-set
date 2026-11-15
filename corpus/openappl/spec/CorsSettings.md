# CorsSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [CorsSettings in Part 1](../ontology/CorsSettings.md)

**Activation:** the pattern is switched on by `useCorsControl`.

Defines CORS settings for service accesses. When enabled Cross Origins will be accepted according to the settings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useCorsControl` | `Boolean` | yes |  |  |  | Specifies whether CORS control is enabled. Leave false if you allow service accesses from any domain. |
| `configuration` | [`CorsSettingsConfig`](./CorsSettingsConfig.md) | no |  |  |  | The configuration object for the CORS settings. Leave it null if useCorsControl is false. |

## Constraints

Property rules:

- `useCorsControl` must be present. Enforced only while `useCorsControl` is on. (`REQUIRED_FIELD_MISSING`)
