# RetentionPolicy

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [RetentionPolicy in Part 2](../spec/RetentionPolicy.md)

[P4 DONE] An EventStream's retention/rollup/archival cadence. Drives a generated retention cron that prunes cold rows older than coldRetentionDays (the hot-store TTL on HotStoreBinding ages the hot tier natively). archiveToParquet is the P5 trigger.

## Contained in

- [EventStream](./EventStream.md) as `retention`

Blueprint paths:

- `services.eventStreams.retention`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
