# LocalDataObjectName

**Level:** `unclassified` · **Family:** [Standalone patterns](./families.md#standalone-patterns)

**Specification:** [LocalDataObjectName in Part 2](../spec/LocalDataObjectName.md)

Represents a reference to a data object within the same service. The value must be a simple object name; not a qualified reference in the format 'serviceName:objectName'. CASING: the value must be lowerCamelCase, exactly as the referenced data object's own `name` is stored (`orderItem`). A single identifier starting with an uppercase letter is REWRITTEN IN PLACE, not rejected: the value saved into the blueprint is the canonical lowerCamelCase form and the response reports it as an applied autoFix, so `OrderItem` is saved as `orderItem` and `APIKey` as `apiKey` (acronym runs are folded, the same canonicalization the data object's `name` gets). Anything else is an error you must fix: separators or punctuation (`order-item`, `order item`), a leading digit (`9bad`), and UPPER_CASE constant spellings (`ORDER_ITEM`) - the last one because a data object named `ORDER_ITEM` keeps that exact name, so no lowerCamelCase reference to it can resolve.

## Contained in

No property of another pattern holds this pattern.

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
