# ElasticLogsSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ElasticLogsSettings in Part 2](../spec/ElasticLogsSettings.md)

Registry container for the project's ElasticLog declarations (docs/ADR-elastic-log-pattern.md). Mirrors the bucketProvidersSettings shape: a single named array under projectSettings. Each ElasticLog is an ES-only, append-only, ILM-retained log — the mcpbff owns its index lifecycle and every service writes/reads it directly via generated helpers.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `elasticLogsSettings`

Blueprint paths:

- `projectSettings.elasticLogsSettings`

## Contains

- `elasticLogs`: [ElasticLog](./ElasticLog.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
