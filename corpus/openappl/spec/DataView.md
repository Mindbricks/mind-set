# DataView

**Level:** `chapter` · **Family:** [DataView](../ontology/families.md#dataview) (domain `BFFService`)

**Ontology:** [DataView in Part 1](../ontology/DataView.md)

**Name:** an instance is named by `viewBasics.name`.

A DataView defines an aggregated projection of data for the BFF service in OpenAPPL. It serves as a unified structure that collects and combines information from multiple microservices. DataViews can be configured as either *stored* or *dynamic*. Stored DataViews persist their results in Elasticsearch and are optimal for queries requiring filtering, sorting, or cross-service joins. Dynamic DataViews are assembled at runtime during the request cycle and are suitable for lightweight, user-specific, or real-time scenarios. Both types aim to simplify frontend development by consolidating distributed data into a single, queryable view.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `viewBasics` | [`ViewBasics`](./ViewBasics.md) | yes |  |  |  | Basic metadata and configuration for the DataView, including its name, storage strategy, source object, and selected properties. This section determines the fundamental structure and behavior of the view. |
| `aggregates` | [`ViewAggregate`](./ViewAggregate.md)[] | no |  |  |  | A list of aggregate definitions that perform data joins from related objects, similar to SQL joins. These are used to enrich the DataView with related datasets, such as joining orders into a customer view. |
| `stats` | [`ViewStat`](./ViewStat.md)[] | no |  |  |  | A list of statistical calculations performed within the view to enrich it with precomputed analytics. |

## Constraints

Property rules:

- `viewBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `aggregates` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `stats` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `lookups` | items deprecated | | Items of type `ViewLookup` are deprecated. |

## Example

Use a DataView to consolidate data from multiple microservices into one queryable projection for the frontend — choose isStored=true (Elasticsearch-backed, filterable/sortable) for cross-service joins, or dynamic for lightweight per-request assembly. This example builds a customer view enriched with their orders and per-customer order stats.

```json
{
  "viewBasics": {
    "name": "customerOverviewView",
    "isStored": true,
    "mainObject": "customer",
    "properties": [
      "id",
      "fullName",
      "email",
      "loyaltyTier"
    ]
  },
  "aggregates": [
    {
      "name": "recentOrders",
      "childObject": "order",
      "parentKey": "id",
      "childKey": "customerId",
      "oneToMany": true,
      "properties": [
        "id",
        "orderNumber",
        "totalAmount",
        "status"
      ]
    }
  ],
  "stats": [
    {
      "name": "orderStats",
      "childObject": "order",
      "parentKey": "id",
      "childKey": "customerId",
      "aggList": [
        {
          "name": "orderCount",
          "aggType": "count",
          "aggField": "id",
          "dataType": "Integer"
        },
        {
          "name": "lifetimeValue",
          "aggType": "sum",
          "aggField": "totalAmount",
          "dataType": "Double"
        }
      ]
    }
  ]
}
```
