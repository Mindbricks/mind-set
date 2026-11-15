# ShoppingCartProductCatalogSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartProductCatalogSettings in Part 2](../spec/ShoppingCartProductCatalogSettings.md)

Optional product catalog integration. When enabled, adding a product by ID/barcode resolves the line against the bound product DataObject and the SERVER becomes authoritative for the money fields AND for every promotion qualifier: unitPrice and vatRate, and productId, category, brand, productGroup and vendor (read through productMappings), always come from the catalog row - a client-sent value is ignored, never trusted, and when the catalog row has no value for one of these fields the client value is dropped, not kept, so a client cannot move a line into a discounted category, brand or product group. The display-only fields productName and description fill only when the client left them blank, and a product the catalog does not hold is refused with a typed 404 CART_PRODUCT_NOT_FOUND. The binding is PRICING-ONLY: it does not read, reserve, or verify stock/capacity - a scarce-stock deployment must enforce capacity in its own purchase/checkout flow (atomic conditional update, e.g. soldCount + qty <= capacity); see docs/ADR-shopping-cart-capacity-reservation.md. LANGUAGE NOTE: the qualifier authority is implemented by the nodejs target; the dotnet catalog resolve still overrides only unitPrice/vatRate (when the row carries them) and fills productName/description, and keeps client-sent qualifier fields (port pending).

## Contained in

- [ShoppingCartConfig](./ShoppingCartConfig.md) as `productCatalogSettings`

Blueprint paths:

- `services.shoppingCartConfig.productCatalogSettings`

## Contains

- `productMappings`: [ProductFieldMappings](./ProductFieldMappings.md)

## References

- `productDataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
