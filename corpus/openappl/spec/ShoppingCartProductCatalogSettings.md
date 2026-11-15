# ShoppingCartProductCatalogSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartProductCatalogSettings in Part 1](../ontology/ShoppingCartProductCatalogSettings.md)

**Activation:** the pattern is switched on by `useProductCatalog`.

Optional product catalog integration. When enabled, adding a product by ID/barcode resolves the line against the bound product DataObject and the SERVER becomes authoritative for the money fields AND for every promotion qualifier: unitPrice and vatRate, and productId, category, brand, productGroup and vendor (read through productMappings), always come from the catalog row - a client-sent value is ignored, never trusted, and when the catalog row has no value for one of these fields the client value is dropped, not kept, so a client cannot move a line into a discounted category, brand or product group. The display-only fields productName and description fill only when the client left them blank, and a product the catalog does not hold is refused with a typed 404 CART_PRODUCT_NOT_FOUND. The binding is PRICING-ONLY: it does not read, reserve, or verify stock/capacity - a scarce-stock deployment must enforce capacity in its own purchase/checkout flow (atomic conditional update, e.g. soldCount + qty <= capacity); see docs/ADR-shopping-cart-capacity-reservation.md. LANGUAGE NOTE: the qualifier authority is implemented by the nodejs target; the dotnet catalog resolve still overrides only unitPrice/vatRate (when the row carries them) and fills productName/description, and keeps client-sent qualifier fields (port pending).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useProductCatalog` | `Boolean` | no | `false` |  |  | Whether to integrate with a product DataObject for automatic item population. When true the cart's add/update-item routes price from the catalog (server-authoritative): unitPrice is no longer required from the client, a client-sent unitPrice/vatRate is overridden by the catalog values, and an unknown lookup value answers 404 CART_PRODUCT_NOT_FOUND. When false, pricing stays client-supplied under the strict ingress guard. |
| `productDataObject` | [`DataObjectName`](./DataObjectName.md) | no | `"product"` |  | names a [DataObject](./DataObject.md) | The product catalog DataObject to fetch product details from. Required when useProductCatalog is true; ignored while the catalog integration is off. |
| `lookupField` | `ProductLookupField` | no | `"barcode"` | `id`, `barcode` |  | Field to use for product lookup: 'id' or 'barcode'. |
| `productMappings` | [`ProductFieldMappings`](./ProductFieldMappings.md) | no | `{…}` |  |  | Which product fields to map to cart items. Configure only if your product uses non-standard property names. |

## Constraints

Property rules:

- `lookupField` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `productDataObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_PRODUCT_DATA_OBJECT_REQUIRED` | error | productDataObject is required when useProductCatalog is true — the product catalog integration needs a DataObject to fetch product details from. |
