# WriteToElasticLogAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [WriteToElasticLogAction in Part 2](../spec/WriteToElasticLogAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

BusinessApiAction that appends an object to a declared ElasticLog by name. Compiles to a direct call to the generated writeToESLog_<logName> helper — a local ES write, NOT an interservice call (logs are high-volume).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `writeToElasticLogActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.writeToElasticLogActions`
- `services.businessLogic.actions.writeToElasticLogActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
