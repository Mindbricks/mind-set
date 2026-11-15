# VideoTranscriptionSettings

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoTranscriptionSettings in Part 2](../spec/VideoTranscriptionSettings.md)

Speech-to-text configuration for the room. The provider is a NAMED projectSettings.aiProvidersSettings entry with an audio-transcription capable backend (e.g. an openai entry for whisper/gpt-4o-transcribe, or a google entry). postSession mode consumes the recording artifact from the recording bucket (requires recordingSettings.enabled); live mode streams captions to participants over the room data channel as the session runs. Output: {name}Transcript DataObject rows (sessionId, participantId, startMs, endMs, text, confidence) + a transcriptReady Kafka event.

## Contained in

- [VideoRoomAiPipeline](./VideoRoomAiPipeline.md) as `transcription`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
