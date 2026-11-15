# EnterpriseProjection

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [EnterpriseProjection in Part 2](../spec/EnterpriseProjection.md)

Projects a DataObject onto an EnterpriseObject (section, under objectSettings). Binds this local object to an external business object on an enterprise platform: `enterpriseModelName` + `enterpriseObjectName` name the asset in enterpriseHub, `fieldMap` maps local properties to platform fields, and `syncMode` picks the data-flow direction. The mcpbff bridge performs the platform I/O; slice 3.1 covers read/search (readThrough / pullMirror), write modes land later.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `enterpriseProjection`

Blueprint paths:

- `authentication.dataObjects.objectSettings.enterpriseProjection`
- `services.dataObjects.objectSettings.enterpriseProjection`

## Contains

- `fieldMap`: [EnterpriseFieldMapItem](./EnterpriseFieldMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
