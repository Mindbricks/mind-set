# AgentHarnessSessionSettings

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessSessionSettings in Part 1](../ontology/AgentHarnessSessionSettings.md)

Frontend access and per-user limits of an AgentHarness's sessions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `allowFrontendSessions` | `Boolean` | no | `true` |  |  | When true, a signed-in user may start a session with `POST /harnesses/:name/sessions` and follow it; the session acts with that user's token. When false, the harness runs only from its triggers. |
| `maxConcurrentPerUser` | `Integer` | no | `2` |  | min 1, max 20 | How many live sessions one user may hold on this harness at once. Default 2, at most 20. |
| `idleTimeoutMinutes` | `Integer` | no | `30` |  | min 1, max 1440 | A session with no prompt and no harness activity for this many minutes is ended (status timed_out). Default 30, at most 1440. |
| `workspaceRetentionDays` | `Integer` | no | `30` |  | min 1, max 365 | A (tenant, user, harness) workspace no session has touched for this many days is removed. Default 30, at most 365. Session events are kept 90 days regardless. |

## Constraints

Property rules:

- `maxConcurrentPerUser` must be between 1 and 20. (`VALUE_OUT_OF_RANGE`)
- `idleTimeoutMinutes` must be between 1 and 1440. (`VALUE_OUT_OF_RANGE`)
- `workspaceRetentionDays` must be between 1 and 365. (`VALUE_OUT_OF_RANGE`)
