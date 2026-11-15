# AgentHarnessTrigger

**Level:** `section` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarnessTrigger in Part 2](../spec/AgentHarnessTrigger.md)

A Kafka trigger of an AgentHarness: a matching event starts a background session (origin `kafka`) as the agentHub M2M service identity. The session calls only the harness's M2M tools (m2mTools on M2MAllowed apis) and its web tools; in a multi-tenant project it runs in the event's tenant (tenantId). The rendered introPrompt is the first user message and the workspace is `/<tenant>/_system/<harnessName>/`. condition, introPrompt, dedupKey and tenantId are MScript expressions over `(message, topic, headers)`, the binding of AgentKafkaController.dataMapping. Event values are data, not instructions: agentHub wraps them in a quoted data block the harness is told never to obey, so keep a triggered harness's tool list to what the job needs and put destructive tools in approvalRequiredTools. A finished session raises harnessSessionCompleted or harnessSessionFailed on agentHub.

## Contained in

- [AgentHarness](./AgentHarness.md) as `triggers` (a list)

Blueprint paths:

- `agentHub.harnesses.triggers`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
