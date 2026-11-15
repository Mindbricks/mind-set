# AgentCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [AgentCallAction in Part 2](../spec/AgentCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Invokes an AI Agent from within a Business API workflow. The agent must be defined under `agentHub/aiAgents` (recommended — runtime-managed agents); legacy in-service `aiAgents` are also resolved when present. The agent is executed using a data payload constructed from the current API context via an MScript expression, and its result is stored in the workflow context for subsequent actions or response writing. This enables tight integration between structured API logic and AI agent capabilities.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `agentCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.agentCallActions`
- `services.businessLogic.actions.agentCallActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
