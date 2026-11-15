# Provider catalog: decisionProvider

Entries of this family are written with [`DecisionProvider`](../DecisionProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

Calibrated decision layer (System One models; Jev-first — docs/ADR-decision-layer-system-one.md). Its own family, never a brand under aiProvider: a System One model has no prompt, a typed answer instead of a response format, and free output tokens, so the AI family's price table would misprice a call by ~70x and fire cost ceilings on the cheapest thing in the project. The mock brand is a REAL transport (the payment MOCK_TRANSPORT_BRANDS precedent), so a build never blocks on a missing credential and CI never reaches the network.

## Environment names

| Prefix | Key style |
|---|---|
| `DECISION_PROVIDER` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`typesafe`](#typesafe) | 3 | 2 | 1 |
| [`custom`](#custom) | 5 | 1 | 1 |
| [`mock`](#mock) | 1 | 0 | 0 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | decision |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live","mock"] |
| `mockCredentialMode` | allowed |
| `mockBrand` | mock |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |

## typesafe

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | TypeSafe AI API key (Bearer). Emitted as DECISION_PROVIDER_<NAME>_API_KEY, masked in API responses; never reaches a log line or an error body. |
| `model` | string |  | yes |  |  |  | PINNED Jev model version sent on every request, e.g. 'jev-1.13.0'. A floating tag ('jev-latest', 'latest', a bare family name) is refused at validation with DECISION_MODEL_NOT_PINNED: an unpinned model answers differently on two consecutive days and breaks every cache whose key includes the model version. |
| `baseUrl` | string |  |  |  |  |  | Override for the default https://api.typesafe.ai base URL — test harnesses, mock integrator servers and proxies. Leave empty in production. |

## custom

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `baseUrl` | string |  | yes |  |  |  | Custom decision endpoint base URL — either a TypeSafe-wire-compatible endpoint or the vendor endpoint an emulation apiFormat is spoken against. |
| `apiKey` | string | yes |  |  |  |  | Optional API key for the custom endpoint (a private emulation endpoint may be keyless). Masked in API responses; never reaches a log line or an error body. |
| `apiFormat` | enum |  |  | `systemone` | `systemone`, `openai`, `anthropic` |  | Wire protocol spoken against baseUrl: 'systemone' = the TypeSafe /v1/systemone contract verbatim; 'openai' / 'anthropic' = the decision interface emulated over that vendor's structured-output call. |
| `model` | string |  |  |  |  |  | Pinned model version forwarded to the endpoint (systemone) or the underlying LLM model id (openai/anthropic emulation). The DECISION_MODEL_NOT_PINNED rule applies when set. |
| `extraHeaders` | json |  |  |  |  |  | Additional HTTP headers sent on every request, as a JSON object (e.g. an internal gateway routing header). NOT masked — real secrets go in apiKey, never here. |

## mock

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `seed` | string |  |  |  |  |  | Deterministic seed mixed into the mock's answer derivation — the mock answers all three question types (noul/choice/score) deterministically from (seed, state, question), so a generated test can assert on a decision without a key. Optional; defaults to a fixed seed so two builds agree. |
