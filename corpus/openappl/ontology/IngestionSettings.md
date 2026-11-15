# IngestionSettings

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [IngestionSettings in Part 2](../spec/IngestionSettings.md)

The write-path tuning for an EventStream (see the family's design record, §5). Governs the thin, fast, async batched insert the generated ingest handler performs — batching cadence, dedup, rate limit, shedding. The handler does auth → schema-validate → (dedup) → enqueue/batch → fast return; NO heavy per-row work runs here (that belongs in the compute layer or the Spark cleaning stage).

## Contained in

- [EventStream](./EventStream.md) as `ingestion`

Blueprint paths:

- `services.eventStreams.ingestion`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
