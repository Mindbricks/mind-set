# VideoLiveTranslationSettings

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoLiveTranslationSettings in Part 1](../ontology/VideoLiveTranslationSettings.md)

Live caption translation for the room. Each live transcript segment is translated into the target languages by the named AI provider and relayed to participants over the room data channel as caption events (each participant's client picks the language to display). Requires aiPipeline.transcription enabled with mode 'live' or 'both'. Translated captions are ephemeral by default; when persistTranslations is true they are stored as extra {name}Transcript rows tagged with their language.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for live translation. Default: false. |
| `providerName` | `String` | no |  |  |  | Name of the AI provider to translate with (must match a projectSettings.aiProvidersSettings.aiProviders[].name). Defaults to the transcription provider when absent. |
| `targetLanguages` | `String`[] | no |  |  |  | BCP-47 language codes to translate the live captions into (e.g. ['en', 'tr', 'de']). At least one required when enabled. |
| `persistTranslations` | `Boolean` | no | `false` |  |  | When true, translated caption segments are also persisted as {name}Transcript rows tagged with their language (searchable). When false (default), translations are ephemeral data-channel events only. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
