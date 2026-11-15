# ElasticLog

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [ElasticLog in Part 2](../spec/ElasticLog.md)

A single ES-only append log declaration. Sibling of DataObject but with NO relational baggage (no SQL/Mongo model, no soft-delete, no relations). Declares its own mapping fields, a self-owned timestamp field, and a retention window. The mcpbff creates + maintains the ES index (mapping + ILM + rolling write alias); services write with writeToESLog_<name>(obj) and read with queryESLog_<name>(body) directly against ES.

## Contained in

- [ElasticLogsSettings](./ElasticLogsSettings.md) as `elasticLogs` (a list)

## Contains

- `fields`: [ElasticLogField](./ElasticLogField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
