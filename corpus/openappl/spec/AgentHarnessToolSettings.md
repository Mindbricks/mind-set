# AgentHarnessToolSettings

**Level:** `section` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessToolSettings in Part 1](../ontology/AgentHarnessToolSettings.md)

The project tools an AgentHarness may call. The per-session MCP endpoint serves exactly this list and executes each call as the session owner, so permissionCheck, tenant gates and ownership apply as for a direct API call. Every API tool is reached over the network from the harness runner, so its BusinessApi must have a REST controller.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiTools` | `String` | no |  |  |  | Comma-separated BusinessApi names exposed as tools (the AIAgent.toolSettings.apiTools vocabulary). Each must exist in a project service and have a REST controller (AGENT_HARNESS_UNKNOWN_API_TOOL, AGENT_HARNESS_API_TOOL_NOT_EXPOSABLE). The call runs as the session owner: the user's forwarded bearer for a frontend session. A Kafka-triggered session runs as the agentHub M2M service identity and can call only the m2mTools subset. |
| `m2mTools` | `String` | no |  |  |  | Comma-separated SUBSET of apiTools that run over the machine (M2M) identity instead of the session owner's (the AIAgent.toolSettings.m2mTools vocabulary). Each entry must be in apiTools and its BusinessApi must allow M2M callers. A harness with enabled triggers must list every apiTools entry here: a triggered session calls tools only over M2M, so any other apiTool is an error (AGENT_HARNESS_TRIGGERED_TOOL_NOT_M2M), or a warning that triggered sessions will not see it when the harness also allows frontend sessions. |
| `agentTools` | `String` | no |  |  |  | Comma-separated names of design-time AI agents (hub or service) the harness may invoke as tools, registered as `invoke_agent_<name>`. An agent tool runs as the session owner, so a Kafka-triggered session (M2M identity) never sees it. |
| `approvalRequiredTools` | `String` | no |  |  |  | Comma-separated tool names that pause the session for human approval before they run, through the existing approval flow (`/agent-runs/:runId/approve`). Names are the registered ones: the BusinessApi name, `invoke_agent_<name>`, `web_search`, `web_fetch_scrape`. Each must be a tool this harness has (AGENT_HARNESS_UNKNOWN_APPROVAL_TOOL). Put destructive tools here, above all on a triggered harness. |
| `webTools` | [`AgentHarnessWebTools`](./AgentHarnessWebTools.md) | no |  |  |  | The platform web tools of the session MCP endpoint (maintainer ruling Q3): `web_search` and `web_fetch_scrape`, each backed by a framework search or scrape integration of the project. The integration keys stay server-side and never enter the sandbox. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_M2M_TOOL_API_NOT_M2M_ALLOWED` | error | m2mTools entry "…" runs over the machine (M2M) identity, but the BusinessApi "…" on service "…" does not allow M2M callers, so every call would answer 401. |
| `AGENT_M2M_TOOL_NOT_IN_API_TOOLS` | error | m2mTools entry "…" is not one of this harness's apiTools (…). |
