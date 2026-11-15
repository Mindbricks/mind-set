# WriteToElasticLogAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [WriteToElasticLogAction in Part 1](../ontology/WriteToElasticLogAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

BusinessApiAction that appends an object to a declared ElasticLog by name. Compiles to a direct call to the generated writeToESLog_<logName> helper — a local ES write, NOT an interservice call (logs are high-volume).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `logName` | `String` | yes |  |  |  | The name of the target ElasticLog (must match a projectSettings.elasticLogsSettings.elasticLogs[].name). Resolves to the writeToESLog_<name> helper at codegen time. |
| `logObject` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression evaluating to the object to append to the log. Its keys should match the ElasticLog's declared mapping fields; the timestamp field is stamped automatically when absent. |

## Constraints

Property rules:

- `logName`, `logObject` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ELASTIC_LOG_NAME_REQUIRED` | error | WriteToElasticLogAction.logName is required — name a declared projectSettings.elasticLogsSettings.elasticLogs[] entry. |
| `ELASTIC_LOG_OBJECT_REQUIRED` | error | WriteToElasticLogAction.logObject is required — provide an MScript expression for the object to append. |
