# AmqpProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AmqpProviderConfig in Part 2](../spec/AmqpProviderConfig.md)

External AMQP broker connection credentials and the mirrored-topics mapping. Connection fields are a flat superset across both protocol families — only those relevant to the selected brand are read at runtime. `password` and `connectionString` are secret (masked in API responses). `mirroredTopics` is the EXPLICIT list of address/topic mappings the mcpbff KafkaAMQPMirror bridges — no wildcards.

## Contained in

- [AmqpProvider](./AmqpProvider.md) as `configuration`

## Contains

- `mirroredTopics`: [AmqpMirroredTopic](./AmqpMirroredTopic.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
