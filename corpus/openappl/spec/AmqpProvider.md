# AmqpProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AmqpProvider in Part 1](../ontology/AmqpProvider.md)

**Name:** an instance is named by `name`.

A named external AMQP broker configuration. The `name` is the lookup key and the env-var prefix (e.g. `ordersBroker` → `AMQP_ORDERSBROKER_*`). The `provider` enum is the broker BRAND, and each brand declares which AMQP protocol the mcpbff mirror speaks to it: `rabbitmq` and `cloudamqp` speak AMQP 0-9-1; `artemis` and `azureServiceBus` speak AMQP 1.0. The `configuration` holds the connection credentials plus the explicit `mirroredTopics` mapping list (no wildcards — every mirrored address/topic pair is declared).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key by the mcpbff KafkaAMQPMirror and as the env-var prefix (AMQP_<NAME>_*). Must be a valid codeName. |
| `provider` | `AmqpProviderType` | no | `"rabbitmq"` | `rabbitmq`, `cloudamqp`, `artemis`, `azureServiceBus` |  | The broker brand. Each brand declares the AMQP protocol the mirror speaks: 'rabbitmq' = RabbitMQ (AMQP 0-9-1); 'cloudamqp' = CloudAMQP hosted RabbitMQ (AMQP 0-9-1); 'artemis' = Apache ActiveMQ Artemis (AMQP 1.0); 'azureServiceBus' = Azure Service Bus (AMQP 1.0). |
| `configuration` | [`AmqpProviderConfig`](./AmqpProviderConfig.md) | no |  |  |  | Connection details + the mirroredTopics mapping list. The required keys depend on the brand — rabbitmq/cloudamqp: host, port (5672 default plain / 5671 TLS), vhost, username, password; artemis: host, port, username, password; azureServiceBus: connectionString. `username`, `password` and `connectionString` are delivered to the deployed mcpbff as CI/CD variables (AMQP_<NAME>_USERNAME / _PASSWORD / _CONNECTION_STRING), never as committed env lines; `password` and `connectionString` are masked in API responses. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
