# RemoteServiceAuthenticationConfig

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [RemoteServiceAuthenticationConfig in Part 1](../ontology/RemoteServiceAuthenticationConfig.md)

Not available: reachable only through the disabled RemoteServiceAuthentication slot of AuthBasics, so nothing is generated from it. Configuration details for remote service authentication, including remote request and session handling.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `remoteServiceRequest` | [`HTTPRequest`](./HTTPRequest.md) | yes |  |  |  | Declared request for a remote authentication service. The AuthBasics remote-authentication slot is disabled; current nodejs generation does not configure a verifier from this field. Credential placement, affirmative/denial response shape and verified-claim binding remain unspecified. |
| `sessionIdPathInToken` | `String` | no | `"sessionId"` |  | format [dotPath](./value-formats.md#dotpath) | Declared path to a session identifier in authentication-token data, schema default sessionId. The remote-authentication slot is disabled and current nodejs generation does not consume this path. Which verified claim source it addresses and how that identifier binds to identity remain undecided; this field does not authorize use of unverified decoded claims. |
| `sessionReadLocation` | `SessionReadLocation` | no | `"readFromRemoteService"` | `readFromSessionStore`, `tokenIsSession`, `readFromRemoteService` |  | Defines where the session data should be fetched from after extracting the session ID. Options include session store, token itself, or remote service. |

## Constraints

Property rules:

- `remoteServiceRequest` must be present. (`REQUIRED_FIELD_MISSING`)
- `sessionReadLocation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `sessionIdPathInToken` must be in the [`dotPath`](./value-formats.md#dotpath) format. (`INVALID_DOT_PATH`)
