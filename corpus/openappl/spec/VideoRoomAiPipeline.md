# VideoRoomAiPipeline

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomAiPipeline in Part 1](../ontology/VideoRoomAiPipeline.md)

The AI layer on top of the video room (docs/ADR-video-conference-pattern-family.md §8) — pure composition of existing OpenAPPL layers, no new provider system. transcription turns the session's audio into {name}Transcript segment rows (speech-to-text via a NAMED projectSettings.aiProvidersSettings provider); liveTranslation translates the live captions into target languages on the room data channel; meetingAnalysis runs LLM passes over the transcript into {name}MeetingInsight rows; smartSearch indexes transcripts + insights into the project Elasticsearch (optionally with embeddings for semantic search). Post-session shape: roomEnded event → transcription job (recording artifact from the bucket) → analysis job → index; each stage publishes its own Kafka completion event. (AI meeting/voice agents that JOIN the room as participants are a deliberately-deferred AgentHub tie-in — ADR §8b.)

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `transcription` | [`VideoTranscriptionSettings`](./VideoTranscriptionSettings.md) | no |  |  |  | Speech-to-text over the room session. Required by liveTranslation, meetingAnalysis and (for transcript indexing) smartSearch. |
| `liveTranslation` | [`VideoLiveTranslationSettings`](./VideoLiveTranslationSettings.md) | no |  |  |  | Live translation of the room's captions into target languages, relayed on the room data channel. Requires transcription with mode 'live' or 'both'. |
| `meetingAnalysis` | [`VideoMeetingAnalysisSettings`](./VideoMeetingAnalysisSettings.md) | no |  |  |  | LLM analysis passes over the transcript — summary, action items, decisions, topics, sentiment, plus custom prompts. Requires transcription. |
| `smartSearch` | [`VideoSmartSearchSettings`](./VideoSmartSearchSettings.md) | no |  |  |  | Keyword (and optionally semantic) search over transcripts and insights, indexed into the project Elasticsearch and exposed on the room's auto search route. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
