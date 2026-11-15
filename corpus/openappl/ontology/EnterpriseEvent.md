# EnterpriseEvent

**Level:** `section` · **Family:** [EnterpriseModel](./families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Specification:** [EnterpriseEvent in Part 2](../spec/EnterpriseEvent.md)

A business event the model subscribes to (section), mapped to a Kafka topic so the rest of the OpenAPPL application can consume it. For AMQP-native platforms (SAP Event Mesh, Azure Service Bus) the mapping rides the existing AMQP→Kafka mirror; other platforms get a per-platform listener adapter in the mcpbff bridge (later slice). Once on Kafka, any BusinessApi can be triggered by it via its kafka controller.

## Contained in

- [EnterpriseModel](./EnterpriseModel.md) as `enterpriseEvents` (a list)

Blueprint paths:

- `enterpriseHub.enterpriseModels.enterpriseEvents`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
