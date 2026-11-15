# EnterpriseIntegrationsSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [EnterpriseIntegrationsSettings in Part 2](../spec/EnterpriseIntegrationsSettings.md)

Container for enterprise-platform integrations. Each entry is a named integration bound to one platform (Salesforce, SAP S/4HANA + ECC, Dynamics 365, HubSpot). The mcpbff service discovers the entries from the blueprint and owns ALL connectivity to the platform — regular services never open a connection; they run business logic around the enterprise object and reach the platform through the mcpbff bridge over signed M2M. The generator emits ENTERPRISE_<NAME>_* environment variables per integration so the mcpbff bridge can construct the platform client at runtime without revisiting the project config. Mirrors the amqpProvidersSettings shape — a named array; the connectors are TypeScript-only (mcpbff), never ported to the 6 non-Node targets.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `enterpriseIntegrationsSettings`

Blueprint paths:

- `projectSettings.enterpriseIntegrationsSettings`

## Contains

- `enterpriseIntegrations`: [EnterpriseIntegration](./EnterpriseIntegration.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
