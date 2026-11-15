# AgentIntegrationToolConfig

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentIntegrationToolConfig in Part 1](../ontology/AgentIntegrationToolConfig.md)

**Name:** an instance is named by `integrationName`.

Configures an integration provider as a tool source for the agent. Explicit method names (comma-separated) create individual tools with full JSON Schema parameters. Wildcard '*' creates a single dispatcher tool per integration plus a shared getIntegrationMethodDoc helper for looking up exact method signatures on demand.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `integrationName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The provider key of the integration (e.g., 'stripe', 'amazonS3'). Must match a provider added to the project's integrations. |
| `methods` | `String` | yes |  |  |  | Comma-separated list of method names to expose as individual tools, or '*' to register a single dispatcher tool with a documentation lookup helper. Examples: 'createCustomer,getPaymentIntent' or '*'. |

## Constraints

Property rules:

- `integrationName`, `methods` must be present. (`REQUIRED_FIELD_MISSING`)
- `integrationName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INTEGRATION_METHOD_NOT_FOUND` | error | Method "…" does not exist on integration "…". |
| `INTEGRATION_PROVIDER_NOT_IN_PROJECT` | error |  |
