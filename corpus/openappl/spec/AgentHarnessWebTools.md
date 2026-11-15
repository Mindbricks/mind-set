# AgentHarnessWebTools

**Level:** `subsection` · **Family:** [AgentHarness](../ontology/families.md#agentharness) (domain `AgentHubConfig`)

**Ontology:** [AgentHarnessWebTools in Part 1](../ontology/AgentHarnessWebTools.md)

Platform web tools offered to an AgentHarness through its session MCP endpoint, each backed by a root `integrations[]` entry of the project.

Declare the integration as `{ "name": "serperMain", "provider": "serper", "configuration": { "apiKey": "..." } }`. `name` is optional and defaults to the provider; a webTools value names the entry (its name, or the provider when only one entry has it). The framework brands are:

| family | provider | configuration |
|---|---|---|
| searchProvider | `serper` (Google results) | `apiKey` (required, secret), `gl`, `hl`, `timeoutMs` (default 10000), `baseUrl` |
| searchProvider | `brave` (Brave Search API) | `apiKey` (required, secret), `gl`, `hl`, `timeoutMs` (default 10000), `baseUrl` |
| scrapProvider | `zyte` (Zyte API) | `apiKey` (required, secret), `timeoutMs` (default 60000), `maxBytes` (default 2000000), `baseUrl` |

The configuration reaches the runtime as the secret env `INTEGRATION_<NAME>_CONFIG` and the `apiKey` is relocated out of the stored blueprint. Keys never appear in a log line, an error or a tool result.

`web_search` answers `{ provider, latencyMs, results: [{ title, url, snippet }] }`. Result URLs are cleaned of the tracking parameters `srsltid`, `utm_*`, `gclid` and `fbclid`. `web_fetch_scrape` fetches one public http(s) page through Zyte, as raw `html`, readable `text` or a rendered `browser` page. Private, loopback and link-local targets are refused before any call, and the content is capped at `maxBytes`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `search` | `String` | no |  |  |  | The searchProvider integration (`serper` or `brave`) behind the `web_search` tool: one integration name, or an ordered comma-separated fallback chain such as `serperMain, braveBackup` (first = primary). The next provider is tried on an error, a timeout or an exhausted quota. An empty answer moves on only for a free-text query; an exact-identifier or `site:` query with no result is final, because a fallback engine that cannot exact-match would return unrelated pages. Null leaves the tool out. Each name must resolve to a project integration (AGENT_HARNESS_UNKNOWN_WEB_TOOL_PROVIDER) of the searchProvider family (AGENT_HARNESS_WEB_TOOL_PROVIDER_WRONG_CATEGORY). |
| `scrape` | `String` | no |  |  |  | The one scrapProvider integration (`zyte`) behind the `web_fetch_scrape` tool. Null leaves the tool out. It must resolve to a project integration (AGENT_HARNESS_UNKNOWN_WEB_TOOL_PROVIDER) of the scrapProvider family (AGENT_HARNESS_WEB_TOOL_PROVIDER_WRONG_CATEGORY), and names exactly one (AGENT_HARNESS_WEB_TOOL_SCRAPE_SINGLE_PROVIDER). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
