# AgentContextSource

**Level:** `subsection` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentContextSource in Part 2](../spec/AgentContextSource.md)

Defines a dynamic data source that fetches context at runtime. Used in both systemPromptSources (injected into the system message) and contextSources (injected into the user prompt). Each source produces a named variable accessible via MScript in templates.

## Contained in

- [AgentInputSettings](./AgentInputSettings.md) as `contextSources` (a list)
- [AgentModelSettings](./AgentModelSettings.md) as `systemPromptSources` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
