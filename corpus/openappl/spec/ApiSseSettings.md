# ApiSseSettings

**Level:** `section` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [ApiSseSettings in Part 1](../ontology/ApiSseSettings.md)

**Activation:** the pattern is switched on by `hasSseController`.

Enables Server-Sent Events (SSE) streaming for a Business API, allowing the API to stream its response as chunks or emit progress events over an SSE connection. The REST endpoint continues to serve single request-response. The SSE endpoint is a companion for responses that are too large or too slow for a single HTTP response. Fields are flat — set `responseMode`, `timeout`, `chunkSize`, `streamSource`, and `kafkaProgressListeners` directly (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasSseController` | `Boolean` | no | `false` |  |  | Enables the SSE controller for this API. The SSE route is mounted at the API's own route path and HTTP method, on a separate SSE router; no `/stream` suffix is derived. For a distinct streaming path, declare a sibling API with its own `restSettings.routePath`. |
| `responseMode` | `SseResponseMode` | no | `"stream"` | `stream`, `events` |  | Defines how the SSE endpoint delivers data. 'stream' sends data in chunks (for large datasets, file exports, LLM token streaming). 'events' sends progress updates for long-running operations with no automatic result frame. |
| `timeout` | `Integer` | no | `300000` |  |  | Maximum duration in milliseconds for an SSE connection before the server closes it. Defaults to 300000 (5 minutes). |
| `chunkSize` | `Integer` | no | `100` |  |  | Number of rows per chunk when streaming list results. Defaults to 100. |
| `streamSource` | [`StreamSourceConfig`](./StreamSourceConfig.md) | no |  |  |  | Reserved source-selection block. Generated Node.js SSE routes do not pass this block into executeStreaming: in stream mode a list API uses bounded row batches requested by chunkSize, following returned keyset cursors or falling back to page-based pagination and another API sends its single result as one chunk. Workflow-scheduled IteratorAction provides the existing custom-yield path. Compiled MScript children may separately be selected by the generic /mscript-sample demo when demo-compatible; that does not select a stream source. Source dispatch, precedence, bindings and lifecycle require a ruling. Leave null. |
| `kafkaProgressListeners` | [`KafkaProgressListener`](./KafkaProgressListener.md)[] | no |  |  |  | Optional array of Kafka topic listeners for receiving progress updates from remote processes. After the pipeline completes, the SSE connection stays open and listens to configured Kafka topics, relaying filtered messages as SSE events. Works with both 'stream' and 'events' response modes. |

## Constraints

Property rules:

- `responseMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `kafkaProgressListeners` must have distinct names (`eventName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SSE_CHUNK_SIZE_OUT_OF_RANGE` | error | chunkSize … is out of range. |
| `SSE_TIMEOUT_OUT_OF_RANGE` | error | timeout … is out of range. |
