# RecommendationRerank

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationRerank in Part 1](../ontology/RecommendationRerank.md)

Optional decision-provider rerank of a recommendation list (recommendation ADR section 7). One batched, bounded request covers the filtered candidate page, and it always fails open: a provider error returns the unreranked list. It only ranks: it never generates candidates and never filters. Emitted by slice R5.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | yes |  |  |  | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that reranks. |
| `model` | `String` | yes |  |  |  | The PINNED model version the rerank runs on (decision-layer rule: a floating tag is refused). |
| `instructions` | `Text` | yes |  |  |  | What the provider judges per candidate, e.g. how well the item suits the anchor and the user's recent items. |
| `maxCandidates` | `Integer` | no | `50` |  |  | The most candidates sent in the one batched request. Default 50. |
| `blend` | `Double` | no | `0.5` |  |  | final = blend * decision score + (1 - blend) * neighbor score. Default 0.5. |

## Constraints

Property rules:

- `providerName`, `model`, `instructions` must be present. (`REQUIRED_FIELD_MISSING`)
