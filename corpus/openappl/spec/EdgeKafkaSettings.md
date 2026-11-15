# EdgeKafkaSettings

**Level:** `section` · **Family:** [EdgeController](../ontology/families.md#edgecontroller) (domain `Service`)

**Ontology:** [EdgeKafkaSettings in Part 1](../ontology/EdgeKafkaSettings.md)

Defines Kafka consumer/producer settings for the edge controller. Specifies how the edge function will be triggered by Kafka messages and optionally where to send responses.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `kafkaEnabled` | `Boolean` | no | `false` |  |  | Set to true if you want your edge function to be triggered by Kafka messages from the specified request topic. Default is false. |
| `requestTopic` | `String` | no |  |  |  | The Kafka topic name from which messages will be consumed to trigger the edge function. When a message arrives on this topic, the edge function will be invoked with the message payload. |
| `responseTopic` | `String` | no |  |  |  | Optional Kafka topic name where the edge function's response will be published. If not specified, the response will not be sent to Kafka (useful for fire-and-forget scenarios or when using REST for responses). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
