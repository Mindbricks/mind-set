# KafkaProgressListener

**Level:** `subsection` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [KafkaProgressListener in Part 2](../spec/KafkaProgressListener.md)

Configures a Kafka topic subscription for receiving progress updates from remote processes during an SSE connection. Messages are filtered by a correlation ID and relayed as SSE events to the client.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `relayKafkaProgress` | `const { relayKafkaProgress } = require("common")` | The SSE relay the progress listener runs on: relays correlated Kafka progress messages to the client as SSE events. | nodejs, java, dotnet |

## Contained in

- [ApiSseSettings](./ApiSseSettings.md) as `kafkaProgressListeners` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
