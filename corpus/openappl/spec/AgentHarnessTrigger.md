# AgentHarnessTrigger

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessTrigger in Part 1](../ontology/AgentHarnessTrigger.md)

**Name:** an instance is named by `name`.

A Kafka trigger of an AgentHarness: a matching event starts a background session (origin `kafka`) as the agentHub M2M service identity. The session calls only the harness's M2M tools (m2mTools on M2MAllowed apis) and its web tools; in a multi-tenant project it runs in the event's tenant (tenantId). The rendered introPrompt is the first user message and the workspace is `/<tenant>/_system/<harnessName>/`. condition, introPrompt, dedupKey and tenantId are MScript expressions over `(message, topic, headers)`, the binding of AgentKafkaController.dataMapping. Event values are data, not instructions: agentHub wraps them in a quoted data block the harness is told never to obey, so keep a triggered harness's tool list to what the job needs and put destructive tools in approvalRequiredTools. A finished session raises harnessSessionCompleted or harnessSessionFailed on agentHub.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique trigger name within the harness (codeName). |
| `topic` | `String` | yes |  |  |  | The Kafka topic to consume. Must be produced in the project. |
| `groupId` | `String` | no |  |  |  | Consumer group id. Null derives one from the hub, harness and trigger names. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional synchronous MScript expression over `(message, topic, headers)`; the event starts a session only when it is truthy. An async function is refused (always truthy). |
| `introPrompt` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression over `(message, topic, headers)` that returns the session's first user message, for example a template literal: `New customer ${message.data.firstName} ${message.data.lastName} (id ${message.data.id}). Run the KYC skill and record the result with the updateCustomerKyc tool.` |
| `dedupKey` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression over `(message, topic, headers)` returning a key; a second event with the same key does not start a second session (AgentKafkaGuard dedup). Null uses the event's own id. |
| `tenantId` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | The tenant the triggered session runs in, as an MScript expression over `(message, topic, headers)`, for example `message.data.storeId`. Required in a multi-tenant project and refused in a single-tenant one. The value is stamped on the session (sys_harnessSession.tenantId), names the workspace `/<tenant>/_system/<harnessName>/` and rides every M2M tool call of the session as its caller tenant, so the work never crosses tenants. An event whose expression yields an empty value is dead-lettered with a reason, never run tenant-less. |
| `enabled` | `Boolean` | no | `true` |  |  | When false, the trigger does not consume. |
| `concurrency` | `Integer` | no | `1` |  | min 1, max 64 | How many events of this trigger are processed at once. Default 1, at most 64. |

## Constraints

Property rules:

- `name`, `topic`, `introPrompt` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `concurrency` must be between 1 and 64. (`VALUE_OUT_OF_RANGE`)
