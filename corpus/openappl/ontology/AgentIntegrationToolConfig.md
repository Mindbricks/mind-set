# AgentIntegrationToolConfig

**Level:** `subsection` · **Family:** [AIAgent](./families.md#aiagent) (domain `Service`)

**Specification:** [AgentIntegrationToolConfig in Part 2](../spec/AgentIntegrationToolConfig.md)

Configures an integration provider as a tool source for the agent. Explicit method names (comma-separated) create individual tools with full JSON Schema parameters. Wildcard '*' creates a single dispatcher tool per integration plus a shared getIntegrationMethodDoc helper for looking up exact method signatures on demand.

## Contained in

- [AgentToolSettings](./AgentToolSettings.md) as `integrationTools` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
