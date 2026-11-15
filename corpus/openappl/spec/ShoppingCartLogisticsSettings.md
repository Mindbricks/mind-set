# ShoppingCartLogisticsSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartLogisticsSettings in Part 1](../ontology/ShoppingCartLogisticsSettings.md)

**Activation:** the pattern is switched on by `supportLogistics`.

Configuration for shipping logistics. When enabled, adds weight/dimension properties to Cart and CartItem.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportLogistics` | `Boolean` | yes |  |  |  | Whether to track logistics data (weight, dimensions, volume) for shipping calculations. |
| `supportDimensions` | `Boolean` | yes |  |  |  | Whether to track length, width, height in addition to weight. |
| `supportVolume` | `Boolean` | yes |  |  |  | Whether to auto-calculate and store volume. |
| `supportDimensionalWeight` | `Boolean` | yes |  |  |  | Whether to calculate dimensional weight for shipping carriers. |
| `dimFactor` | `Integer` | no |  |  |  | Nodejs dimensional-weight divisor. With supportLogistics and supportDimensionalWeight true and an explicit positive finite divisor, the generated manager and BusinessApi cart actions recompute dimensionalWeight as sum(length * width * height * quantity) / dimFactor. Use dimensions and divisor from the same carrier unit convention, such as centimetres with 5000 or inches with 139. Nonpositive or nonfinite individual dimensions/quantities contribute zero. The schema default is null; no divisor or calculation is inferred when it is absent. Design-time validation requires a positive divisor when dimensional weight is enabled. |

## Constraints

Property rules:

- `supportLogistics`, `supportDimensions`, `supportVolume`, `supportDimensionalWeight` must be present. Enforced only while `supportLogistics` is on. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_LOGISTICS_DIM_FACTOR_REQUIRED` | error | dimFactor is required when supportDimensionalWeight is true |
| `SHOPPING_CART_LOGISTICS_INVALID_DIM_FACTOR` | error | dimFactor must be a positive finite number, got … |
