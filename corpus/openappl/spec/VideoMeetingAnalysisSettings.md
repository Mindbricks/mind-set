# VideoMeetingAnalysisSettings

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoMeetingAnalysisSettings in Part 1](../ontology/VideoMeetingAnalysisSettings.md)

LLM meeting-analysis passes over the room transcript (requires aiPipeline.transcription.enabled). Each enabled analysis produces {name}MeetingInsight DataObject rows (sessionId, kind, content) and an insightsReady Kafka event fires when the pass completes. customAnalyses add domain-specific extraction prompts beyond the built-in toggles (e.g. 'objections raised in a sales call', 'homework assigned in a lesson').

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for meeting analysis. Default: false. |
| `providerName` | `String` | yes |  |  |  | Name of the LLM provider to analyze with (must match a projectSettings.aiProvidersSettings.aiProviders[].name). |
| `summary` | `Boolean` | no | `true` |  |  | Generate a meeting summary insight. Default: true. |
| `actionItems` | `Boolean` | no | `true` |  |  | Extract action items (task, owner, due hint). Default: true. |
| `decisions` | `Boolean` | no | `false` |  |  | Extract decisions made during the session. Default: false. |
| `topics` | `Boolean` | no | `false` |  |  | Extract the topics discussed with time ranges. Default: false. |
| `sentiment` | `Boolean` | no | `false` |  |  | Analyze overall and per-participant sentiment. Default: false. |
| `customAnalyses` | [`VideoCustomAnalysis`](./VideoCustomAnalysis.md)[] | no |  |  |  | Domain-specific analysis prompts beyond the built-in toggles. Each entry produces its own insight kind. |
| `insightDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the auto-generated insight DataObject. Defaults to '{roomName}MeetingInsight'. Must be a valid code name. |

## Constraints

Property rules:

- `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `insightDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `customAnalyses` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
