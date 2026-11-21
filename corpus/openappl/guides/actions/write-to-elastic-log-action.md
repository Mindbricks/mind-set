# WriteToElasticLogAction

Append an object to a declared log. Match its fields to the log mapping. The writer stamps the timestamp when it is absent. An undeclared `logName` cannot resolve to a writer and must be corrected in the blueprint.

See the [pattern reference](../../spec/WriteToElasticLogAction.md) and the [ElasticLog guide](../composition/elastic-log.md).
