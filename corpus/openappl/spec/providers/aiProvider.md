# Provider catalog: aiProvider

Entries of this family are written with [`AiProvider`](../AiProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

## Environment names

| Prefix | Key style |
|---|---|
| `AI_PROVIDER` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`openai`](#openai) | 3 | 1 | 1 |
| [`anthropic`](#anthropic) | 3 | 1 | 1 |
| [`xai`](#xai) | 2 | 1 | 1 |
| [`deepseek`](#deepseek) | 2 | 1 | 1 |
| [`moonshot`](#moonshot) | 2 | 1 | 1 |
| [`fal`](#fal) | 2 | 1 | 1 |
| [`elevenlabs`](#elevenlabs) | 3 | 1 | 1 |
| [`runway`](#runway) | 2 | 1 | 1 |
| [`google`](#google) | 5 | 2 | 2 |
| [`azure-openai`](#azure-openai) | 4 | 3 | 1 |
| [`bedrock`](#bedrock) | 4 | 3 | 2 |
| [`ollama`](#ollama) | 2 | 1 | 0 |
| [`custom`](#custom) | 4 | 2 | 1 |
| [`mock`](#mock) | 1 | 0 | 0 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | ai |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live"] |
| `mockCredentialMode` | refused |
| `mockBrand` | mock |
| `liveDetection` | none |
| `credentialScopes` | ["saas","tenant","resource","user"] |
| `scopeField` | credentialScopes |
| `scopedBrands` | ["openai","anthropic","xai","deepseek","moonshot","elevenlabs","runway","fal","custom"] |
| `note` | The sets carry the SECRET keys only: a non-secret AI key is baked into the manifest. The `mock` BRAND is a keyless offline adapter a designer picks in the blueprint (provider `mock`, nodejs only, never a credential fallback); it is NOT the credential mode `mock`, which this family refuses (`PROVIDER_CREDENTIAL_MODE_MOCK_UNSUPPORTED`). Tenant, resource and user keys need `credentialScopes` on the entry and a brand in `scopedBrands`. A `subscriptionToken` credential (AgentHarness `modelSettings.auth: userSubscription`) is tenant or user only: the saas level is refused (`AGENT_HARNESS_SUBSCRIPTION_SCOPE_OFF`). |

## Keys of every brand

Family-wide keys: catalogued for EVERY aiProvider brand, custom included, matched case-insensitively. The secret classifier reads this table after the brand's own row and before the keyword backstop. The numeric tuning keys are non-secret, so a name that trips the backstop (maxTokens, tokenLimit: the 'token' keyword) keeps its typed value in the generated manifest instead of moving to a string env var. serviceAccountJson is credential material under any brand and any casing, and its name trips no backstop keyword, so it is listed as a secret here.

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `maxTokens` | number |  |  |  |  |  | Default cap on generated tokens per call (number). Read by every adapter as maxTokens. The AgentHarness runner's model gateway also clamps a translated call's max_tokens to it (then to maxOutputTokens, then maxCompletionTokens, the first one set). |
| `maxOutputTokens` | number |  |  |  |  |  | Output-token cap under the name some provider APIs use (number). The bundled adapters read maxTokens; this row keeps a value authored under this name typed and non-secret. |
| `maxCompletionTokens` | number |  |  |  |  |  | Output-token cap under the OpenAI reasoning-model name (number). The bundled adapters read maxTokens; this row keeps a value authored under this name typed and non-secret. |
| `tokenLimit` | number |  |  |  |  |  | Overall token cap (number). Not read by the bundled adapters; this row keeps a value authored under this name typed and non-secret. |
| `contextWindowTokens` | number |  |  |  |  |  | Override of the model's context window in tokens, used for compaction (number). |
| `temperature` | number |  |  |  |  |  | Default sampling temperature (number). Read by the bundled adapters as temperature. |
| `topP` | number |  |  |  |  |  | Nucleus-sampling probability mass (number). Not read by the bundled adapters; catalogued so the value stays typed. |
| `serviceAccountJson` | text | yes |  |  |  |  | Service-account JSON (credential material) under any brand and any casing: always a deploy secret, never compiled into the service. The google brand row documents its use. |
| `topK` | number |  |  |  |  |  | Top-k sampling cutoff (number). Not read by the bundled adapters; catalogued so the value stays typed. |

## openai

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | OpenAI API key (sk-...). |
| `organization` | string |  |  |  |  |  | OpenAI organization id. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. gpt-4o-mini. |

## anthropic

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Anthropic API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. claude-sonnet-4-5. |
| `baseUrl` | string |  |  |  |  |  | API root of a proxy or gateway that serves the Anthropic Messages API, e.g. https://gateway.example.com. The adapter posts to <baseUrl>/v1/messages (a baseUrl that already ends in /v1 gets /messages only). Unset means https://api.anthropic.com. |

## xai

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | xAI API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. grok-4. |

## deepseek

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | DeepSeek API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model. |

## moonshot

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Moonshot API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model. |

## fal

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | fal.ai API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. fal-ai/flux/dev. |

## elevenlabs

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | ElevenLabs API key. |
| `voice` | string |  |  |  |  |  | Default voice id. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. eleven_multilingual_v2. |

## runway

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Runway API key. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model. |

## google

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes |  |  |  | group `auth` (one full group is required) | NOT SUPPORTED - the Vertex adapter never reads an apiKey, and validation refuses it with AI_PROVIDER_UNSUPPORTED_CONFIG. Vertex authenticates with projectId + location, plus serviceAccountJson for an inline service account or GOOGLE_APPLICATION_CREDENTIALS on the deployment for Application Default Credentials; for the key-only Gemini Developer API use provider="custom" against a Gemini-compatible baseUrl. This key is listed ONLY so that an already-authored blueprint value stays classified as a secret - masking and deploy-secret relocation read this table, and dropping the entry would turn a real credential into an unrecognised key carried in clear. |
| `projectId` | string |  | yes |  |  | group `auth` (one full group is required) | Vertex project id. |
| `location` | string |  | yes |  |  | group `auth` (one full group is required) | Vertex location, e.g. us-central1. |
| `serviceAccountJson` | text | yes |  |  |  | group `auth` (one full group is required) | Vertex service-account JSON (inline). Omit it to authenticate with Application Default Credentials - the deployer sets GOOGLE_APPLICATION_CREDENTIALS instead. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. gemini-2.0-flash. |

## azure-openai

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Azure OpenAI key. |
| `baseUrl` | string |  | yes |  |  |  | Azure OpenAI endpoint URL. |
| `deployment` | string |  | yes |  |  |  | Deployment name. |
| `apiVersion` | string |  |  | `2024-10-21` |  |  | API version. |

## bedrock

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `awsAccessKeyId` | string | yes | yes |  |  |  | AWS access key id. Credential material: delivered as a deploy secret, never compiled into the service. |
| `awsSecretAccessKey` | string | yes | yes |  |  |  | AWS secret access key. |
| `awsRegion` | string |  | yes |  |  |  | AWS region, e.g. us-east-1. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model, e.g. anthropic.claude-3-5-sonnet-20241022-v2:0. |

## ollama

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | Ollama server URL, e.g. http://localhost:11434. |
| `defaultModel` | string |  |  |  |  | read as `model` | Default model. |

## custom

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes |  |  |  |  | Optional API key. |
| `baseUrl` | string |  | yes |  |  |  | Target base URL. With apiFormat openai it is the API root the /chat/completions path is appended to (usually ending in /v1); with apiFormat anthropic the adapter posts to <baseUrl>/v1/messages (a baseUrl that already ends in /v1 gets /messages only). |
| `apiFormat` | enum |  | yes |  | `openai`, `anthropic`, `raw` |  | Wire format the endpoint speaks. |
| `extraHeaders` | json |  |  |  |  |  | Extra request headers as a JSON string. |

## mock

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `seed` | string |  |  |  |  |  | Optional deterministic mock AI seed, defaults to `mindbricks`. Mixed with messages to derive offline text/JSON replies; no key or network. |
