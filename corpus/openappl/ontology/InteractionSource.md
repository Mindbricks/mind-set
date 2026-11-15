# InteractionSource

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [InteractionSource in Part 2](../spec/InteractionSource.md)

A resolved descriptor of interaction records with known roles (recommendation ADR section 2). It names the event object that holds the interactions, the property path that plays each of the item, group, actor, time and weight roles, the signal label, and the records that count. Patterns publish these from their own config; a designer declares one for a hand-modelled data model. The same contract later serves trend analytics, segmentation and repeat-purchase reporting.

## Contained in

- [RecommendationSettings](./RecommendationSettings.md) as `sources` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `eventObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
