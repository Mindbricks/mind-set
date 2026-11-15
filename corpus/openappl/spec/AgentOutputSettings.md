# AgentOutputSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentOutputSettings in Part 1](../ontology/AgentOutputSettings.md)

Controls how the AI model's response is transformed before returning to the client. Supports extracting a specific property from JSON responses and applying post-processing transformations. The legacy storeTo field (bucket persistence of generated media) was removed — never consumed by any generator; the migrator drops it from old blueprints.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `responseProperty` | `String` | no |  |  |  | When the model returns JSON, extract this property as the response value. Example: 'result' extracts the 'result' field from the model's JSON output. Leave null to return the full response. |
| `postProcess` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression to transform the model's output before sending to the client. The raw response is available as 'result'. Example: `{ "js": "result.trim().toUpperCase()" }` or a more complex transformation function. |
| `requiresApproval` | `Boolean` | no | `false` |  |  | Draft-then-approve execution mode: when true, the agent's FINAL output is held as a DRAFT — instead of returning (and post-processing) the answer, the run pauses in the 'paused_approval' state with the draft riding the pending-approval entry. An approver (hubSettings.hubBasics.approvalRoles) releases it via the hub approval API: approve delivers the output (postProcess runs at approval time, and for chat agents the conversation history persists then), reject terminates the run with status 'rejected'. The common top-level agent.approvalExpiryDays controls how long this draft may wait; null/unset disables expiry. Default: false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
