# AgentHarness

**Level:** `chapter` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarness in Part 2](../spec/AgentHarness.md)

An agent harness hosted by agentHub: a long-running, autonomous agent run by an open-source harness runtime (docs/ADR-agent-harness.md). It works from skills, documents and scripts, keeps a private working directory, calls the project's tools over MCP and can be extended with runtime-native plugins. agentHub drives the runtime over the Agent Client Protocol (ACP); the emitted harness runner system service starts one sandboxed process per session (bubblewrap/nsjail, no host environment, CPU/memory/time limits). The workspace is one directory per (tenant, user, harness), shared by that user's sessions and never by two users; Kafka-triggered sessions use `/<tenant>/_system/<harnessName>/`. The model key never enters the sandbox: the harness reaches its model through the runner's model gateway, which adds the key from the agentHub AI provider entry and enforces the cost ceilings. Every tool call runs as the session owner: the user's own bearer for a frontend session; for a Kafka-triggered one, the agentHub M2M service identity in the event's tenant, so a triggered session calls only the harness's m2mTools. Clients start, follow and cancel sessions through agentHub's /harnesses and /harness-sessions APIs only.

## Contained in

- [AgentHubConfig](./AgentHubConfig.md) as `harnesses` (a list)

Blueprint paths:

- `agentHub.harnesses`

## Contains

- `harnessBasics`: [AgentHarnessBasics](./AgentHarnessBasics.md)
- `modelSettings`: [AgentHarnessModelSettings](./AgentHarnessModelSettings.md)
- `assets`: [AgentHarnessAssets](./AgentHarnessAssets.md)
- `plugins`: [AgentHarnessPlugin](./AgentHarnessPlugin.md), a list
- `toolSettings`: [AgentHarnessToolSettings](./AgentHarnessToolSettings.md)
- `networkSettings`: [AgentHarnessNetworkSettings](./AgentHarnessNetworkSettings.md)
- `sessionSettings`: [AgentHarnessSessionSettings](./AgentHarnessSessionSettings.md)
- `triggers`: [AgentHarnessTrigger](./AgentHarnessTrigger.md), a list
- `guardrails`: [AgentGuardrails](./AgentGuardrails.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
