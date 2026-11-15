# ColdSinkBinding

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [ColdSinkBinding in Part 1](../ontology/ColdSinkBinding.md)

[P4 DONE; s3Parquet=P5] Binds an EventStream's durable/archival sink for the full append-only history. References a `bigLoadProvidersSettings` store BY NAME (engine cassandra or s3Parquet). The cold writer appends every record off the batched flush into a NO-TTL Cassandra table (P4); for s3Parquet it batches rows into Parquet objects via the bucket adapter (Phase 5).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the bigLoadProvidersSettings store the cold history is written to (engine cassandra or s3Parquet). |
| `table` | `String` | no |  |  |  | [cassandra] The append table name. [s3Parquet] ignored (objects keyed under the provider prefix). |
| `objectPrefix` | `String` | no |  |  |  | [s3Parquet] Key prefix under which Parquet objects are written (e.g. `vehicle-pings/`). Combined with the provider's configured prefix. |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
