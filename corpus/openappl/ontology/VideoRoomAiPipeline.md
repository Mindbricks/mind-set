# VideoRoomAiPipeline

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomAiPipeline in Part 2](../spec/VideoRoomAiPipeline.md)

The AI layer on top of the video room (docs/ADR-video-conference-pattern-family.md §8) — pure composition of existing OpenAPPL layers, no new provider system. transcription turns the session's audio into {name}Transcript segment rows (speech-to-text via a NAMED projectSettings.aiProvidersSettings provider); liveTranslation translates the live captions into target languages on the room data channel; meetingAnalysis runs LLM passes over the transcript into {name}MeetingInsight rows; smartSearch indexes transcripts + insights into the project Elasticsearch (optionally with embeddings for semantic search). Post-session shape: roomEnded event → transcription job (recording artifact from the bucket) → analysis job → index; each stage publishes its own Kafka completion event. (AI meeting/voice agents that JOIN the room as participants are a deliberately-deferred AgentHub tie-in — ADR §8b.)

## Contained in

- [VideoRoom](./VideoRoom.md) as `aiPipeline`

Blueprint paths:

- `services.videoRooms.aiPipeline`

## Contains

- `transcription`: [VideoTranscriptionSettings](./VideoTranscriptionSettings.md)
- `liveTranslation`: [VideoLiveTranslationSettings](./VideoLiveTranslationSettings.md)
- `meetingAnalysis`: [VideoMeetingAnalysisSettings](./VideoMeetingAnalysisSettings.md)
- `smartSearch`: [VideoSmartSearchSettings](./VideoSmartSearchSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
