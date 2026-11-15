# AiModelPrice

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [AiModelPrice in Part 2](../spec/AiModelPrice.md)

One model price override for the AI agent cost governor: a model key and its USD prices per 1M input, output, prompt-cache read and prompt-cache write tokens. Matched against the agent's model id case-insensitively: an exact key first, then the longest key that is a family prefix of the id (e.g. 'gpt-4o-mini' matches 'gpt-4o-mini-2024-07-18'), across the built-in table, these entries and AGENT_MODEL_PRICES; an override key that is neither still matches as a substring of the id, after every exact and prefix match.

## Contained in

- [AiProvidersSettings](./AiProvidersSettings.md) as `modelPrices` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
