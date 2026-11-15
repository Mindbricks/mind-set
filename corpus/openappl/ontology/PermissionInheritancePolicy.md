# PermissionInheritancePolicy

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [PermissionInheritancePolicy in Part 2](../spec/PermissionInheritancePolicy.md)

Declared inheritance policy for a HierarchicalResourceGraph. Current generation consumes flowDown and denyOverridesAllow. Grant paths can reach resources directly and through configured containment; enabled deny filtering still removes applicable denied resources. documentOverrideAllowed is not consumed, and its document-specific override/default contract remains undecided.

## Contained in

- [HierarchicalResourceGraph](./HierarchicalResourceGraph.md) as `inheritance`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
