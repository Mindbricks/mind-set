# AgentHubConfig

**Level:** `module` · **Family:** [AgentHubConfig](./families.md#agenthubconfig)

**Specification:** [AgentHubConfig in Part 2](../spec/AgentHubConfig.md)

Configuration for the AgentHub service — a centralized AI agent management platform. The hub hosts design-time agents (with runtime reconfiguration), discovers tools from all project services, and optionally allows end-users to create and manage their own agents at runtime.

## Contained in

- [Project](./Project.md) as `agentHub`

Blueprint paths:

- `agentHub`

## Contains

- `hubSettings`: [AgentHubSettings](./AgentHubSettings.md)
- `aiAgents`: [AIAgent](./AIAgent.md), a list
- `harnesses`: [AgentHarness](./AgentHarness.md), a list
- `serviceFiles`: [ServiceFiles](./ServiceFiles.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
