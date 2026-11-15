# CartApiRoutes

**Level:** `subsection` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [CartApiRoutes in Part 2](../spec/CartApiRoutes.md)

Which cart API routes to generate. All default to true: an omitted flag counts as true and false drops the route. The routes mount at /{cartObjectName} (basicSettings.cartObjectName, default 'cart'); apiSettings.routePrefix is not read. applyCoupon and removeCoupon are generated only when the coupon feature is on, and redeemPoints only when points redemption is on (see each flag). The Go runtime ignores these flags and has no recalculate or redeemPoints route.

## Contained in

- [ShoppingCartApiSettings](./ShoppingCartApiSettings.md) as `enabledRoutes`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
