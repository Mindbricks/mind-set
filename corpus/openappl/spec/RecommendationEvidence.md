# RecommendationEvidence

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationEvidence in Part 1](../ontology/RecommendationEvidence.md)

One evidence relation of a recommendation list (recommendation ADR section 3): the relation, the source that feeds it and its weight in an explicit blend.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relation` | `RecommendationRelation` | yes |  | `coPurchased`, `coConsumed`, `coViewed`, `consumedAfter`, `popularity`, `repeat`, `similarContent` |  | The evidence relation (RecommendationRelation). All implemented recommendation runtimes emit `coPurchased`, `coConsumed` and `popularity`. Nodejs, dotnet and java also emit `coViewed` and `consumedAfter` (rust emits them too), and serve `repeat` at request time for `buyAgain`. Other runtimes retain RECOMMENDATION_NOT_YET_EMITTED (warning) for those later relations until ported. `similarContent` remains pending R6. |
| `source` | `String` | no | `"auto"` |  |  | The interaction source that feeds the relation: a declared source's name, or `auto` (the default) for every discovered and declared source that carries the relation's required roles. A relation is never fed by a source of the wrong kind (coViewed never by purchases). |
| `weight` | `Double` | no | `1` |  |  | The relation's weight when a list blends several relations. Default 1. |

## Constraints

Property rules:

- `relation` must be present. (`REQUIRED_FIELD_MISSING`)
- `relation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
