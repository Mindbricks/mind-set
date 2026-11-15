# AgentHarnessAssets

**Level:** `section` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarnessAssets in Part 2](../spec/AgentHarnessAssets.md)

Skills, documents and scripts of an AgentHarness. Each entry is a path in the agentHub service files, which ride in the repo and are hash-verified at build; the runner copies them read-only into each session's harness home. A path must be relative, use `/`, have no `.` or `..` segment, and lie under the harness's own folder for its kind (AGENT_HARNESS_ASSET_OUTSIDE_FOLDER otherwise). Each entry must name one file of the `agentHub.serviceFiles` manifest, or a folder holding at least one (AGENT_HARNESS_ASSET_NOT_IN_SERVICE_FILES otherwise); upload the files with `uploadServiceFile` and serviceName `agentHub`. Keep them private: an entry resolving to a public file is warned (AGENT_HARNESS_ASSET_PUBLIC). The runner copies exactly the manifest files an entry names, never anything else in the tree. There is no other upload path.

## Contained in

- [AgentHarness](./AgentHarness.md) as `assets`

Blueprint paths:

- `agentHub.harnesses.assets`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
