# APIKeyAuth

**Level:** `section` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [APIKeyAuth in Part 1](../ontology/APIKeyAuth.md)

**Activation:** the pattern is switched on by `useAPIKeyForAuthentication`.

Enables API key authentication for the project. When enabled, an OpenAPPL compiler generates an apiKey data object, management APIs (create, list, delete), and validation endpoints. Secret API keys use the sk_mbx_ prefix and allow tokenless, session-based authentication — ideal for server-to-server integrations, AI agents, CI/CD pipelines, and MCP connections. Public API keys are defined in the configuration schema for future support but are not yet implemented.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useAPIKeyForAuthentication` | `Boolean` | yes |  |  |  | Enable or disable API key authentication for this project. When true, the auth service will include the apiKey data object and key management APIs. |
| `configuration` | [`APIKeyAuthConfig`](./APIKeyAuthConfig.md) | no |  |  |  | Configuration for API key behavior, required when useAPIKeyForAuthentication is true (a null configuration is refused with REQUIRED_FIELD_MISSING). An empty object keeps the defaults: secret-only keys sent in the Bearer header. Set its fields to customize key types, locations, or names. |

## Constraints

Property rules:

- `useAPIKeyForAuthentication` must be present. Enforced only while `useAPIKeyForAuthentication` is on. (`REQUIRED_FIELD_MISSING`)
