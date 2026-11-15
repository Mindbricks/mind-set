# EnterpriseHubConfig

**Level:** `module` · **Family:** [EnterpriseHubConfig](./families.md#enterprisehubconfig)

**Specification:** [EnterpriseHubConfig in Part 2](../spec/EnterpriseHubConfig.md)

The project-level enterprise-integration asset hub (module). Holds one EnterpriseModel per connected enterprise platform. An EnterpriseModel catalogs the external assets a designer works with — business objects, business events, and business actions — authored against the platform's design-time metadata. These assets are then consumed by services: DataObject projection, BusinessApi Kafka triggers, and ExternalBusinessAction. The connection credentials themselves live in projectSettings.enterpriseIntegrationsSettings; this module is the design-time catalog, not the connection config. Mirrors the AgentHubConfig module shape.

## Contained in

- [Project](./Project.md) as `enterpriseHub`

Blueprint paths:

- `enterpriseHub`

## Contains

- `enterpriseModels`: [EnterpriseModel](./EnterpriseModel.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
