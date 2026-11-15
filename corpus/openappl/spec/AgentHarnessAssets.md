# AgentHarnessAssets

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessAssets in Part 1](../ontology/AgentHarnessAssets.md)

Skills, documents and scripts of an AgentHarness. Each entry is a path in the agentHub service files, which ride in the repo and are hash-verified at build; the runner copies them read-only into each session's harness home. A path must be relative, use `/`, have no `.` or `..` segment, and lie under the harness's own folder for its kind (AGENT_HARNESS_ASSET_OUTSIDE_FOLDER otherwise). Each entry must name one file of the `agentHub.serviceFiles` manifest, or a folder holding at least one (AGENT_HARNESS_ASSET_NOT_IN_SERVICE_FILES otherwise); upload the files with `uploadServiceFile` and serviceName `agentHub`. Keep them private: an entry resolving to a public file is warned (AGENT_HARNESS_ASSET_PUBLIC). The runner copies exactly the manifest files an entry names, never anything else in the tree. There is no other upload path.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `skills` | `String`[] | no |  |  |  | Skill folders (each holding a SKILL.md) under `harness/<name>/skills/`, for example `harness/kycCheck/skills/kyc`. |
| `documents` | `String`[] | no |  |  |  | Reference documents under `harness/<name>/docs/`, for example `harness/kycCheck/docs/policy.md`. |
| `scripts` | `String`[] | no |  |  |  | Scripts the harness may run inside its sandbox, under `harness/<name>/scripts/`, for example `harness/kycCheck/scripts/score.py`. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
