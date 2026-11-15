# VideoSmartSearchSettings

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoSmartSearchSettings in Part 1](../ontology/VideoSmartSearchSettings.md)

Search over the room's transcripts and insights. Indexed into the project Elasticsearch (the same infrastructure services already run on) and exposed on the room's auto search route (/videoroom/{name}/search — codegen phase). With an embeddingProviderName set, segments are also embedded and the route upgrades to hybrid keyword + semantic search ('find where pricing was discussed' matches even without the word 'pricing').

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for smart search. Default: false. |
| `indexTranscripts` | `Boolean` | no | `true` |  |  | Index transcript segments (requires aiPipeline.transcription.enabled). Default: true. |
| `indexInsights` | `Boolean` | no | `true` |  |  | Index meeting-analysis insight rows (requires aiPipeline.meetingAnalysis.enabled). Default: true. |
| `embeddingProviderName` | `String` | no |  |  |  | Optional name of an AI provider (projectSettings.aiProvidersSettings.aiProviders[].name) used to embed segments for semantic search. Null/absent = keyword search only. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
