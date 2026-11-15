# KafkaProgressListener

**Level:** `subsection` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [KafkaProgressListener in Part 1](../ontology/KafkaProgressListener.md)

**Name:** an instance is named by `eventName`.

Configures a Kafka topic subscription for receiving progress updates from remote processes during an SSE connection. Messages are filtered by a correlation ID and relayed as SSE events to the client.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `relayKafkaProgress` | `const { relayKafkaProgress } = require("common")` | The SSE relay the progress listener runs on: relays correlated Kafka progress messages to the client as SSE events. | nodejs, java, dotnet |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `topic` | `String` | yes |  |  |  | The Kafka topic to subscribe to for receiving progress messages. |
| `correlationField` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluated against the pipeline context to extract the correlation ID (e.g., `{ "js": "this.dbResult.jobId" }`). Java supports request parameters and this.result in this slot; manager aliases this.dbResult and this.<objectName> are deferred. |
| `kafkaFilterField` | `String` | yes |  |  |  | The field name in the incoming Kafka message payload to match against the correlation ID. |
| `eventName` | `String` | yes |  |  |  | The SSE event name to emit to the client when a matching Kafka message is received. |
| `payloadMapping` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression to extract or transform data from the Kafka message payload. If null, the entire message payload is forwarded. |
| `completeWhen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression evaluated against the Kafka message (as msg). When it evaluates to true, the Kafka listener stops and the SSE connection closes. |

## Constraints

Property rules:

- `topic`, `correlationField`, `kafkaFilterField`, `eventName` must be present. (`REQUIRED_FIELD_MISSING`)
