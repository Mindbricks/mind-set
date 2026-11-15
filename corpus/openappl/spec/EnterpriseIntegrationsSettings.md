# EnterpriseIntegrationsSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [EnterpriseIntegrationsSettings in Part 1](../ontology/EnterpriseIntegrationsSettings.md)

Container for enterprise-platform integrations. Each entry is a named integration bound to one platform (Salesforce, SAP S/4HANA + ECC, Dynamics 365, HubSpot). The mcpbff service discovers the entries from the blueprint and owns ALL connectivity to the platform — regular services never open a connection; they run business logic around the enterprise object and reach the platform through the mcpbff bridge over signed M2M. The generator emits ENTERPRISE_<NAME>_* environment variables per integration so the mcpbff bridge can construct the platform client at runtime without revisiting the project config. Mirrors the amqpProvidersSettings shape — a named array; the connectors are TypeScript-only (mcpbff), never ported to the 6 non-Node targets.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enterpriseIntegrations` | [`EnterpriseIntegration`](./EnterpriseIntegration.md)[] | no |  |  |  | List of configured enterprise-platform integrations. Add one entry per platform instance you want the project's mcpbff to connect to. Multiple entries can target the same platform (e.g. a Salesforce sandbox and a Salesforce production org — distinct names). |

## Constraints

Property rules:

- The items of `enterpriseIntegrations` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
