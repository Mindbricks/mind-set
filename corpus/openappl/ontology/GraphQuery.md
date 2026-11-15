# GraphQuery

**Level:** `section` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [GraphQuery in Part 2](../spec/GraphQuery.md)

A declarative graph-traversal query archetype on a service (docs/ADR-graph-database-layer.md §8b). Follows the ComputeJob idiom exactly: `type` (GraphQueryType) selects the archetype, and a single `spec` wrapper (GraphQuerySpec) holds every typed sub-spec as nullable sub-objects — the one matching `type` is read by codegen and compiled to a parameterized Cypher template. Referenced by name from GraphQueryAction.query and ComputeJob.graphIO.reads.query. `permissionExplain` is the differentiator — it returns the matched PATH (which group/folder/grant), not just a boolean.

## Contained in

- [GraphServiceLayer](./GraphServiceLayer.md) as `queries` (a list)

Blueprint paths:

- `services.graphLayer.queries`

## Contains

- `spec`: [GraphQuerySpec](./GraphQuerySpec.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
