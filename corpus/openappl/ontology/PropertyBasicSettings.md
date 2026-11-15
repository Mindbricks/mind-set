# PropertyBasicSettings

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyBasicSettings in Part 2](../spec/PropertyBasicSettings.md)

Defines the core structure and behavior of a data property. Beyond basic typing, this section governs how the property participates in data integrity, mutability, API exposure, and logic-driven behaviors such as hashing or auto-increment. Use this section to establish the foundational logic and identity of the property within your data object.

## Contained in

- [DataProperty](./DataProperty.md) as `basicSettings`

Blueprint paths:

- `authentication.userProperties.basicSettings`
- `authentication.tenantProperties.basicSettings`
- `authentication.dataObjects.properties.basicSettings`
- `services.dataObjects.properties.basicSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
