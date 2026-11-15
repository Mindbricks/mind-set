# DecisionProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [DecisionProviderConfig in Part 1](../ontology/DecisionProviderConfig.md)

Provider credentials and settings for a DecisionProvider entry. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to DECISION_PROVIDER_<NAME>_* env vars. Per provider: typesafe reads apiKey (secret, required), model (required, PINNED — e.g. 'jev-1.13.0'), baseUrl (optional override of https://api.typesafe.ai for proxies and test harnesses); custom reads baseUrl (required), apiFormat, apiKey (secret, optional), model (optional), extraHeaders; mock is keyless and optionally reads seed. `apiKey` is masked in API responses and delivered via $SECRET_ env at deploy time — it never reaches a log line or an error body.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiKey` | `String` | no |  |  | **secret** | (typesafe/custom) API key. Secret — masked in API responses and emitted to DECISION_PROVIDER_<NAME>_API_KEY at codegen time. Required for typesafe; optional for custom (a private emulation endpoint may be keyless). The key never reaches a log line or an error body. |
| `model` | `String` | no |  |  |  | (typesafe/custom) The PINNED model version the adapter sends on every request, e.g. 'jev-1.13.0'. Floating tags ('jev-latest', 'latest', a bare family name with no version) are refused at validation with ERROR DECISION_MODEL_NOT_PINNED: an unpinned model makes the same blueprint answer differently on two consecutive days, which reddens tests with no attributable cause and breaks decision caches whose key includes the model version. |
| `baseUrl` | `String` | no |  |  |  | (custom: required; typesafe: optional) Endpoint base URL. For typesafe it overrides https://api.typesafe.ai (test harnesses, mock integrator servers and proxies — leave empty in production). For custom it is the designer-supplied endpoint the apiFormat is spoken against. |
| `apiFormat` | `DecisionApiFormat` | no | `"systemone"` | `systemone`, `openai`, `anthropic` |  | (custom) The wire protocol spoken against baseUrl. 'systemone' (default) = the TypeSafe /v1/systemone request/response contract, verbatim; 'openai' / 'anthropic' = the decision interface emulated over that vendor's structured-output call (the adapter builds the JSON-schema envelope and parses the typed answer back). |
| `extraHeaders` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | (custom) Additional HTTP headers sent on every request to baseUrl (e.g. an internal gateway routing header). Values are NOT masked — put real secrets in apiKey, never here. |
| `seed` | `String` | no |  |  |  | (mock) Deterministic seed mixed into the mock's answer derivation. The mock answers all three question types deterministically from (seed, state, question), so a generated test can assert on a decision without a key; change the seed to shift the whole answer surface at once. Optional — defaults to a fixed seed so two builds agree. |

## Constraints

Property rules:

- `apiFormat` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `extraHeaders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
