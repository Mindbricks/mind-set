# EventStreamBasics

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [EventStreamBasics in Part 1](../ontology/EventStreamBasics.md)

**Name:** an instance is named by `name`.

The scalar identity + axes of an EventStream (the chapter's first section). Holds the name/codeName, the Kafka topic the ingest path publishes to, the event/telemetry SCHEMA (the field shape the ingest API validates + the hot row columns), the partition key, the delivery semantics, and the global back-pressure / load-shedding knobs. Grouped into a section because a chapter contains sections, not loose scalar columns.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique stream identifier within the service. Drives the generated ingest route base (`/ingest/<name>`), the hot table default name, the read-surface route base, and the asset-name-path. Must be a valid codeName. |
| `codeName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional machine code name override. Defaults to `name` when absent. |
| `description` | `Text` | no |  |  |  | Optional human-readable description of what telemetry this stream carries. |
| `topic` | `String` | no |  |  |  | The Kafka topic the ingestion path publishes to (and the hot/cold/analytics consumers read). When absent, codegen derives `<projectCodename>-<service>-<name>` (the standard event-topic shape). Phase 3 may write the hot store directly from the ingest handler for the live round-trip; the topic remains the seam for the decoupled consumers (P4). |
| `eventSchema` | [`EventStreamEventField`](./EventStreamEventField.md)[] | no |  |  |  | The telemetry/event field shape the ingest API accepts and the hot row stores (EventStreamEventField[]). Each field is a typed column; the ingestion handler validates the body against these and the hot writer maps them onto the table. Keep this lean (the big-load discipline) — large blobs belong in a bucket, referenced by key. |
| `partitionKey` | `String` | yes |  |  |  | Name of the eventSchema field used as the storage partition key (e.g. `vehicleId`). The hot store partitions by this so all rows for one entity colocate; reads target one partition. REQUIRED — the big-load family is partition-first. |
| `clusteringKey` | `String` | no |  |  |  | Name of the eventSchema field rows are clustered/ordered by within a partition (typically the timestamp, e.g. `ts`). Drives the hot-store clustering column + the latest-N ordering. Defaults to the first Date-typed field when absent. |
| `deliverySemantics` | `String` | no | `"atLeastOnce"` |  |  | Intended delivery-guarantee selector: atMostOnce, atLeastOnce (declared default), or exactlyOnce. Node.js currently uses an in-memory batch buffer with bounded retry and can lose acknowledged buffered rows on process loss or sustained store failure; it does not implement durable atLeastOnce or exactlyOnce. Changing this field does not change the generated delivery policy. A durable-ingest contract and default-compatibility ruling are required before activation. idempotencyKey supplies a bounded process-local dedup window, not durable delivery. |
| `maxInFlight` | `Integer` | no | `10000` |  |  | Back-pressure knob: the maximum number of un-flushed records the ingest handler buffers before it applies back-pressure. Admission past the bound is rejected with HTTP 429 — the buffer never grows past maxInFlight. Guards the thin write path from unbounded memory growth under a burst. Defaults to 10000 when absent. |
| `loadSheddingPriority` | `String` | no | `"normal"` |  |  | Drop order under aggregate pressure (low \| normal \| high \| critical, default normal): as the service's aggregate in-flight total (the sum of every stream's un-flushed buffer) fills the aggregate capacity (the sum of every stream's maxInFlight), lower priorities start rejecting (HTTP 429) earlier — `low` sheds at >=50% aggregate fill, `normal` at >=75%, `high` at >=90%; `critical` is never shed by aggregate pressure and is bounded only by its own maxInFlight. Kept as String in v1. |

## Constraints

Property rules:

- `name`, `partitionKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `codeName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `eventSchema` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
