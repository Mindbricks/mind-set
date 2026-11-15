# ApiSseSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiSseSettings in Part 2](../spec/ApiSseSettings.md)

Enables Server-Sent Events (SSE) streaming for a Business API, allowing the API to stream its response as chunks or emit progress events over an SSE connection. The REST endpoint continues to serve single request-response. The SSE endpoint is a companion for responses that are too large or too slow for a single HTTP response. Fields are flat — set `responseMode`, `timeout`, `chunkSize`, `streamSource`, and `kafkaProgressListeners` directly (the legacy `configuration: { ... }` wrapper is still accepted on input but lifted at validate time).

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `sseSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.sseSettings`
- `services.businessLogic.controllers.sseSettings`

## Contains

- `streamSource`: [StreamSourceConfig](./StreamSourceConfig.md)
- `kafkaProgressListeners`: [KafkaProgressListener](./KafkaProgressListener.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
