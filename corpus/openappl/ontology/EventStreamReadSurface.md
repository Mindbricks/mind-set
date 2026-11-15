# EventStreamReadSurface

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [EventStreamReadSurface in Part 2](../spec/EventStreamReadSurface.md)

A generated read API over an EventStream's stores. Each surface is a query archetype selected via `type` and exposed as an api-layer route under `/<stream>/<name>`. Phase 3 wires the hot-store surfaces: `latestN` (the last-N records for a partition, ordered by the clustering column) and `currentState` (the single most-recent record for a partition).

## Contained in

- [EventStream](./EventStream.md) as `readSurfaces` (a list)

Blueprint paths:

- `services.eventStreams.readSurfaces`

## Contains

- `judgement`: [DecisionPageJudgement](./DecisionPageJudgement.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
