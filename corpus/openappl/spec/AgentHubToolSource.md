# AgentHubToolSource

**Level:** `section` · **Family:** [AgentHubSettings](../ontology/families.md#agenthubsettings) (domain `AgentHubConfig`)

**Ontology:** [AgentHubToolSource in Part 1](../ontology/AgentHubToolSource.md)

**Name:** an instance is named by `serviceName`.

Defines a service from which the Agent Hub discovers tools. Each tool source maps to a project service whose Business APIs become available as agent tools. Use serviceName '*' to discover from all services.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `serviceName` | `String` | yes |  |  |  | The service to discover tools from. Use '*' to discover from all project services. Use a specific service name (e.g., 'taskManagement') to target a single service. |
| `includeApis` | `String` | no |  |  |  | Comma-separated list of API names to include as tools. Use '*' for all APIs. If null, all APIs from the service are included. |
| `excludeApis` | `String` | no |  |  |  | Comma-separated list of API names to exclude from tools. Applied after includeApis filtering. Useful when includeApis is '*' but you want to hide certain internal APIs. |

## Constraints

Property rules:

- `serviceName` must be present. (`REQUIRED_FIELD_MISSING`)
