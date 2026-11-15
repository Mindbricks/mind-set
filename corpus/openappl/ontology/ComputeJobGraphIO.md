# ComputeJobGraphIO

**Level:** `section` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [ComputeJobGraphIO in Part 2](../spec/ComputeJobGraphIO.md)

Graph I/O ends for a ComputeJob (docs/ADR-graph-database-layer.md §12). `reads` feeds a GraphQuery result into the recipe; `writes` persists computed edges back into the graph. Both are optional — a job may read only, write only, or both. So compute produces enriched relationships; the graph persists and serves them (GraphQuery serves top-N at request time, no compute on the hot path).

## Contained in

- [ComputeJob](./ComputeJob.md) as `graphIO`

Blueprint paths:

- `services.computeJobs.graphIO`

## Contains

- `reads`: [GraphIORead](./GraphIORead.md)
- `writes`: [GraphIOWrite](./GraphIOWrite.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
