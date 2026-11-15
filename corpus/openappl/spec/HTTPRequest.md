# HTTPRequest

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [HTTPRequest in Part 1](../ontology/HTTPRequest.md)

Defines a reusable HTTP request configuration to interact with a remote service and retrieve a JSON response. This object is used across the platform for scenarios such as remote authentication, remote data access, and integration with external APIs (CRUD operations, searches, etc.).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `httpRequestUrl` | `String` | yes |  |  | format [url](./value-formats.md#url) | The full URL of the remote service endpoint, as a static literal: it is not MScript and is never evaluated. On an ApiCallAction, `{name}` placeholders in its PATH are filled from the action's `httpRequestPath` entries; every other user of HTTPRequest sends the URL verbatim. |
| `httpRequestMethod` | `HTTPRequestMethods` | yes |  | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |  | The HTTP method to use when making the request. Supported methods are GET, POST, PUT, PATCH, DELETE. |
| `tokenLocation` | `RequestLocations` | no | `"bearer"` | `bearer`, `cookie`, `header`, `query`, `body`, `urlpath`, `session`, `request` |  | The section of the request where the authentication token should be placed (e.g., header, cookie). Defaults to 'bearer'. An ApiCallAction sends its `tokenValue` only to `bearer` (the default when unset), `header`, `cookie` or `query`; any other location (the inbound members `body`, `urlpath`, `session`, `request`, or a value outside the enum), or `header` / `cookie` / `query` with no `tokenName`, is a design-time error (API_CALL_TOKEN_LOCATION_UNSUPPORTED / API_CALL_TOKEN_NAME_MISSING) and the generated call refuses to run instead of sending the request without its credential. |
| `tokenName` | `String` | no |  |  | format [noSpace](./value-formats.md#nospace) | The name or key under which the token will be sent in the specified location. |
| `tokenValue` | `String` | no |  |  |  | The token value to be sent, if static. This field is optional and typically used for hardcoded tokens or fallback defaults. |
| `httpRequestParameters` | [`HTTPRequestParameters`](./HTTPRequestParameters.md) | no |  |  |  | The parameters to send with the request, including body, query string, headers, and cookies. |
| `cacheResponse` | `Boolean` | no | `false` |  |  | Reserved request-cache intent. Node.js currently performs every request without caching; no cache lifetime, key, isolation or auth/session admission policy is defined. Do not rely on response reuse. A runtime caching contract requires a maintainer ruling. |

## Constraints

Property rules:

- `httpRequestUrl`, `httpRequestMethod` must be present. (`REQUIRED_FIELD_MISSING`)
- `httpRequestMethod`, `tokenLocation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `httpRequestUrl` must be in the [`url`](./value-formats.md#url) format. (`INVALID_URL`)
- `tokenName` must be in the [`noSpace`](./value-formats.md#nospace) format. (`INVALID_NO_SPACE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INVALID_HTTP_REQUEST_URL` | error | HTTPRequest httpRequestUrl must be a non-empty string when provided. |
