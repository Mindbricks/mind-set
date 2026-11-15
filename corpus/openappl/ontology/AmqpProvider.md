# AmqpProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AmqpProvider in Part 2](../spec/AmqpProvider.md)

A named external AMQP broker configuration. The `name` is the lookup key and the env-var prefix (e.g. `ordersBroker` → `AMQP_ORDERSBROKER_*`). The `provider` enum is the broker BRAND, and each brand declares which AMQP protocol the mcpbff mirror speaks to it: `rabbitmq` and `cloudamqp` speak AMQP 0-9-1; `artemis` and `azureServiceBus` speak AMQP 1.0. The `configuration` holds the connection credentials plus the explicit `mirroredTopics` mapping list (no wildcards — every mirrored address/topic pair is declared).

## Contained in

- [AmqpProvidersSettings](./AmqpProvidersSettings.md) as `amqpProviders` (a list)

## Contains

- `configuration`: [AmqpProviderConfig](./AmqpProviderConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
