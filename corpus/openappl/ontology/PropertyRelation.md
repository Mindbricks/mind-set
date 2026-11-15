# PropertyRelation

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyRelation in Part 2](../spec/PropertyRelation.md)

Defines the foreign-key relationship for this property to another data object. Populate this block when `basicSettings.hasRelation === true`. Leave null/absent otherwise. The activation flag lives on basicSettings (next to `source`) so a single property-level write declares both the source and the relation.

## Contained in

- [DataProperty](./DataProperty.md) as `relationSettings`

Blueprint paths:

- `authentication.userProperties.relationSettings`
- `authentication.tenantProperties.relationSettings`
- `authentication.dataObjects.properties.relationSettings`
- `services.dataObjects.properties.relationSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

- `relationTargetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `relationTargetKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `relationTargetObject`)

## Referenced by

No property of another pattern names this pattern.
