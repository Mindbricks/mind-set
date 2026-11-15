# EnterpriseModel

**Level:** `chapter` · **Family:** [EnterpriseModel](./families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Specification:** [EnterpriseModel in Part 2](../spec/EnterpriseModel.md)

A model of one connected enterprise platform's assets (chapter). Bound to a single integration via modelBasics.integrationName (must match a projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[].name). Catalogs the external assets authored against that platform's metadata: enterpriseObjects (referenceable business objects), enterpriseEvents (business events mapped to Kafka), enterpriseActions (invokable business functions). Mirrors the AIAgent chapter shape (a named chapter in a module-level array).

## Contained in

- [EnterpriseHubConfig](./EnterpriseHubConfig.md) as `enterpriseModels` (a list)

Blueprint paths:

- `enterpriseHub.enterpriseModels`

## Contains

- `modelBasics`: [EnterpriseModelBasics](./EnterpriseModelBasics.md)
- `enterpriseObjects`: [EnterpriseObject](./EnterpriseObject.md), a list
- `enterpriseEvents`: [EnterpriseEvent](./EnterpriseEvent.md), a list
- `enterpriseActions`: [EnterpriseAction](./EnterpriseAction.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
