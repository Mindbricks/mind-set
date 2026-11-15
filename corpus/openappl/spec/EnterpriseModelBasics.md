# EnterpriseModelBasics

**Level:** `section` · **Family:** [EnterpriseModel](../ontology/families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Ontology:** [EnterpriseModelBasics in Part 1](../ontology/EnterpriseModelBasics.md)

Core settings for an EnterpriseModel (section). Names the model and binds it to a configured integration; the integrationName is shared by every asset in the model.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique model identifier within the project's enterpriseHub. Names this model (e.g. 'sapErp', 'salesforceCrm'). Must be a valid codeName. |
| `integrationName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The connected integration this model binds to. Must match a projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[].name — that entry supplies the platform + credentials the mcpbff bridge uses at runtime. Every asset in this model targets that integration's platform. |
| `description` | `Text` | no |  |  |  | Human-readable description of what this enterprise model covers. |

## Constraints

Property rules:

- `name`, `integrationName` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `integrationName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
