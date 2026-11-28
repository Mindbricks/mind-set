# AiProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AiProvider in Part 1](../ontology/AiProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [aiProvider](./providers/aiProvider.md).

A named AI provider configuration. The `name` is the lookup key used by AIAgent.modelSettings.providerName / AiCallAction.providerName / mcpbff chat-agent config, and the env-var prefix (e.g. `summarizer` → `AI_PROVIDER_SUMMARIZER_*`). The `provider` enum selects the backend SDK / adapter shipped under `_common/nodejs/src/common/ai-providers/`. The `configuration` is a free-form key/value list whose required keys depend on the chosen `provider`; the UI and the agent ontology doc enforce the per-provider shape.

Expected configuration keys per provider:
- openai: apiKey, organization (optional), defaultModel (optional, e.g. 'gpt-4o-mini')
- anthropic: apiKey, defaultModel (optional, e.g. 'claude-sonnet-4-5'), baseUrl (optional, the API root of a proxy or gateway; the adapter posts to <baseUrl>/v1/messages)
- xai: apiKey, defaultModel (optional, e.g. 'grok-4')
- deepseek: apiKey, defaultModel (optional)
- moonshot: apiKey, defaultModel (optional)
- fal: apiKey, defaultModel (optional, e.g. 'fal-ai/flux/dev')
- elevenlabs: apiKey, voice (optional default voice id), defaultModel (optional, e.g. 'eleven_multilingual_v2')
- runway: apiKey, defaultModel (optional)
- google: projectId + location, plus serviceAccountJson for an inline service account (omit it to authenticate with GOOGLE_APPLICATION_CREDENTIALS / Application Default Credentials), defaultModel (optional, e.g. 'gemini-2.0-flash'). apiKey is NOT supported by the Vertex adapter and is rejected by validation (AI_PROVIDER_UNSUPPORTED_CONFIG)
- azure-openai: apiKey, baseUrl, deployment, apiVersion (optional, default '2024-10-21')
- bedrock: awsAccessKeyId, awsSecretAccessKey, awsRegion, defaultModel (optional, e.g. 'anthropic.claude-3-5-sonnet-20241022-v2:0')
- ollama: baseUrl (e.g. 'http://localhost:11434'), defaultModel (optional) — keyless
- custom: apiKey (optional), baseUrl, apiFormat ('openai'|'anthropic'|'raw'), extraHeaders (optional JSON string)

Secret keys (apiKey, awsAccessKeyId, awsSecretAccessKey, serviceAccountJson) are masked in API responses and emitted to AI_PROVIDER_<NAME>_<KEY> env vars at codegen time. The apiKey listed for a brand is the application owner's (saas) key: when `credentialScopes` makes a tenant or user level `required` the entry may leave it out, because each tenant or user stores their own key through the auth service (nodejs services; see AiProviderCredentialScopes).
- mock: seed (optional, defaults to `mindbricks`). Keyless offline text completions, declared explicitly, never a credential fallback. Node.js, Rust and Python; other deployment languages refuse the brand until ported. [[mock-ai reply=<text or JSON>]] steers test responses only with explicit matching dev/preview/staging deployment signals; production and unknown signals refuse directives.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from AIAgent.modelSettings.providerName / AiCallAction.providerName / mcpbff chat config and as the env-var prefix. Must be a valid codeName. |
| `provider` | `AiProviderType` | no | `"openai"` | 14 values, see [AiProviderType](#aiprovidertype) |  | The backend provider implementation. Selects which keys are expected in `configuration` and which adapter the codegen wires up. The mock brand is explicitly declared keyless offline text completion on Node.js, Rust and Python, never an implicit fallback; see the mock AI provider guide. |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of provider-specific credentials and settings. The required keys depend on `provider` — see the AiProvider doc string for the per-provider key list. The UI enforces the right form fields per provider; agents emit only keys that match. Sensitive keys (apiKey, awsSecretAccessKey, serviceAccountJson) are masked in API responses and emitted to environment variables at codegen time. |
| `credentialScopes` | [`AiProviderCredentialScopes`](./AiProviderCredentialScopes.md) | no |  |  |  | Optional. Lets a tenant or a user bring their own key (BYOK) for this provider entry instead of, or as well as, the application owner's key in `configuration`. Leave it empty, or set every scope to `off`, and the entry behaves exactly as before: one key, the application owner's. The levels are saas (the owner's key in `configuration`, deployed as a secret), tenant (multi-tenant projects only), resource (a row of a data object that carries a membership configuration, such as a workspace, a team or a company: its owner and its admins set one key every member uses; see `credentialScopes.resource`) and user. At call time the key is taken from the user, then the resource, then the tenant, then the saas level, skipping any level that is `off` or has no stored key. A scoped credential carries only the secret key plus the brand's organisation or project field (openai: apiKey, organization, project; the other supported brands: apiKey); `baseUrl`, the model and every other option stay this entry's, so a user can never point calls at another host. Supported brands: openai, anthropic, xai, deepseek, moonshot, elevenlabs, runway, fal, custom. google, azure-openai, bedrock, ollama and mock cannot enable a scope. Keys are saved through the auth service (`/my-provider-credentials`, `/tenant-provider-credentials`), checked with a cheap live call before they are stored, and kept encrypted; no API, log or error ever returns them. |

## Allowed values

### AiProviderType

`openai`, `anthropic`, `xai`, `deepseek`, `moonshot`, `fal`, `elevenlabs`, `runway`, `google`, `azure-openai`, `bedrock`, `ollama`, `custom`, `mock`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AI_PROVIDER_MOCK_UNSUPPORTED_LANGUAGE` | error | AI provider "…" declares the keyless mock brand, which is implemented only for …. |
| `UNIQUE_AI_PROVIDER_NAME` | error | AI provider name "…" is used by … entries in projectSettings.aiProvidersSettings.aiProviders[]. |
