# ProductFieldMappings

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ProductFieldMappings in Part 1](../ontology/ProductFieldMappings.md)

Declares product DataObject property-name mappings. Current nodejs catalog resolution consumes the supported name, price, VAT, description, barcode and promotion-qualifier mappings. The discountPercent, earnedPoints, image, weight, length, width and height mappings are not consumed, even with their conventional schema defaults. Their runtime/default contracts remain undecided; configuring an override alone does not populate these cart-line values.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `barcodeField` | `String` | no | `"barcode"` |  |  | Product property for barcode (default: 'barcode'). |
| `nameField` | `String` | no | `"name"` |  |  | Product property for name (default: 'name'). |
| `imageField` | `String` | no | `"image"` |  |  | Declared product-property name for a product image URL (schema default 'image'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. |
| `descriptionField` | `String` | no | `"description"` |  |  | Product property for description (default: 'description'). |
| `categoryField` | `String` | no | `"category"` |  |  | Product property for category (default: 'category'). |
| `brandField` | `String` | no | `"brand"` |  |  | Product property for brand (default: 'brand'). |
| `productGroupField` | `String` | no | `"productGroup"` |  |  | Product property for product group (default: 'productGroup'). |
| `priceField` | `String` | no | `"price"` |  |  | Product property for price (default: 'price'). |
| `vatRateField` | `String` | no | `"vatRate"` |  |  | Product property for VAT rate (default: 'vatRate'). The column speaks PERCENT (18 = 18%), per the platform-wide vatRate unit contract; the cart engine normalizes the resolved value once at ingress, with values below 1 read as legacy fractions. A bare 1 means 1 percent, never 100%. |
| `discountPercentField` | `String` | no | `"discountPercent"` |  |  | Declared product-property name for a product discount percentage (schema default 'discountPercent'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. Percentage conversion into cart pricing and stacking also require an explicit contract. |
| `vendorField` | `String` | no | `"vendor"` |  |  | Product property for vendor (default: 'vendor'). |
| `weightField` | `String` | no | `"weight"` |  |  | Declared product-property name for product weight (schema default 'weight'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. |
| `lengthField` | `String` | no | `"length"` |  |  | Declared product-property name for product length (schema default 'length'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. |
| `widthField` | `String` | no | `"width"` |  |  | Declared product-property name for product width (schema default 'width'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. |
| `heightField` | `String` | no | `"height"` |  |  | Declared product-property name for product height (schema default 'height'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. |
| `earnedPointsField` | `String` | no | `"earnedPoints"` |  |  | Declared product-property name for product loyalty points (schema default 'earnedPoints'). Current nodejs catalog resolution does not read or populate this value through this mapping, including with the default name. Enabling the mapping would change existing catalog-bound cart lines and requires a default-compatibility decision. Per-unit versus per-line earning and interaction with loyalty also require an explicit contract. |
| `stockField` | `String` | no |  |  |  | OPT-IN stock mapping: product property holding the directly available stock (units that may still be reserved). No default - leaving it unset means the catalogue exposes no stock and the cart cannot reserve. Mutually exclusive with capacityField; the mapped column is only ever read to SEED and RECONCILE the Redis capacity counter, never per-request (and never through the DB cart mirror). |
| `capacityField` | `String` | no |  |  |  | OPT-IN stock mapping: product property holding the TOTAL capacity (availability is capacity minus soldCountField, or capacity alone when no soldCountField is mapped). No default. Mutually exclusive with stockField. Read only to seed/reconcile the Redis capacity counter. |
| `soldCountField` | `String` | no |  |  |  | OPT-IN stock mapping: product property counting units already sold; only meaningful together with capacityField (availability = capacity - soldCount). No default. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
