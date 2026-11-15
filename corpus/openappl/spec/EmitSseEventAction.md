# EmitSseEventAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [EmitSseEventAction in Part 1](../ontology/EmitSseEventAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Emits a custom SSE event during the workflow. The event name and payload are declaratively configured. When the API is called via REST (no SSE context), this action is a silent no-op.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `eventName` | `String` | yes |  |  |  | The SSE event name to emit to the client (e.g., 'jobCreated', 'phaseComplete'). |
| `data` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluated against the pipeline context to build the event payload. |

## Constraints

Property rules:

- `eventName`, `data` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EXPLICIT_EVENT_NAME_REQUIRED` | error | EmitSseEventAction "…" must declare an explicit SSE event name (non-empty string). |
| `SSE_EVENT_NAME_WHITESPACE` | error | EmitSseEventAction eventName "…" contains whitespace. |

## Example

Use to push a named progress / status event to a connected SSE client mid-workflow (long-running jobs, multi-phase pipelines); it is a silent no-op when the API is invoked over plain REST.

```json
{
  "name": "notifyPhaseComplete",
  "description": "Tell the client the import phase finished and how many rows were processed.",
  "eventName": "importPhaseComplete",
  "data": { "js": "{ phase: 'import', processed: this.importedRows.length, nextPhase: 'validation' }" }
}
```
