# RecommendationRerank

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [RecommendationRerank in Part 2](../spec/RecommendationRerank.md)

Optional decision-provider rerank of a recommendation list (recommendation ADR section 7). One batched, bounded request covers the filtered candidate page, and it always fails open: a provider error returns the unreranked list. It only ranks: it never generates candidates and never filters. Emitted by slice R5.

## Contained in

- [RecommendationList](./RecommendationList.md) as `rerank`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
