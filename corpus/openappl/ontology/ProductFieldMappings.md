# ProductFieldMappings

**Level:** `subsection` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ProductFieldMappings in Part 2](../spec/ProductFieldMappings.md)

Declares product DataObject property-name mappings. Current nodejs catalog resolution consumes the supported name, price, VAT, description, barcode and promotion-qualifier mappings. The discountPercent, earnedPoints, image, weight, length, width and height mappings are not consumed, even with their conventional schema defaults. Their runtime/default contracts remain undecided; configuring an override alone does not populate these cart-line values.

## Contained in

- [ShoppingCartProductCatalogSettings](./ShoppingCartProductCatalogSettings.md) as `productMappings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
