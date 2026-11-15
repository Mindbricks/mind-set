# AmqpProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AmqpProvidersSettings in Part 2](../spec/AmqpProvidersSettings.md)

Container for external AMQP broker configurations. Each entry is a named broker the project mirrors Kafka topics with — the mcpbff KafkaAMQPMirror discovers the entries from the blueprint and runs the bridging; regular services stay pure Kafka and never open AMQP connections. The deployed mcpbff gets AMQP_<NAME>_* environment variables per provider: HOST, PORT, VHOST and USE_TLS as committed env lines on every slot, USERNAME, PASSWORD and CONNECTION_STRING as CI/CD variables of the mcpbff repo; no business service carries any. Mirrors the bucketProvidersSettings / notificationProvidersSettings shape — a named array; multiple entries can share the same provider brand (e.g. two RabbitMQ clusters, or one RabbitMQ + one Azure Service Bus).

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `amqpProvidersSettings`

Blueprint paths:

- `projectSettings.amqpProvidersSettings`

## Contains

- `amqpProviders`: [AmqpProvider](./AmqpProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
