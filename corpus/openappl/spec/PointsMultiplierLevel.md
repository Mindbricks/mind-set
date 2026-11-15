# PointsMultiplierLevel

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [PointsMultiplierLevel in Part 1](../ontology/PointsMultiplierLevel.md)

**Name:** an instance is named by `membershipLevel`.

Points multiplier configuration for a specific membership level.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `membershipLevel` | `String` | no | `"silver"` |  |  | The membership level name. |
| `multiplier` | `Double` | no | `1` |  |  | Points multiplier for this level (e.g., 2 for double points). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
