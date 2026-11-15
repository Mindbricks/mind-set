# ElasticLogsSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ElasticLogsSettings in Part 1](../ontology/ElasticLogsSettings.md)

Registry container for the project's ElasticLog declarations (docs/ADR-elastic-log-pattern.md). Mirrors the bucketProvidersSettings shape: a single named array under projectSettings. Each ElasticLog is an ES-only, append-only, ILM-retained log — the mcpbff owns its index lifecycle and every service writes/reads it directly via generated helpers.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `elasticLogs` | [`ElasticLog`](./ElasticLog.md)[] | no |  |  |  | List of declared ElasticLogs. Add one entry per ES-only append log (audit trail, send record, telemetry) you want available project-wide. |

## Constraints

Property rules:

- The items of `elasticLogs` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
