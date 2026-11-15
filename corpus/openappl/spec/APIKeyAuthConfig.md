# APIKeyAuthConfig

**Level:** `subsection` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [APIKeyAuthConfig in Part 1](../ontology/APIKeyAuthConfig.md)

Fine-tune API key authentication behavior. Controls which key types are generated, where keys are located in requests, and the custom header, query parameter, cookie or body field name. With its fields left unset (an empty object), the generated service defaults to secret-only keys in the Authorization Bearer header with the sk_mbx_ prefix — no additional configuration needed for standard usage. Note: public API key fields (publicApiKeyLocation, publicApiKeyName) are reserved for future support and have no effect currently.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiKeyType` | `APIKeyType` | no | `"secret"` | `secret`, `public`, `both` |  | Declared API-key mode, default secret. Current nodejs generation supports the secret-key creation/session flow with sk_mbx_-prefixed keys. public and both are reserved values and do not enable public-key authentication. Whether to refuse those values or retain them inert, and the public-key trust contract, remain undecided. |
| `secretApiKeyLocation` | `RequestLocations` | no | `"bearer"` | `bearer`, `cookie`, `header`, `query`, `body`, `urlpath`, `session`, `request` |  | Where secret API keys are read from in HTTP requests. Defaults to 'bearer' (Authorization: Bearer sk_mbx_...). When set to 'header', 'query', 'cookie' or 'body', the secretApiKeyName field names the header, query parameter, cookie or request-body field. The other location values ('urlpath', 'session', 'request') are not supported: no key is read from them. |
| `publicApiKeyLocation` | `RequestLocations` | no | `"query"` | `bearer`, `cookie`, `header`, `query`, `body`, `urlpath`, `session`, `request` |  | Declared request location for public API keys, schema default query. Current nodejs generation does not consume this field or provide public-key authentication. Public-key authority, distinction from secret keys, supported locations and collision/precedence rules remain undecided. |
| `secretApiKeyName` | `String` | no |  |  | format [noSpace](./value-formats.md#nospace) | Custom header, query parameter, cookie or request-body field name for secret API keys. Required when secretApiKeyLocation is not 'bearer': without it no key is read. When location is 'bearer', the sk_mbx_ prefix is used for automatic detection and this field is ignored. |
| `publicApiKeyName` | `String` | no |  |  | format [noSpace](./value-formats.md#nospace) | Declared request name for a public API key. Current nodejs generation does not consume this field or provide public-key authentication. Public-key trust semantics and supported name/validation/collision rules remain undecided. |

## Constraints

Property rules:

- `apiKeyType`, `secretApiKeyLocation`, `publicApiKeyLocation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `secretApiKeyName`, `publicApiKeyName` must be in the [`noSpace`](./value-formats.md#nospace) format. (`INVALID_NO_SPACE`)
