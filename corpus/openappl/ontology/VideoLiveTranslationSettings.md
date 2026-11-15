# VideoLiveTranslationSettings

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoLiveTranslationSettings in Part 2](../spec/VideoLiveTranslationSettings.md)

Live caption translation for the room. Each live transcript segment is translated into the target languages by the named AI provider and relayed to participants over the room data channel as caption events (each participant's client picks the language to display). Requires aiPipeline.transcription enabled with mode 'live' or 'both'. Translated captions are ephemeral by default; when persistTranslations is true they are stored as extra {name}Transcript rows tagged with their language.

## Contained in

- [VideoRoomAiPipeline](./VideoRoomAiPipeline.md) as `liveTranslation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
