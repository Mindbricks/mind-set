# DecisionProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [DecisionProviderConfig in Part 2](../spec/DecisionProviderConfig.md)

Provider credentials and settings for a DecisionProvider entry. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to DECISION_PROVIDER_<NAME>_* env vars. Per provider: typesafe reads apiKey (secret, required), model (required, PINNED — e.g. 'jev-1.13.0'), baseUrl (optional override of https://api.typesafe.ai for proxies and test harnesses); custom reads baseUrl (required), apiFormat, apiKey (secret, optional), model (optional), extraHeaders; mock is keyless and optionally reads seed. `apiKey` is masked in API responses and delivered via $SECRET_ env at deploy time — it never reaches a log line or an error body.

## Contained in

- [DecisionProvider](./DecisionProvider.md) as `configuration`

## Contains

- `extraHeaders`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
