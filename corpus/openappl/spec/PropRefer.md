# PropRefer

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [PropRefer in Part 1](../ontology/PropRefer.md)

Represents a reference to a property of a data object, optionally renaming it in the current context. It is a string data, however can store string pairs joined with ':'.The first part is the name ofthe property and the second part after ':' mark is how it will be renamed in the context. If no second partis provided, the property is named in the context with its original name. Renaming is useful for mapping remote object properties to local aliases or transforming naming for aggregation.

## Value

A string that names a property of a data object: see [DataProperty](./DataProperty.md). A malformed value is refused with `INVALID_PROP_REFER_FORMAT`.

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
