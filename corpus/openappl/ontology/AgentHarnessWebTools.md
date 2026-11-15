# AgentHarnessWebTools

**Level:** `subsection` · **Family:** [AgentHarness](./families.md#agentharness) (domain `AgentHubConfig`)

**Specification:** [AgentHarnessWebTools in Part 2](../spec/AgentHarnessWebTools.md)

Platform web tools offered to an AgentHarness through its session MCP endpoint, each backed by a root `integrations[]` entry of the project.

Declare the integration as `{ "name": "serperMain", "provider": "serper", "configuration": { "apiKey": "..." } }`. `name` is optional and defaults to the provider; a webTools value names the entry (its name, or the provider when only one entry has it). The framework brands are:

| family | provider | configuration |
|---|---|---|
| searchProvider | `serper` (Google results) | `apiKey` (required, secret), `gl`, `hl`, `timeoutMs` (default 10000), `baseUrl` |
| searchProvider | `brave` (Brave Search API) | `apiKey` (required, secret), `gl`, `hl`, `timeoutMs` (default 10000), `baseUrl` |
| scrapProvider | `zyte` (Zyte API) | `apiKey` (required, secret), `timeoutMs` (default 60000), `maxBytes` (default 2000000), `baseUrl` |

The configuration reaches the runtime as the secret env `INTEGRATION_<NAME>_CONFIG` and the `apiKey` is relocated out of the stored blueprint. Keys never appear in a log line, an error or a tool result.

`web_search` answers `{ provider, latencyMs, results: [{ title, url, snippet }] }`. Result URLs are cleaned of the tracking parameters `srsltid`, `utm_*`, `gclid` and `fbclid`. `web_fetch_scrape` fetches one public http(s) page through Zyte, as raw `html`, readable `text` or a rendered `browser` page. Private, loopback and link-local targets are refused before any call, and the content is capped at `maxBytes`.

## Contained in

- [AgentHarnessToolSettings](./AgentHarnessToolSettings.md) as `webTools`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
