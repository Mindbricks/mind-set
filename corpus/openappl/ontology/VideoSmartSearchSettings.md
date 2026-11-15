# VideoSmartSearchSettings

**Level:** `subsection` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoSmartSearchSettings in Part 2](../spec/VideoSmartSearchSettings.md)

Search over the room's transcripts and insights. Indexed into the project Elasticsearch (the same infrastructure services already run on) and exposed on the room's auto search route (/videoroom/{name}/search — codegen phase). With an embeddingProviderName set, segments are also embedded and the route upgrades to hybrid keyword + semantic search ('find where pricing was discussed' matches even without the word 'pricing').

## Contained in

- [VideoRoomAiPipeline](./VideoRoomAiPipeline.md) as `smartSearch`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
