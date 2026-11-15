# AmqpProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AmqpProvidersSettings in Part 1](../ontology/AmqpProvidersSettings.md)

Container for external AMQP broker configurations. Each entry is a named broker the project mirrors Kafka topics with — the mcpbff KafkaAMQPMirror discovers the entries from the blueprint and runs the bridging; regular services stay pure Kafka and never open AMQP connections. The deployed mcpbff gets AMQP_<NAME>_* environment variables per provider: HOST, PORT, VHOST and USE_TLS as committed env lines on every slot, USERNAME, PASSWORD and CONNECTION_STRING as CI/CD variables of the mcpbff repo; no business service carries any. Mirrors the bucketProvidersSettings / notificationProvidersSettings shape — a named array; multiple entries can share the same provider brand (e.g. two RabbitMQ clusters, or one RabbitMQ + one Azure Service Bus).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `amqpProviders` | [`AmqpProvider`](./AmqpProvider.md)[] | no |  |  |  | List of configured external AMQP brokers. Add one entry per broker you want mirrored with the project's Kafka bus. Multiple entries can share the same provider brand (e.g. two RabbitMQ vhosts on different clusters). |

## Constraints

Property rules:

- The items of `amqpProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
