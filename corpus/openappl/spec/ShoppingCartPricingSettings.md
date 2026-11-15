# ShoppingCartPricingSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartPricingSettings in Part 1](../ontology/ShoppingCartPricingSettings.md)

Price calculation settings. Controls VAT handling, rounding, and which charge types are supported.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `catalogPricesIncludeVat` | `Boolean` | no | `false` |  |  | Whether product prices include VAT. When true the engine prices GROSS-FIRST: the customer-facing line total is unitPrice x quantity exactly (a 250-inclusive item twice is 500.00, never 499.99), any line discount is taken off that gross, and the ex-VAT/VAT split is DERIVED from the discounted gross with the same rounding-exact extraction the invoice layer uses. When false, prices are ex-VAT and VAT is added on top. |
| `defaultVatRate` | `Double` | no | `0.18` |  |  | Default VAT rate when an item doesn't specify its own. UNIT CONTRACT: this knob speaks PERCENT, like every public vatRate boundary - write 18 for 18% VAT. The cart engine converts it to its internal fraction exactly once, at ingress: any value >= 1 is a percent and is divided by 100; any value below 1 is accepted as a legacy FRACTION and passes through unchanged (0.18 also means 18%), so existing fraction-speaking projects keep computing identical totals. BE LOUD ABOUT THE BOUNDARY: a bare 1 means ONE PERCENT (0.01), never 100% - author 1% VAT as 1; and a sub-1% rate has no percent spelling, author it as a fraction (0.005 = 0.5%). |
| `roundingStrategy` | `RoundingStrategy` | no | `"perLine"` | `perLine`, `perItem`, `atTotal` |  | When to round monetary values: perLine (recommended), perItem, or atTotal. |
| `roundingPrecision` | `Integer` | no | `2` |  |  | Decimal places for rounding (typically 2). |
| `discountSettings` | [`CartDiscountConfig`](./CartDiscountConfig.md) | yes |  |  |  | Declared discount-policy configuration. Current nodejs pricing retains existing dynamic reward behavior and proportional allocation; this container does not independently enforce its child policies. The documented proportional, byQuantity and lastItem allocation strategies are derivable. The supportType default-compatibility decision and the customRule allocation callback, result/error and rounding/line-cap contract remain unresolved before activation. |
| `shipmentSettings` | [`CartShipmentConfig`](./CartShipmentConfig.md) | no |  |  |  | Shipment charge configuration. |
| `extraChargeSettings` | [`CartExtraChargeConfig`](./CartExtraChargeConfig.md) | no |  |  |  | Extra charges configuration (handling, packaging, etc.). |

## Constraints

Property rules:

- `discountSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- `roundingStrategy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_PRICING_INVALID_ROUNDING_PRECISION` | error | roundingPrecision must be an integer between 0 and 6, got … |
| `SHOPPING_CART_PRICING_INVALID_VAT_RATE` | error | defaultVatRate must be a VAT percent between 0 and 100 (e.g. |
