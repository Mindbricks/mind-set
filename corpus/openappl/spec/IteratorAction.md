# IteratorAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [IteratorAction in Part 1](../ontology/IteratorAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

A generic streaming action whose method returns an async iterable. The sourceScript MScript expression must evaluate to an object with Symbol.asyncIterator (async generator, readable stream, etc.). Designed for custom streaming logic that isn't covered by AiCallAction.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sourceScript` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression that evaluates to an async iterable. Example: LIB.streamProcessor(this.data) |

## Constraints

Property rules:

- `sourceScript` must be present. (`REQUIRED_FIELD_MISSING`)

## Example

Use for custom streaming output not covered by AiCallAction — sourceScript must evaluate to an async-iterable (async generator, readable stream) whose chunks are streamed to the SSE client.

```json
{
  "name": "streamReport",
  "description": "Stream a large report row-by-row from a custom library generator.",
  "sourceScript": { "js": "LIB.reports.streamRows(this.data.reportId, this.session.userId)" },
  "contextPropertyName": "reportStream"
}
```
