# AmqpMirroredTopic

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AmqpMirroredTopic in Part 2](../spec/AmqpMirroredTopic.md)

One explicit mirrored mapping between an AMQP address and a Kafka topic. `direction` decides the flow: `amqpToKafka` consumes the AMQP address and produces to the Kafka topic; `kafkaToAmqp` consumes the Kafka topic and publishes to the AMQP address. `kafkaTopic` defaults to `amqpAddress` when omitted. No wildcards — one entry per mirrored pair.

## Contained in

- [AmqpProviderConfig](./AmqpProviderConfig.md) as `mirroredTopics` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
