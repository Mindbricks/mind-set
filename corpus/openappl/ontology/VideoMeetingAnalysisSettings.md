# VideoMeetingAnalysisSettings

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoMeetingAnalysisSettings in Part 2](../spec/VideoMeetingAnalysisSettings.md)

LLM meeting-analysis passes over the room transcript (requires aiPipeline.transcription.enabled). Each enabled analysis produces {name}MeetingInsight DataObject rows (sessionId, kind, content) and an insightsReady Kafka event fires when the pass completes. customAnalyses add domain-specific extraction prompts beyond the built-in toggles (e.g. 'objections raised in a sales call', 'homework assigned in a lesson').

## Contained in

- [VideoRoomAiPipeline](./VideoRoomAiPipeline.md) as `meetingAnalysis`

## Contains

- `customAnalyses`: [VideoCustomAnalysis](./VideoCustomAnalysis.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
