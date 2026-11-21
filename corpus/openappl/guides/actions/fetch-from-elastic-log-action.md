# FetchFromElasticLogAction

Query a declared log using an Elasticsearch search body. The action puts `{ items, aggregations, total }` in its context slot. Read rows from `items`. An undeclared `logName` is a blueprint error. An array operation on the whole result addresses the envelope instead of its rows.

See the [pattern reference](../../spec/FetchFromElasticLogAction.md) and the [ElasticLog guide](../composition/elastic-log.md).
