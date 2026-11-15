# ApiRestSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiRestSettings in Part 2](../spec/ApiRestSettings.md)

Defines the REST controller configuration for a Business API. REST is the default HTTP interface in OpenAPPL. These settings allow enabling/disabling REST access and customizing the endpoint path. Fields are flat — set `routePath` and `forcePOSTMethod` directly on this block (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `restSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.restSettings`
- `services.businessLogic.controllers.restSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
