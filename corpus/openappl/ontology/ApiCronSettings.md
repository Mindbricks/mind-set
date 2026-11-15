# ApiCronSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiCronSettings in Part 2](../spec/ApiCronSettings.md)

Schedules the Business API for periodic execution using a cron expression. Ideal for background jobs or recurring tasks. Fields are flat — set `cronExpression` directly (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `cronSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.cronSettings`
- `services.businessLogic.controllers.cronSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
