# PropRefer

**Level:** `unclassified` · **Family:** [Standalone patterns](./families.md#standalone-patterns)

**Specification:** [PropRefer in Part 2](../spec/PropRefer.md)

Represents a reference to a property of a data object, optionally renaming it in the current context. It is a string data, however can store string pairs joined with ':'.The first part is the name ofthe property and the second part after ':' mark is how it will be renamed in the context. If no second partis provided, the property is named in the context with its original name. Renaming is useful for mapping remote object properties to local aliases or transforming naming for aggregation.

## Contained in

No property of another pattern holds this pattern.

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
