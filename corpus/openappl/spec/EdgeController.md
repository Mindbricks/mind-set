# EdgeController

**Level:** `chapter` · **Family:** [EdgeController](../ontology/families.md#edgecontroller) (domain `Service`)

**Ontology:** [EdgeController in Part 1](../ontology/EdgeController.md)

**Name:** an instance is named by `edgeControllerOptions.functionName`.

An edge controller defines a fully customized route handled by a developer-defined function. Unlike standard Busines APIs, it gives full control over the request processing by directly calling a function from the service library. This allows advanced operations like database queries, external API calls, or dynamic responses without following the CRUD cycle. Edge controllers are ideal for building special-purpose APIs or custom flows outside the compiler's automatic route generation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `edgeControllerOptions` | [`EdgeControllerOptions`](./EdgeControllerOptions.md) | yes |  |  |  | Configuration object for the edge controller. It defines which edge function will be executed and whether login is required to access it. |
| `edgeRestSettings` | [`EdgeRestSettings`](./EdgeRestSettings.md) | yes |  |  |  | HTTP settings for exposing the edge controller as a REST API. It allows specifying the URL path and HTTP method that will trigger the edge function. |
| `edgeKafkaSettings` | [`EdgeKafkaSettings`](./EdgeKafkaSettings.md) | no |  |  |  | Kafka settings for exposing the edge controller as a Kafka consumer/producer. It allows specifying the Kafka topics that will trigger the edge function and optionally where to send responses. |
| `edgeCronSettings` | [`EdgeCronSettings`](./EdgeCronSettings.md) | no |  |  |  | Reserved edge scheduling block retained for blueprint compatibility. It does not schedule an edge function. cronEnabled:true emits EDGE_CRON_NOT_SCHEDULED; use Service.cronJobs[] or a Business API cron controller (ApiCronSettings) for scheduled execution. |

## Constraints

Property rules:

- `edgeControllerOptions`, `edgeRestSettings` must be present. (`REQUIRED_FIELD_MISSING`)
