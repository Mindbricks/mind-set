# AmqpMirroredTopic

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AmqpMirroredTopic in Part 1](../ontology/AmqpMirroredTopic.md)

**Name:** an instance is named by `kafkaTopic`.

One explicit mirrored mapping between an AMQP address and a Kafka topic. `direction` decides the flow: `amqpToKafka` consumes the AMQP address and produces to the Kafka topic; `kafkaToAmqp` consumes the Kafka topic and publishes to the AMQP address. `kafkaTopic` defaults to `amqpAddress` when omitted. No wildcards — one entry per mirrored pair.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `direction` | `AmqpMirrorDirection` | yes |  | `amqpToKafka`, `kafkaToAmqp` |  | The mirroring direction. 'amqpToKafka' = consume messages from the AMQP address and produce them to the Kafka topic; 'kafkaToAmqp' = consume the Kafka topic and publish to the AMQP address. Required. |
| `amqpAddress` | `String` | yes |  |  |  | The address on the AMQP broker — a queue / exchange (0-9-1) or an AMQP 1.0 address (Artemis address, Service Bus queue/topic). Required, non-empty. No wildcards. |
| `kafkaTopic` | `String` | no |  |  |  | The Kafka topic on the project bus this mapping mirrors with. Optional — defaults to `amqpAddress` when omitted. |

## Constraints

Property rules:

- `direction`, `amqpAddress` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AMQP_ADDRESS_EMPTY` | error | amqpAddress must be a non-empty AMQP address (queue / exchange / topic name) — a whitespace-only value cannot resolve on the broker. |
