# AgentVideoSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentVideoSettings in Part 1](../ontology/AgentVideoSettings.md)

Video generation parameters. Only applicable when modality is 'video'. Video generation is typically asynchronous — the agent polls for completion and streams progress events via SSE.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `duration` | `Integer` | no |  |  | min 1 | Target video duration in seconds. Available range depends on the provider and model. Common: 4-16 seconds. |
| `aspectRatio` | `String` | no | `"16:9"` |  |  | Video aspect ratio. Common values: '16:9' (landscape), '9:16' (portrait/vertical), '1:1' (square). |
| `resolution` | `String` | no | `"720p"` |  |  | Video resolution. Common values: '720p', '1080p'. Higher resolution may cost more and take longer. |

## Constraints

Property rules:

- `duration` must be at least 1. (`VALUE_OUT_OF_RANGE`)
