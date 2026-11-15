# ColdSinkBinding

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [ColdSinkBinding in Part 2](../spec/ColdSinkBinding.md)

[P4 DONE; s3Parquet=P5] Binds an EventStream's durable/archival sink for the full append-only history. References a `bigLoadProvidersSettings` store BY NAME (engine cassandra or s3Parquet). The cold writer appends every record off the batched flush into a NO-TTL Cassandra table (P4); for s3Parquet it batches rows into Parquet objects via the bucket adapter (Phase 5).

## Contained in

- [EventStream](./EventStream.md) as `coldSink`

Blueprint paths:

- `services.eventStreams.coldSink`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
