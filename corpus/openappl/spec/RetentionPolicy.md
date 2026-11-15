# RetentionPolicy

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [RetentionPolicy in Part 1](../ontology/RetentionPolicy.md)

[P4 DONE] An EventStream's retention/rollup/archival cadence. Drives a generated retention cron that prunes cold rows older than coldRetentionDays (the hot-store TTL on HotStoreBinding ages the hot tier natively). archiveToParquet is the P5 trigger.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hotTtlSeconds` | `Integer` | no |  |  |  | Intended hot-store retention in seconds, mirroring HotStoreBinding.ttlSeconds. Generated Node.js Cassandra hot stores apply it through native row TTL. Null/absent preserves the binding TTL; explicit 0 disables TTL. Values must be nonnegative safe integers. When both aliases are explicitly declared they must be equal, including 0; conflicting values refuse generation rather than choosing precedence. Use one declaration or matching declarations. This Node.js mirror support adds neither policy consumption to other language generators nor a retention cron for other engines. |
| `coldRetentionDays` | `Integer` | no |  |  |  | Cold-sink retention in days. 0/absent = retain indefinitely. |
| `rollupCron` | `String` | no |  |  |  | Cron expression for the rollup/archival cadence, e.g. `*/15 * * * *`. Reuses the existing cron-controller runtime. |
| `archiveToParquet` | `Boolean` | no | `false` |  |  | When true, the retention cron triggers the cold-archival-to-Parquet path (Phase 5). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
