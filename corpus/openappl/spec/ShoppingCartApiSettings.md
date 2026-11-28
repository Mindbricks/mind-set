# ShoppingCartApiSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartApiSettings in Part 1](../ontology/ShoppingCartApiSettings.md)

Configuration for auto-generated cart management API routes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `routePrefix` | `String` | no | `null` |  |  | Not read: no generator uses this value, so the cart routes always mount at /{cartObjectName} (basicSettings.cartObjectName, default 'cart'). Kept so stored blueprints stay valid; do not set it. |
| `rateLimiting` | `Boolean` | no | `false` |  |  | Nodejs, Python and Rust: true enables a rolling 60-second, in-process request budget shared across this generated cart router's routes. The owner key is userId when present, otherwise sessionId. A request without either identifier has no owner budget. Each router/process instance keeps its own budget. Excess returns 429 TOO_MANY_REQUESTS with Retry-After. False or unset emits no limiter. |
| `maxRequestsPerMinute` | `Integer` | no | `60` |  |  | Nodejs, Python and Rust request budget per rolling 60 seconds and per user/session owner when rateLimiting is true. Omitted or null resolves to 60; zero admits no requests for an identified owner. A request without userId and sessionId has no owner budget. This setting is inactive when rate limiting is disabled. |
| `enabledRoutes` | [`CartApiRoutes`](./CartApiRoutes.md) | no | `{…}` |  |  | Which cart routes to generate. Required when basicSettings.useShoppingCartFeature is true; ignored while the shopping-cart feature is off. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_INVALID_ROUTE_PREFIX` | error | routePrefix "…" must start with "/" |

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `authenticationRequired` | deprecated | | RETIRED: no template in any language has ever read this flag — it has zero hits under _in/**/*.ts and _in/**/*.ejs — so setting it changes nothing about the cart's auth gate. It is kept only so stored blueprints that carry it stay valid; do not set it. The flag that ACTUALLY decides whether the cart router rejects an anonymous caller is basicSettings.supportGuestCart (cart-router.ejs: `const guestCartEnabled = basic?.supportGuestCart === true;`) — true allows guest carts, false/absent requires a session. Two fields cannot own one gate, and supportGuestCart is the one that does. |
