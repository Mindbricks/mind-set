# ViewBasics

**Level:** `section` · **Family:** [DataView](./families.md#dataview) (domain `BFFService`)

**Specification:** [ViewBasics in Part 2](../spec/ViewBasics.md)

Configuration for a DataView's identity and structure. It specifies whether the view is stored (in Elasticsearch) or dynamic (evaluated at runtime), the name of the view, the main source object it is built upon, and the list of core properties to retrieve from the main object.

## Contained in

- [DataView](./DataView.md) as `viewBasics`

Blueprint paths:

- `bffService.dataViews.viewBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

- `mainObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `properties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `mainObject`)

## Referenced by

No property of another pattern names this pattern.
