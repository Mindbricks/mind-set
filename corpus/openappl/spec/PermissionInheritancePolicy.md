# PermissionInheritancePolicy

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [PermissionInheritancePolicy in Part 1](../ontology/PermissionInheritancePolicy.md)

Declared inheritance policy for a HierarchicalResourceGraph. Current generation consumes flowDown and denyOverridesAllow. Grant paths can reach resources directly and through configured containment; enabled deny filtering still removes applicable denied resources. documentOverrideAllowed is not consumed, and its document-specific override/default contract remains undecided.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permissionsFlowDown` | `Boolean` | no | `true` |  |  | When true, a permission granted on a folder grants its entire subtree (flow-down via variable-length CONTAINS). |
| `denyOverridesAllow` | `Boolean` | no | `true` |  |  | When true, an explicit deny beats an inherited allow (negative-path filter in the generated Cypher). |
| `documentOverrideAllowed` | `Boolean` | no | `true` |  |  | Declared document-level permission override switch, default true. Current graph generation does not read this field. Generated grant paths can include a direct resource grant independently of the switch; when denyOverridesAllow is enabled, applicable denies still win. Whether a direct document grant overrides an inherited deny, what false disables and how document nodes are identified remain undecided. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
