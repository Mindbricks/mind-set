# RemoteSessionConfig

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [RemoteSessionConfig in Part 1](../ontology/RemoteSessionConfig.md)

Not available: reachable only through the disabled RemoteSession slot of AuthBasics, so nothing is generated from it. Configuration details for remote session retrieval, including session path, ID extraction, caching, and the HTTP request to the remote service.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sessionPath` | `String` | no | `"session"` |  | format [dotPath](./value-formats.md#dotpath) | Declared path to session data in a remote response. Hydration defaults omitted, null or blank values to session; undefined does not currently select the whole response. The remote-session slot in AuthBasics is disabled and current nodejs generation does not consume this path. Whole-response selection, response normalization and verified-identity binding require a contract. |
| `sessionIdPath` | `String` | no | `"sessionId"` |  | format [dotPath](./value-formats.md#dotpath) | Declared path to a session identifier in remote session data, schema default sessionId. The remote-session slot in AuthBasics is disabled; current nodejs generation does not normalize a remote session through this field. Verified owner/session binding and identifier extraction remain undecided. |
| `writeInStore` | `Boolean` | no | `true` |  |  | Determines whether the retrieved session should be cached locally. If true, the issuer's answer is stored locally for a short revalidation window (5 minutes, HexaAuth.REMOTE_SESSION_CACHE_TTL_SECONDS) and then fetched again; a cached copy that predates its owner's session-invalidation epoch (a log-out-everywhere, a deleted or blocked user) is dropped on the next request. |
| `sessionRequest` | [`HTTPRequest`](./HTTPRequest.md) | yes |  |  |  | Declared request for remote session retrieval. The remote-session slot in AuthBasics is disabled; current nodejs generation does not configure a request through this field. Credential/session-ID injection, expression context, response normalization and verified-identity binding remain unspecified. |

## Constraints

Property rules:

- `sessionRequest` must be present. (`REQUIRED_FIELD_MISSING`)
- `sessionPath`, `sessionIdPath` must be in the [`dotPath`](./value-formats.md#dotpath) format. (`INVALID_DOT_PATH`)
