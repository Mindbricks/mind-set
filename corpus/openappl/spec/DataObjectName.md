# DataObjectName

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [DataObjectName in Part 1](../ontology/DataObjectName.md)

Represents a reference to a data object within the project. The value can be either a simple object name or a qualified reference in the format 'serviceName:objectName'. When using the qualified format, the part before the ':' specifies the service name, and the part after specifies the object name within that service. If only a single name is provided (without ':'), the system first searches for the object in the current service, then searches across other services in the project. As a best practice, when referencing data objects from other services, always fully qualified 'serviceName:objectName' format should be used to avoid potential naming conflicts. CASING: every part must be lowerCamelCase, exactly as the referenced data object's own `name` is stored (`orderItem`, `content:orderItem`). A part that is a single identifier starting with an uppercase letter is REWRITTEN IN PLACE, not rejected: the value saved into the blueprint is the canonical lowerCamelCase form and the response reports it as an applied autoFix, so `OrderItem` is saved as `orderItem` and `APIKey` as `apiKey` (acronym runs are folded, the same canonicalization the data object's `name` gets). Anything else is an error you must fix: separators or punctuation (`order-item`, `order item`), a leading digit (`9bad`), and UPPER_CASE constant spellings (`ORDER_ITEM`) - the last one because a data object named `ORDER_ITEM` keeps that exact name, so no lowerCamelCase reference to it can resolve.

## Value

A string that names a data object, optionally qualified by its service (`service:object`): see [DataObject](./DataObject.md). A malformed value is refused with `INVALID_DATA_OBJECT_NAME_FORMAT`.

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
