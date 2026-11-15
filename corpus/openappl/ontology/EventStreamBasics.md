# EventStreamBasics

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [EventStreamBasics in Part 2](../spec/EventStreamBasics.md)

The scalar identity + axes of an EventStream (the chapter's first section). Holds the name/codeName, the Kafka topic the ingest path publishes to, the event/telemetry SCHEMA (the field shape the ingest API validates + the hot row columns), the partition key, the delivery semantics, and the global back-pressure / load-shedding knobs. Grouped into a section because a chapter contains sections, not loose scalar columns.

## Contained in

- [EventStream](./EventStream.md) as `streamBasics`

Blueprint paths:

- `services.eventStreams.streamBasics`

## Contains

- `eventSchema`: [EventStreamEventField](./EventStreamEventField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
