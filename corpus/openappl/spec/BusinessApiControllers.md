# BusinessApiControllers

**Level:** `chapter` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [BusinessApiControllers in Part 1](../ontology/BusinessApiControllers.md)

Transport bindings of a `BusinessApi` (section): the optional REST, gRPC, Kafka, SSE, cron and internal-call controller settings that expose the API. Each sub-setting is independent — an API may expose any combination of transports. The internal-call binding is not a network transport: it exposes the API to in-process `API.<name>()` calls from same-service designer scripts.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `restSettings` | [`ApiRestSettings`](./ApiRestSettings.md) | no |  |  |  | Defines HTTP REST controller settings such as method and route path. Automatically generated using naming conventions, but can be customized for fine-grained control over REST behavior, parameter mapping, or URL design. |
| `grpcSettings` | [`ApiGrpcSettings`](./ApiGrpcSettings.md) | no |  |  |  | Enables gRPC access for this Business API and configures the request and response schemas. gRPC is disabled by default unless explicitly configured. |
| `kafkaSettings` | [`ApiKafkaSettings`](./ApiKafkaSettings.md) | no |  |  |  | Enables this Business API to be triggered by Kafka events. This controller listens for messages published to configured Kafka topics, allowing the API to respond to system-level events (e.g., file uploaded, user signed up) or external integrations. This is commonly used for decoupled orchestration between services or for reacting to events emitted by backend libraries and storage providers. |
| `sseSettings` | [`ApiSseSettings`](./ApiSseSettings.md) | no |  |  |  | Enables Server-Sent Events (SSE) streaming for this Business API. When enabled, the API can stream its response as chunks (for large datasets, file exports, LLM token streaming) or emit progress events (for long-running operations) over an SSE connection. |
| `cronSettings` | [`ApiCronSettings`](./ApiCronSettings.md) | no |  |  |  | Schedules this Business API for automatic execution at specified intervals. Useful for background tasks, data cleanup, or scheduled jobs. Uses cron expressions to define timing. |
| `internalCallSettings` | [`ApiInternalCallSettings`](./ApiInternalCallSettings.md) | no |  |  |  | Enables in-process invocation of this Business API from same-service designer scripts — payment lifecycle hooks call it as `await API.<name>(params)`. No transport is involved: the internal call controller runs the full manager pipeline directly asSystem. With one argument the session is null and all inputs must be explicit parameters. On nodejs, python, rust, java and dotnet a BusinessApi action (and, on nodejs, a hook) that has a caller session supplies it with the optional second argument, `await API.<name>(params, { session: this.session })`, to resolve the caller's tenant; ledger APIs on a tenant-scoped owner object need it too. No session is implicitly inherited through AsyncLocalStorage or the running manager, and the system authorization posture stays unchanged: role and ownership gates remain bypassed even with an explicit session. Language targets without explicit-session support retain the sessionless signature. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
