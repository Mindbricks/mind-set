# AmqpProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AmqpProviderConfig in Part 1](../ontology/AmqpProviderConfig.md)

External AMQP broker connection credentials and the mirrored-topics mapping. Connection fields are a flat superset across both protocol families — only those relevant to the selected brand are read at runtime. `password` and `connectionString` are secret (masked in API responses). `mirroredTopics` is the EXPLICIT list of address/topic mappings the mcpbff KafkaAMQPMirror bridges — no wildcards.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `host` | `String` | no |  |  |  | [rabbitmq\|cloudamqp\|artemis] The broker host, e.g. `rabbit.example.com`. Not used when `connectionString` is set (azureServiceBus). |
| `port` | `Integer` | no |  |  |  | [rabbitmq\|cloudamqp\|artemis] The broker port. AMQP 0-9-1 default: 5672 (5671 with TLS); AMQP 1.0 (artemis) default: 5672. |
| `vhost` | `String` | no |  |  |  | [rabbitmq\|cloudamqp] The AMQP 0-9-1 virtual host, e.g. `/`. Ignored by AMQP 1.0 brands. |
| `username` | `String` | no |  |  |  | [rabbitmq\|cloudamqp\|artemis] The broker username. |
| `password` | `String` | no |  |  | **secret** | [rabbitmq\|cloudamqp\|artemis] The broker password. Secret — masked in API responses; delivered to the deployed mcpbff as the CI/CD variable AMQP_<NAME>_PASSWORD (never a committed env line). |
| `connectionString` | `Text` | no |  |  | **secret** | [azureServiceBus] The full Service Bus connection string (Endpoint=sb://…;SharedAccessKeyName=…;SharedAccessKey=…). Secret — masked in API responses; delivered to the deployed mcpbff as the CI/CD variable AMQP_<NAME>_CONNECTION_STRING (never a committed env line). When set, the host/port/username/password fields are not used. |
| `useTls` | `Boolean` | no | `false` |  |  | [rabbitmq\|cloudamqp\|artemis] Set true to connect over TLS (amqps). azureServiceBus is always TLS via its connection string. |
| `mirroredTopics` | [`AmqpMirroredTopic`](./AmqpMirroredTopic.md)[] | no |  |  |  | EXPLICIT list of mirrored address/topic mappings the mcpbff KafkaAMQPMirror bridges for this broker. Each entry declares a direction (`amqpToKafka` or `kafkaToAmqp`), the AMQP address (queue/exchange/topic on the broker), and optionally the Kafka topic (defaults to the amqpAddress when omitted). No wildcards — every mapping is declared. Duplicate mappings (same direction + amqpAddress + effective kafkaTopic) are rejected. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DUPLICATE_MIRRORED_TOPIC` | error | Duplicate mirrored-topic mapping: entry […] repeats the same effective mapping as entry […] (direction "…", amqpAddress "…", kafkaTopic "…"). |
