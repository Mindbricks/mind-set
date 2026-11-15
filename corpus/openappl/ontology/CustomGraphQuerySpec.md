# CustomGraphQuerySpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [CustomGraphQuerySpec in Part 2](../spec/CustomGraphQuerySpec.md)

Spec for `custom` — the bring-your-own-Cypher escape hatch (docs/ADR-graph-database-layer.md §8b). The author supplies a parameterized Cypher template and declares its named parameters; codegen wires it like any other query.

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `custom`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
