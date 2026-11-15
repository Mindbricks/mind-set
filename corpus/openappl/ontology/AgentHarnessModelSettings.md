# AgentHarnessModelSettings

**Level:** `section` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarnessModelSettings in Part 2](../spec/AgentHarnessModelSettings.md)

The model an AgentHarness runs on, and how the session authenticates to it. With `auth: providerKey` (the default) the runner's model gateway adds the provider key, so the key never enters the sandbox. With `auth: userSubscription` a Claude Code or Codex session runs on the session owner's own Claude or ChatGPT subscription, stored at the tenant or user level of the entry.

## Contained in

- [AgentHarness](./AgentHarness.md) as `modelSettings`

Blueprint paths:

- `agentHub.harnesses.modelSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
