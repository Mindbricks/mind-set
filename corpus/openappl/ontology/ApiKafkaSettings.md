# ApiKafkaSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiKafkaSettings in Part 2](../spec/ApiKafkaSettings.md)

Configures Kafka as a trigger mechanism for the Business API. This supports both asynchronous processing and integration-based event handling (e.g., storage triggers, audit flows). Fields are flat — set `requestTopicName` and `responseTopicName` directly (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `kafkaSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.kafkaSettings`
- `services.businessLogic.controllers.kafkaSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
