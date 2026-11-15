# EnterpriseHubConfig

**Level:** `module` · **Family:** [EnterpriseHubConfig](../ontology/families.md#enterprisehubconfig)

**Ontology:** [EnterpriseHubConfig in Part 1](../ontology/EnterpriseHubConfig.md)

The project-level enterprise-integration asset hub (module). Holds one EnterpriseModel per connected enterprise platform. An EnterpriseModel catalogs the external assets a designer works with — business objects, business events, and business actions — authored against the platform's design-time metadata. These assets are then consumed by services: DataObject projection, BusinessApi Kafka triggers, and ExternalBusinessAction. The connection credentials themselves live in projectSettings.enterpriseIntegrationsSettings; this module is the design-time catalog, not the connection config. Mirrors the AgentHubConfig module shape.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enterpriseModels` | [`EnterpriseModel`](./EnterpriseModel.md)[] | no |  |  |  | One EnterpriseModel per connected enterprise platform. Each model binds to a single integration (by integrationName) and catalogs its objects, events, and actions. Add a model per platform you integrate with (e.g. an SAP model and a Salesforce model). |

## Constraints

Property rules:

- The items of `enterpriseModels` must have distinct names (`modelBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
