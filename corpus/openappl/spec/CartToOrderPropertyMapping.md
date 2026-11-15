# CartToOrderPropertyMapping

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartToOrderPropertyMapping in Part 1](../ontology/CartToOrderPropertyMapping.md)

**Name:** an instance is named by `cartProperty`.

Maps a cart property to an order property, optionally with a transformation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cartProperty` | `String` | yes | `null` |  |  | The cart property path to read from (e.g., 'grandTotalIncVat', 'userId', 'items'). Two extra roots are addressable by path: 'cart.<field>' (an explicit alias of the cart itself) and 'checkoutData.<field>', the checkout request body - which is the only way to put a request field on the order. The request body IS the checkout data: POST { "shippingMethod": "express" } is read as 'checkoutData.shippingMethod'; a body whose only key is checkoutData ({ "checkoutData": { ... } }) is unwrapped once, so both shapes read the same. |
| `orderProperty` | `String` | yes | `null` |  |  | The order property to write to (e.g., 'totalAmount', 'customerId'). |
| `transform` | [`MScript`](./MScript.md) | no | `null` |  | MScript kind `code` | Optional MScript expression to transform the value. Use 'value' to reference the cart property value (e.g. `Math.round(Number(value) * 100)`). The expression is emitted as `(value) => <expr>` inside the generated cart manager class, so `this` is the MANAGER - not the cart, a cart line or the order row: `this.discount` fails the generated service's build (TS2339) unless it happens to be a manager member. Only the per-request members `this.userId` / `this.sessionId` / `this.clientId` / `this.requestId` are meaningful; any other `this.<name>` is reported (CART_TRANSFORM_THIS_READ, WARNING). Read another cart field through its own mapping, or put the value on the order with checkoutSettings.orderDataClause. |

## Constraints

Property rules:

- `cartProperty`, `orderProperty` must be present. (`REQUIRED_FIELD_MISSING`)
