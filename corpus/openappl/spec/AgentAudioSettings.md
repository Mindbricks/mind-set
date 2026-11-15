# AgentAudioSettings

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentAudioSettings in Part 1](../ontology/AgentAudioSettings.md)

Audio generation or transcription parameters. Only applicable when modality is 'audio'. Supports text-to-speech (TTS) and speech-to-text (STT) directions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `direction` | `AgentAudioDirection` | yes |  | `tts`, `stt` |  | The audio processing direction: 'tts' converts text to speech audio, 'stt' converts speech audio to text. |
| `voice` | `String` | no |  |  |  | Voice identifier for TTS. Provider-specific (e.g., 'alloy', 'echo' for OpenAI; voice IDs for ElevenLabs). Leave null for provider default. |
| `outputFormat` | `AgentAudioOutputFormat` | no | `"mp3"` | `mp3`, `wav`, `opus`, `flac` |  | Audio output format for TTS: 'mp3', 'wav', 'opus', or 'flac'. Defaults to 'mp3'; the adapters then map that onto each provider's own spelling (ElevenLabs sends 'mp3_44100_128'). |
| `language` | `String` | no |  |  |  | Language code for STT transcription (e.g., 'en', 'tr', 'de'). Leave null for auto-detection. |

## Constraints

Property rules:

- `direction` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction`, `outputFormat` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
