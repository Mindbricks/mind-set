# AiProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AiProvidersSettings in Part 2](../spec/AiProvidersSettings.md)

Container for AI provider configurations — LLM, image, audio, and video backends used by AI agents (`agentHub.aiAgents`), `AiCallAction` business-API actions, and the mcpbff chat surface. Each entry is a named provider that can be referenced by AIAgent.modelSettings.providerName / AiCallAction.providerName / chat agent config. The generator emits AI_PROVIDER_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config. Replaces the legacy `aiSettings` (fixed openAI + Anthropic key pair) with the same shape used by bucketProvidersSettings and notificationProvidersSettings — multiple entries can share the same provider type (e.g. two OpenAI accounts on different orgs, or one OpenAI for chat and one for embeddings).

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `getAiProviderByName` | `const { getAiProviderByName } = require("common")` | `getAiProviderByName(name, overrides?)` constructs the adapter of a provider declared in `aiProvidersSettings.aiProviders[]` (its settings plus the `AI_PROVIDER_` environment values the generator emits for it). | nodejs |

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `aiProvidersSettings`

Blueprint paths:

- `projectSettings.aiProvidersSettings`

## Contains

- `aiProviders`: [AiProvider](./AiProvider.md), a list
- `modelPrices`: [AiModelPrice](./AiModelPrice.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
