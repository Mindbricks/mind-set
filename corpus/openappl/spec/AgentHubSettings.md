# AgentHubSettings

**Level:** `chapter` · **Family:** [AgentHubSettings](../ontology/families.md#agenthubsettings) (domain `AgentHubConfig`)

**Ontology:** [AgentHubSettings in Part 1](../ontology/AgentHubSettings.md)

Hub settings chapter containing the basic configuration and tool source definitions for the Agent Hub service.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hubBasics` | [`AgentHubBasics`](./AgentHubBasics.md) | yes |  |  |  | Core hub settings: dynamic agent creation controls and tool discovery configuration. |
| `toolSources` | [`AgentHubToolSource`](./AgentHubToolSource.md)[] | no |  |  |  | The services the hub discovers tools from — each source maps a project service whose Business APIs become available as agent tools; use serviceName '*' to discover from all services. |

## Constraints

Property rules:

- `hubBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `toolSources` must have distinct names (`serviceName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
