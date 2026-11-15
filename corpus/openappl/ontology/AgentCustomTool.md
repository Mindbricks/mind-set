# AgentCustomTool

**Level:** `subsection` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentCustomTool in Part 2](../spec/AgentCustomTool.md)

Defines a custom tool that the agent can invoke during its execution loop. Custom tools are used when existing CRUD, API, or library tools are not sufficient. Each tool has a name, description (shown to the AI), a JSON Schema defining its parameters, and a handler pointing to a library function.

## Contained in

- [AgentToolSettings](./AgentToolSettings.md) as `customTools` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
