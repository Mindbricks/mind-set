# RecommendationFilters

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [RecommendationFilters in Part 2](../spec/RecommendationFilters.md)

Deterministic serve-time filters of a recommendation list (recommendation ADR section 5.2). They are re-applied to every candidate while it is hydrated; none of them may be a decision-provider call.

## Contained in

- [RecommendationList](./RecommendationList.md) as `filters`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
