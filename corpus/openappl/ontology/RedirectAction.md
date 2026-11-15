# RedirectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [RedirectAction in Part 2](../spec/RedirectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Redirects the client to a new URL after the API execution. This is often used in web-based flows like OAuth callbacks, login success handlers, or conditional navigation.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `redirectActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.redirectActions`
- `services.businessLogic.actions.redirectActions`

## Contains

- `redirectUrl`: [HTTPRequest](./HTTPRequest.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
