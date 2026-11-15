# CorsSettingsConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [CorsSettingsConfig in Part 1](../ontology/CorsSettingsConfig.md)

Defines the configuration for CORS settings. This object is used when useCorsControl is set to true. Note that if your service is in a different subdomain, the generated service automatically uses wildcard url control and allows other subdomains in the same main domain. Localhost Vite ports are also allowed automatically.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `allowedOrigins` | `String`[] | no |  |  | format [url](./value-formats.md#url) | A list of full url addresses that are allowed as cross origin.(with https or http) |
| `allowAllSubdomains` | `Boolean` | no | `true` |  |  | When set to true, the services will accept all cross origins that have different subdomain but same domain. It is not recommended if your services share a domain with foreign subdomains. |

## Constraints

Property rules:

- `allowedOrigins` must be in the [`url`](./value-formats.md#url) format. (`INVALID_URL`)
