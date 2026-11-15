# EnterpriseModel

**Level:** `chapter` · **Family:** [EnterpriseModel](../ontology/families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Ontology:** [EnterpriseModel in Part 1](../ontology/EnterpriseModel.md)

**Name:** an instance is named by `modelBasics.name`.

A model of one connected enterprise platform's assets (chapter). Bound to a single integration via modelBasics.integrationName (must match a projectSettings.enterpriseIntegrationsSettings.enterpriseIntegrations[].name). Catalogs the external assets authored against that platform's metadata: enterpriseObjects (referenceable business objects), enterpriseEvents (business events mapped to Kafka), enterpriseActions (invokable business functions). Mirrors the AIAgent chapter shape (a named chapter in a module-level array).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `modelBasics` | [`EnterpriseModelBasics`](./EnterpriseModelBasics.md) | yes |  |  |  | Core settings of the model (section): names the model and binds it to a configured integration via `integrationName` — shared by every asset in the model. |
| `enterpriseObjects` | [`EnterpriseObject`](./EnterpriseObject.md)[] | no |  |  |  | External business objects this model exposes — each references an object in the platform's metadata (e.g. SAP A_BusinessPartner, Salesforce Account). Services can project a DataObject onto one via objectSettings, or read/search it through the mcpbff bridge. |
| `enterpriseEvents` | [`EnterpriseEvent`](./EnterpriseEvent.md)[] | no |  |  |  | Business events this model subscribes to — each maps a platform event source to a Kafka topic (via the AMQP→Kafka mirror for AMQP-native platforms like SAP Event Mesh). A BusinessApi can then be triggered by the mapped Kafka event. |
| `enterpriseActions` | [`EnterpriseAction`](./EnterpriseAction.md)[] | no |  |  |  | Invokable business functions this model exposes — each references a platform-side function (SAP BAPI / OData function import, Salesforce Apex/invocable action, …). A BusinessApi ExternalBusinessAction invokes one through the mcpbff bridge. |

## Constraints

Property rules:

- `modelBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `enterpriseObjects` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `enterpriseEvents` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `enterpriseActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNIQUE_ENTERPRISE_MODEL_NAME` | error | Enterprise model name "…" is used by … entries in enterpriseHub.enterpriseModels[]. |
