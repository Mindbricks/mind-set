# AiModelPrice

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [AiModelPrice in Part 1](../ontology/AiModelPrice.md)

**Name:** an instance is named by `model`.

One model price override for the AI agent cost governor: a model key and its USD prices per 1M input, output, prompt-cache read and prompt-cache write tokens. Matched against the agent's model id case-insensitively: an exact key first, then the longest key that is a family prefix of the id (e.g. 'gpt-4o-mini' matches 'gpt-4o-mini-2024-07-18'), across the built-in table, these entries and AGENT_MODEL_PRICES; an override key that is neither still matches as a substring of the id, after every exact and prefix match.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `model` | `String` | yes |  |  |  | Model id or family prefix this price applies to, e.g. 'gpt-4o-mini', 'llama-3.3-70b', 'my-finetune'. Matched case-insensitively against the agent's resolved model id (modelSettings.model or the provider's defaultModel): an exact match first, then the longest family prefix, then a substring. |
| `inputPerMTok` | `Double` | yes |  |  | min 0 | Price in USD per 1,000,000 input (prompt) tokens. 0 for a free/self-hosted model. |
| `outputPerMTok` | `Double` | yes |  |  | min 0 | Price in USD per 1,000,000 output (completion) tokens. 0 for a free/self-hosted model. |
| `cacheReadPerMTok` | `Double` | no |  |  | min 0 | Optional price in USD per 1,000,000 prompt-cache read (cache hit) tokens. Leave empty to bill cache reads at inputPerMTok. |
| `cacheWritePerMTok` | `Double` | no |  |  | min 0 | Optional price in USD per 1,000,000 prompt-cache write tokens (the default 5-minute cache). Leave empty to bill cache writes at inputPerMTok. |

## Constraints

Property rules:

- `model`, `inputPerMTok`, `outputPerMTok` must be present. (`REQUIRED_FIELD_MISSING`)
- `inputPerMTok` must be at least 0. (`VALUE_OUT_OF_RANGE`)
- `outputPerMTok` must be at least 0. (`VALUE_OUT_OF_RANGE`)
- `cacheReadPerMTok` must be at least 0. (`VALUE_OUT_OF_RANGE`)
- `cacheWritePerMTok` must be at least 0. (`VALUE_OUT_OF_RANGE`)
