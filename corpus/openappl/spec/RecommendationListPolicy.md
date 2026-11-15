# RecommendationListPolicy

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationListPolicy in Part 1](../ontology/RecommendationListPolicy.md)

Diversity and dedupe rules of a recommendation list, applied to the filtered, ranked page.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dedupeBy` | `String` | no |  |  |  | Property of the item object: at most one item per value is returned (e.g. one variant per product group). |
| `maxPerValueProperty` | `String` | no |  |  |  | Property of the item object whose values are capped by `maxPerValueCount` (e.g. brand). |
| `maxPerValueCount` | `Integer` | no |  |  |  | The most items returned per value of `maxPerValueProperty`. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
