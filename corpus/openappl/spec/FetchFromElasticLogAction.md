# FetchFromElasticLogAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FetchFromElasticLogAction in Part 1](../ontology/FetchFromElasticLogAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

BusinessApiAction that queries a declared ElasticLog by name with an Elasticsearch search body and writes the hits to the action context. Compiles to a direct call to the generated queryESLog_<logName> helper. The context property receives a normalized ENVELOPE — `{ items, aggregations, total }` and nothing else: `items` is the matching lines (each hit's `_source`), `aggregations` is the response's aggregation result verbatim (null when the body asks for none), and `total` is the total hit count — so a single line is read as `this.<contextPropertyName>.items[0]?.<field>` and a rollup as `this.<contextPropertyName>.aggregations.<name>.buckets`, never `this.<contextPropertyName>.<field>`, which is undefined by construction (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `logName` | `String` | yes |  |  |  | The name of the ElasticLog to query (must match a declared projectSettings.elasticLogsSettings.elasticLogs[].name). |
| `body` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression evaluating to an Elasticsearch search-body object (query / sort / from / size in ES's own format, not the abstract MScript query format). Defaults to a match_all over the most recent lines when absent. |

## Constraints

Property rules:

- `logName`, `body` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ELASTIC_LOG_NAME_REQUIRED` | error | FetchFromElasticLogAction.logName is required — name a declared projectSettings.elasticLogsSettings.elasticLogs[] entry. |
