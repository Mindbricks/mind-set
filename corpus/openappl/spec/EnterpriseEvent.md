# EnterpriseEvent

**Level:** `section` · **Family:** [EnterpriseModel](../ontology/families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Ontology:** [EnterpriseEvent in Part 1](../ontology/EnterpriseEvent.md)

**Name:** an instance is named by `name`.

A business event the model subscribes to (section), mapped to a Kafka topic so the rest of the OpenAPPL application can consume it. For AMQP-native platforms (SAP Event Mesh, Azure Service Bus) the mapping rides the existing AMQP→Kafka mirror; other platforms get a per-platform listener adapter in the mcpbff bridge (later slice). Once on Kafka, any BusinessApi can be triggered by it via its kafka controller.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique event identifier within this model. Must be a valid codeName. |
| `amqpProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | For AMQP-native event transports (SAP Event Mesh = AMQP 1.0; Microsoft Dynamics via Azure Service Bus = AMQP 1.0), the broker this event streams from — must match a projectSettings.amqpProvidersSettings.amqpProviders[].name. The existing KafkaAMQPMirror bridges the platform address to `kafkaTopic`; no new runtime. Leave null for non-AMQP platforms (Salesforce Pub/Sub, HubSpot webhooks) — their source bindings + mcpbff listener adapters land in a later slice, publishing to the same `kafkaTopic`. |
| `platformEventSource` | `String` | yes |  |  |  | The platform-side event source address. For AMQP-native transports this is the AMQP address (queue / topic / exchange) on `amqpProviderName` the mirror consumes; for Salesforce it is the Pub/Sub topic / CDC channel, for HubSpot the webhook subscription (both wired in later slices). |
| `kafkaTopic` | `String` | no |  |  |  | The Kafka topic the platform event is mirrored onto — the uniform output contract regardless of source transport. A BusinessApi consumes this via its kafkaSettings controller. Defaults to the event name when omitted. |

## Constraints

Property rules:

- `name`, `platformEventSource` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `amqpProviderName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNKNOWN_AMQP_PROVIDER` | error | Enterprise event "…" references AMQP provider "…", which is not declared in projectSettings.amqpProvidersSettings.amqpProviders[]. |
