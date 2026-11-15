# RecommendationSettings

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [RecommendationSettings in Part 2](../spec/RecommendationSettings.md)

Recommendation lists of a data object as the ITEM being recommended (docs/ADR-recommendation-engine.md section 4). The pipeline per list: candidate generation from precomputed neighbor / popularity tables, deterministic filtering, scoring and ranking, list policy, serving with a `listRequestId`, impression logging. The lists live on the item's own service and inherit the item's read gate, tenant scope and visibility. No authorization or filtering decision may come from a recommendation score or a decision provider (ADR hard rule 1).

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `recommendationSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings.recommendationSettings`
- `services.dataObjects.objectSettings.recommendationSettings`

## Contains

- `sources`: [InteractionSource](./InteractionSource.md), a list
- `lists`: [RecommendationList](./RecommendationList.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
