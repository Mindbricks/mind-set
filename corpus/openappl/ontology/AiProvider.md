# AiProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AiProvider in Part 2](../spec/AiProvider.md)

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
- mock: seed (optional, defaults to `mindbricks`). Keyless offline text completions, declared explicitly, never a credential fallback. Node.js and Rust; other deployment languages refuse the brand until ported. [[mock-ai reply=<text or JSON>]] steers test responses only with explicit matching dev/preview/staging deployment signals; production and unknown signals refuse directives.

## Contained in

- [AiProvidersSettings](./AiProvidersSettings.md) as `aiProviders` (a list)

## Contains

- `configuration`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list
- `credentialScopes`: [AiProviderCredentialScopes](./AiProviderCredentialScopes.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
