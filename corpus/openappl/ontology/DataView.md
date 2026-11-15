# DataView

**Level:** `chapter` · **Family:** [DataView](./families.md#dataview) (domain `BFFService`)

**Specification:** [DataView in Part 2](../spec/DataView.md)

A DataView defines an aggregated projection of data for the BFF service in OpenAPPL. It serves as a unified structure that collects and combines information from multiple microservices. DataViews can be configured as either *stored* or *dynamic*. Stored DataViews persist their results in Elasticsearch and are optimal for queries requiring filtering, sorting, or cross-service joins. Dynamic DataViews are assembled at runtime during the request cycle and are suitable for lightweight, user-specific, or real-time scenarios. Both types aim to simplify frontend development by consolidating distributed data into a single, queryable view.

## Contained in

- [BFFService](./BFFService.md) as `dataViews` (a list)

Blueprint paths:

- `bffService.dataViews`

## Contains

- `viewBasics`: [ViewBasics](./ViewBasics.md)
- `aggregates`: [ViewAggregate](./ViewAggregate.md), a list
- `stats`: [ViewStat](./ViewStat.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
