# AgentCustomEndpoint

**Level:** `section` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentCustomEndpoint in Part 1](../ontology/AgentCustomEndpoint.md)

Custom provider endpoint configuration. Only applicable when provider is 'custom'. Allows connecting to any OpenAI-compatible API (self-hosted models, vLLM, Ollama, etc.) or Anthropic-compatible endpoints.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `baseUrl` | `String` | no |  |  |  | Base URL of the custom API (e.g., 'https://my-model.example.com/v1' or 'http://localhost:11434/v1'). |
| `apiKeyEnvVar` | `String` | no |  |  |  | Name of the environment variable containing the API key for the custom endpoint (e.g., 'CUSTOM_AI_API_KEY'). The key is read from process.env at runtime. |
| `apiFormat` | `AgentApiFormat` | no |  | `openai`, `anthropic`, `raw` |  | API format to use: 'openai' for OpenAI-compatible chat completions, 'anthropic' for Anthropic Messages format, 'raw' for full control over request/response shape. |

## Constraints

Property rules:

- `apiFormat` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
