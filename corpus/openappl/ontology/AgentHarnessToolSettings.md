# AgentHarnessToolSettings

**Level:** `section` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarnessToolSettings in Part 2](../spec/AgentHarnessToolSettings.md)

The project tools an AgentHarness may call. The per-session MCP endpoint serves exactly this list and executes each call as the session owner, so permissionCheck, tenant gates and ownership apply as for a direct API call. Every API tool is reached over the network from the harness runner, so its BusinessApi must have a REST controller.

## Contained in

- [AgentHarness](./AgentHarness.md) as `toolSettings`

Blueprint paths:

- `agentHub.harnesses.toolSettings`

## Contains

- `webTools`: [AgentHarnessWebTools](./AgentHarnessWebTools.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
