# VideoCustomAnalysis

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoCustomAnalysis in Part 2](../spec/VideoCustomAnalysis.md)

One domain-specific LLM analysis pass over the room transcript. The prompt receives the full transcript and must describe the desired extraction; the result is stored as a {name}MeetingInsight row with kind = this analysis's name.

## Contained in

- [VideoMeetingAnalysisSettings](./VideoMeetingAnalysisSettings.md) as `customAnalyses` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
