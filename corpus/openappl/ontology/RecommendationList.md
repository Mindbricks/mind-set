# RecommendationList

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [RecommendationList in Part 2](../spec/RecommendationList.md)

One recommendation list of an item object (recommendation ADR section 4). It declares the list kind, the evidence relations that feed it, how pairs are scored, how much is precomputed and served, the deterministic filters and list policy, and the engine and refresh schedule. Presets (bought together, readers also read, trending) are authoring presets that expand into an ordinary list; they are not ontology.

## Contained in

- [RecommendationSettings](./RecommendationSettings.md) as `lists` (a list)

## Contains

- `evidence`: [RecommendationEvidence](./RecommendationEvidence.md), a list
- `filters`: [RecommendationFilters](./RecommendationFilters.md)
- `listPolicy`: [RecommendationListPolicy](./RecommendationListPolicy.md)
- `rerank`: [RecommendationRerank](./RecommendationRerank.md)
- `api`: [RecommendationApi](./RecommendationApi.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
