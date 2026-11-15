# AgentHubToolSource

**Level:** `section` · **Family:** [AgentHubSettings](./families.md#agenthubsettings) (domain `AgentHubConfig`)

**Specification:** [AgentHubToolSource in Part 2](../spec/AgentHubToolSource.md)

Defines a service from which the Agent Hub discovers tools. Each tool source maps to a project service whose Business APIs become available as agent tools. Use serviceName '*' to discover from all services.

## Contained in

- [AgentHubSettings](./AgentHubSettings.md) as `toolSources` (a list)

Blueprint paths:

- `agentHub.hubSettings.toolSources`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
