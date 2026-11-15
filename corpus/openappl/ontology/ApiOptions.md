# ApiOptions

**Level:** `section` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiOptions in Part 2](../spec/ApiOptions.md)

Main configuration section for a Business API. This object includes essential attributes such as naming, access control, event handling, input generation, and fallback strategies. In many cases, configuring this section alone is sufficient to define the primary behavior of an API entry point.

## Contained in

- [BusinessApiBasics](./BusinessApiBasics.md) as `apiOptions`

Blueprint paths:

- `authentication.businessLogic.basics.apiOptions`
- `services.businessLogic.basics.apiOptions`

## Contains

- `visitSettings`: [VisitSettings](./VisitSettings.md)

## References

- `dataObjectName` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
