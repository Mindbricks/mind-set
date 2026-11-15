# VideoTranscriptionSettings

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoTranscriptionSettings in Part 1](../ontology/VideoTranscriptionSettings.md)

Speech-to-text configuration for the room. The provider is a NAMED projectSettings.aiProvidersSettings entry with an audio-transcription capable backend (e.g. an openai entry for whisper/gpt-4o-transcribe, or a google entry). postSession mode consumes the recording artifact from the recording bucket (requires recordingSettings.enabled); live mode streams captions to participants over the room data channel as the session runs. Output: {name}Transcript DataObject rows (sessionId, participantId, startMs, endMs, text, confidence) + a transcriptReady Kafka event.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for transcription. Default: false. |
| `providerName` | `String` | yes |  |  |  | Name of the AI provider to transcribe with (must match a projectSettings.aiProvidersSettings.aiProviders[].name whose backend supports audio transcription). |
| `mode` | `VideoTranscriptionMode` | no | `"postSession"` | `postSession`, `live`, `both` |  | 'postSession' (default) = transcribe the recording artifact after the session ends (requires recordingSettings.enabled). 'live' = streaming captions during the session, relayed to participants over the data channel. 'both' = live captions AND an authoritative post-session pass. |
| `language` | `String` | no |  |  |  | BCP-47 language pin for the audio (e.g. 'en', 'tr', 'de'). Null/absent = auto-detect. |
| `diarization` | `Boolean` | no | `true` |  |  | Reserved speaker-diarization toggle (default true). Currently not consumed: transcription calls do not pass a diarization parameter, so this setting does not provide speaker-separated transcripts. True raises the design-time VIDEO_TRANSCRIPTION_DIARIZATION_IGNORED warning. |
| `transcriptDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the auto-generated transcript DataObject. Defaults to '{roomName}Transcript'. Must be a valid code name. |

## Constraints

Property rules:

- `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `transcriptDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
