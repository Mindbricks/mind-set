# AiProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AiProvidersSettings in Part 1](../ontology/AiProvidersSettings.md)

Container for AI provider configurations — LLM, image, audio, and video backends used by AI agents (`agentHub.aiAgents`), `AiCallAction` business-API actions, and the mcpbff chat surface. Each entry is a named provider that can be referenced by AIAgent.modelSettings.providerName / AiCallAction.providerName / chat agent config. The generator emits AI_PROVIDER_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config. Replaces the legacy `aiSettings` (fixed openAI + Anthropic key pair) with the same shape used by bucketProvidersSettings and notificationProvidersSettings — multiple entries can share the same provider type (e.g. two OpenAI accounts on different orgs, or one OpenAI for chat and one for embeddings).

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `getAiProviderByName` | `const { getAiProviderByName } = require("common")` | `getAiProviderByName(name, overrides?)` constructs the adapter of a provider declared in `aiProvidersSettings.aiProviders[]` (its settings plus the `AI_PROVIDER_` environment values the generator emits for it). | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `aiProviders` | [`AiProvider`](./AiProvider.md)[] | no |  |  |  | List of configured AI providers. Add one entry per AI account / backend you want available. Multiple entries can share the same provider type (e.g. two OpenAI keys on different orgs). |
| `modelPrices` | [`AiModelPrice`](./AiModelPrice.md)[] | no |  |  |  | Optional model price overrides for the AI agent cost governor. The agent runtime prices every provider call from a versioned, dated built-in table in USD per 1M tokens (input, output, prompt-cache read and prompt-cache write, with the date each row was read and its source) covering the current Anthropic Claude models, the current OpenAI and Google Gemini models, and xAI and DeepSeek. A model id is matched exactly first, then by the longest family prefix (the key followed by '-', '@', ':' or '_'); a model that matches nothing is priced by the '*' fallback (3 USD input / 15 USD output per 1M tokens) and its cost is marked estimated. Costs are approximate: list prices, without batch, priority, regional or contract discounts. Each entry here is merged OVER the built-in table in every generated service that hosts agents; the AGENT_MODEL_PRICES environment variable (JSON map of model key -> { inputPerMTok, outputPerMTok, cacheReadPerMTok, cacheWritePerMTok }) is merged last and wins. Use it for a model the built-in table does not know (self-hosted, fine-tuned, a new release) or whose contract price differs. |

## Constraints

Property rules:

- The items of `aiProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `modelPrices` must have distinct names (`model`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
