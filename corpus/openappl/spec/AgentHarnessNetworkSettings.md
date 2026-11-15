# AgentHarnessNetworkSettings

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessNetworkSettings in Part 1](../ontology/AgentHarnessNetworkSettings.md)

Outbound network policy of an AgentHarness's sandboxed process (maintainer ruling Q3). The model gateway and the session MCP endpoint are always reachable.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `egress` | `AgentHarnessEgress` | no | `"open"` | `open`, `allowlist` |  | `open` (the default) lets the process reach any host; `allowlist` limits it to allowedHosts. |
| `allowedHosts` | `String`[] | no |  |  |  | Hosts the process may reach when egress is `allowlist` (at most 100). Each entry is a lowercase host name with at least two labels (`api.example.com`), the same with a leading `*.` wildcard for any sub-domain (`*.example.com`), or an IPv4 literal, each with an optional `:port`. A scheme, path, bare `*` or localhost is refused (AGENT_HARNESS_INVALID_ALLOWED_HOST). Ignored when egress is open. |

## Constraints

Property rules:

- `egress` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
