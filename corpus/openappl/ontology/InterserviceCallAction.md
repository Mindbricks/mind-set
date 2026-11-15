# InterserviceCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [InterserviceCallAction in Part 2](../spec/InterserviceCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls another Business API defined in a different microservice. This enables inter-service coordination within an OpenAPPL application. The response can be extracted into the context or added to the API response. This action supports dynamic parameters and flexible response handling.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `interserviceCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.interserviceCallActions`
- `services.businessLogic.actions.interserviceCallActions`

## Contains

- `apiParameters`: [DataMapItem](./DataMapItem.md), a list
- `applyField`: [InterserviceApplyField](./InterserviceApplyField.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
