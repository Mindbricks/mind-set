# AgentHarnessBasics

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessBasics in Part 1](../ontology/AgentHarnessBasics.md)

Identity of an AgentHarness: its unique name, description, runtime and enabled flag.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique harness name within the hub (codeName). It names the harness in the agentHub APIs (`POST /harnesses/:name/sessions`), its asset folder `harness/<name>/` and its workspace directory. |
| `description` | `Text` | no |  |  |  | What the harness is for. Shown to designers and in the hub's harness listing. |
| `runtime` | `AgentHarnessRuntime` | no | `"dsh"` | `dsh`, `goose`, `codex`, `claude-code`, `opencode` |  | The harness runtime: `dsh` (DeepSeek Harness, the default), `goose`, `codex`, `claude-code` or `opencode`. Each runtime is pinned to one version by the framework release and driven over ACP. |
| `enabled` | `Boolean` | no | `true` |  |  | When false, the harness is kept in the blueprint but not served: no sessions start and its triggers do not consume. A project whose harnesses are all disabled gets no harness runner. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `runtime` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
