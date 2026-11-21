---
title: ApiCallAction
---

# ApiCallAction

Makes a free-form HTTP request to any URL during workflow execution. Use it when the target is **not** a service of the same project and **not** a configured catalogue integration: those have dedicated action types.

Pick the right tool for outbound calls:

- [`ApiCallAction`](./api-call-action.md): free-form HTTP to any URL. Author owns auth, body, error handling.
- [`InterserviceCallAction`](./interservice-call-action.md): typed call into another service in the same project. Routing, auth-context propagation, and error shape are compiler-managed.
- [`IntegrationAction`](./integration-action.md): invoke a named method on a catalogue integration (`Integration` table row) declared in the project.

## When to use it

- Call an arbitrary third-party HTTP endpoint not modelled as an integration.
- Send an outbound webhook to a customer-configured URL, optionally signed with the project's private key.
- Fetch reference data from an internal utility endpoint that isn't a service of the project.
- For repeated integration with a known provider, prefer modelling it as a general integration so reusable config moves to the catalogue.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `apiCallRequest` | `HTTPRequest` | yes | URL, method, headers, query, body, and (optional) static auth token. See below. |
| `httpRequestPath` | `[WireKeyMapItem]` | no | Values for the `{name}` placeholders in the URL path, each `{ "name": <placeholder>, "value": <MScript> }`. See [Path parameters](#path-parameters). |
| `isArray` | `Boolean` | yes | Whether the response is expected to be an array: affects how the value is treated by downstream context / response writers. |
| `apiFetchProperty` | `String` | no | When set, the stored result is `response[apiFetchProperty]` instead of the whole response body. |
| `signBody` | `Boolean` | no | When true, sign the outbound JSON body with the project's Ed25519 key (see Behaviour). |

`HTTPRequest` fields used by this action:

| Property | Type | Req | Description |
|---|---|---|---|
| `httpRequestUrl` | `String` | yes | Full URL of the endpoint, as a literal; its path may carry `{name}` placeholders (see [The URL is static](#the-url-is-static) and [Path parameters](#path-parameters)). |
| `httpRequestMethod` | `HTTPRequestMethods` | yes | `GET` / `POST` / `PUT` / `PATCH` / `DELETE`. |
| `tokenLocation` | `RequestLocations` | no | `bearer` (the default), `header`, `cookie`, or `query`: where to place a static auth token. The other `RequestLocations` members (`body`, `urlpath`, `session`, `request`) describe inbound requests; with a `tokenValue` they are an error (see [Errors](#errors)). |
| `tokenName` | `String` | no | Header name / cookie name / query key for the static token. Required with `tokenLocation` `header`, `cookie` or `query` when `tokenValue` is set. |
| `tokenValue` | `String` | no | Static token value (string literal, **not** MScript). For dynamic tokens, set them via `httpRequestParameters.httpRequestHeaders`. |
| `httpRequestParameters` | `HTTPRequestParameters` | no | `httpRequestBody`, `httpRequestQuery`, `httpRequestHeaders`, `httpRequestCookies`: each a list of `{ "name": <wire name>, "value": <MScript> }` items; the name is sent verbatim, the value may reference `this`. |
| `cacheResponse` | `Boolean` | no | Hint to the runtime to cache the response. |

### The URL is static

`httpRequestUrl` is a static URL: it is used verbatim as the request URL,
it is not MScript, and a context read such as `this.partner.webhookUrl` is
NOT evaluated (it would be sent as the literal string). The one part that
varies per call is a `{name}` placeholder in the URL **path**, filled from
`httpRequestPath` (see [Path parameters](#path-parameters)). The scheme and
host stay literal, so a per-partner or per-tenant HOST is still not
expressible with `ApiCallAction`: make that call from a `FunctionCallAction`
/ library function.

### Path parameters

An endpoint that addresses its resource in the path
(`/v1/projects/{projectId}/stats`) writes the variable segment as a
`{name}` placeholder and binds it in the action's `httpRequestPath` list:

- Each entry is `{ "name": "<placeholder>", "value": <MScript> }`. The value
  is evaluated at call time, converted to a string and URL-encoded as ONE
  path segment, so a `/`, `?` or `#` inside the value
  can never add a segment or a query. Names match the placeholder exactly,
  case included, and a placeholder may appear more than once. A name is a
  letter or `_` followed by letters, digits, `_` or `.`; any such name works,
  including ones like `constructor` or `__proto__`.
- Every path placeholder needs an entry, and every entry needs a
  placeholder. Validation reports an unbound placeholder
  (`API_CALL_PATH_PLACEHOLDER_UNBOUND`), an entry the path does not use
  (`API_CALL_PATH_PARAM_UNUSED`) and a placeholder in the host, the query
  string or the fragment (`API_CALL_PATH_PLACEHOLDER_OUTSIDE_PATH`; query
  values belong in `httpRequestQuery`) as errors, and the compiled call
  refuses to run with any of them, before a request is sent.
- A value that evaluates to `null`, `undefined`, an empty string or an
  object is refused at run time, before the request is sent: the endpoint
  is never called with a hole in its path. So is a value that is exactly
  `.` or `..`: URL-encoding keeps dots, and a URL parser collapses
  a dot segment (`/v1/users/{id}/orders` with `..` would call
  `/v1/orders`). Any other value stays inside its segment (`../x` is
  sent as `..%2Fx`, `%2e%2e` as `%252e%252e`).
- An entry whose name is not a path placeholder is refused whether or not
  its value is set: the check is on the authored name, not on the value.
- `${...}` is not a placeholder (the URL is not a template string).
- `httpRequestPath` belongs to `ApiCallAction` only. The `HTTPRequest` that
  `RemoteSessionConfig`, `RemoteServiceAuthenticationConfig` and
  `RedirectAction` share sends its URL verbatim.

Validation enforces the literal form: a URL that is not an absolute
`http://` / `https://` URL (a context read such as `this.partner.webhookUrl`,
a relative `/v1/orders`, a host with no scheme) is an error,
`API_CALL_URL_NOT_ABSOLUTE`, because the compiled call hands it to the HTTP
client as-is and every request would fail. An absolute URL that still
carries a `${...}` template placeholder is a warning,
`API_CALL_URL_PLACEHOLDER`: nothing substitutes it, so the request goes to
the placeholder text itself (a `{name}` placeholder is a path parameter, see
[Path parameters](#path-parameters)).

## Behaviour

The compiled action:

1. Takes the literal URL, fills each `{name}` path placeholder from `httpRequestPath` (URL-encoded, refused when missing or empty), then appends query parameters from `httpRequestParameters.httpRequestQuery` (and the static token query if `tokenLocation: "query"`).
2. Builds headers: `Content-Type: application/json`, plus any from `httpRequestParameters.httpRequestHeaders` (and `httpRequestCookies` as a `Cookie` header), plus the static token header / bearer / cookie if configured.
3. Builds the body object from `httpRequestParameters.httpRequestBody` (one key per item, each value evaluated as MScript) and serialises it as JSON.
4. When `signBody: true`, signs the raw body with the project's Ed25519 key and attaches three signature headers:
   - `Mindbricks-Signature`: the signature (base64url EdDSA over the raw body bytes)
   - `Mindbricks-Kid`: the key id
   - `Mindbricks-Jwks-Url`: the URL where the receiver fetches the public key (the project's JWKS)

   This is the **outbound** counterpart to receiving signed webhooks; receivers verify the call by fetching the project JWKS.
5. Sends the request with the configured method, headers and body. The response is parsed as JSON (`null` on parse failure).
6. When the response status is not 2xx, the action FAILS (see [Errors](#errors)).
7. Otherwise, when `apiFetchProperty` is set, returns `response[apiFetchProperty]`; else returns the parsed response.

**Authentication is the author's responsibility.** A compiler does not auto-inject session credentials. Use `tokenValue` for a static token, or build `Authorization` / cookie headers via `httpRequestParameters.httpRequestHeaders` / `httpRequestCookies` with MScript values that read `this.session` or a context value.

## Example

```json
{
  "name": "fetchExchangeRate",
  "writeToResponse": false,
  "contextPropertyName": "usdToEur",
  "apiFetchProperty": "rates",
  "isArray": false,
  "apiCallRequest": {
    "httpRequestUrl": "https://api.example.com/v1/latest",
    "httpRequestMethod": "GET",
    "tokenLocation": "header",
    "tokenName": "X-Api-Key",
    "tokenValue": "rate-svc-public-key",
    "httpRequestParameters": {
      "httpRequestQuery": [
        { "name": "base", "value": { "js": "'USD'" } },
        { "name": "symbols", "value": { "js": "'EUR'" } }
      ]
    }
  }
}
```

A path-addressed endpoint (the project id is the path segment):

```json
{
  "name": "fetchProjectStats",
  "writeToResponse": false,
  "contextPropertyName": "projectStats",
  "isArray": false,
  "apiCallRequest": {
    "httpRequestUrl": "https://metrics.example.com/api/v1/projects/{projectId}/stats",
    "httpRequestMethod": "GET",
    "httpRequestParameters": {
      "httpRequestQuery": [
        { "name": "window", "value": { "js": "'30d'" } }
      ]
    }
  },
  "httpRequestPath": [
    { "name": "projectId", "value": { "js": "this.project.id" } }
  ]
}
```

A signed outbound webhook (the partner's webhook URL is a literal: a
per-partner host read from context is not expressible, see
[The URL is static](#the-url-is-static)):

```json
{
  "name": "notifyPartner",
  "writeToResponse": false,
  "signBody": true,
  "isArray": false,
  "apiCallRequest": {
    "httpRequestUrl": "https://partner.example.com/webhooks/orders",
    "httpRequestMethod": "POST",
    "httpRequestParameters": {
      "httpRequestBody": [
        { "name": "event", "value": { "js": "'order.placed'" } },
        { "name": "orderId", "value": { "js": "this.order.id" } },
        { "name": "amount", "value": { "js": "this.order.total" } }
      ]
    }
  }
}
```

## Errors

- A non-2xx HTTP response fails the action; the callee's error body is never handed to the workflow as a result. The thrown error carries `errorCode: "API_CALL_UPSTREAM_ERROR"`, `upstreamStatus` (the callee's HTTP status) and `upstreamBody` (its parsed JSON or plain text, credential values scrubbed), and its message names the action, the method, the URL without its query string and the status. When a static `tokenValue` is configured, every exact occurrence in a decoded string leaf or text body is replaced by `[REDACTED]`, independently of the key. Keys and non-string scalars are preserved. What happens next is `onActionError`:
  - `throwError` (the default): the api fails like on any other action error (a post-write stage reports it as described in [Error handling](../workflow/error-handling.md)). The callee's status is NOT passed on as the api's own (the error carries it as `upstreamStatus`, not `status`), so the caller gets the api's own `500 INTERNAL_ERROR` and the full error is logged under the request id. A callee 401 or 404 therefore never reads as the caller's own 401 or 404.
  - `completeApi`: the error is stored on `this.<actionName>Error` and the workflow continues; the result property is not set. Branch on it in a later action, e.g. `this.searchDocsError?.upstreamStatus === 404`.

  A transport failure (DNS, connection refused, timeout) throws the HTTP client's error. A 2xx response with a body that is not JSON still returns `null`.
- A `tokenValue` the call cannot send is refused, never dropped. With `tokenLocation` `body`, `urlpath`, `session`, `request` (inbound locations) or a value outside the enum, validation reports `API_CALL_TOKEN_LOCATION_UNSUPPORTED`; with `header`, `cookie` or `query` and no `tokenName`, `API_CALL_TOKEN_NAME_MISSING`. Both are errors, and the compiled call throws before any request is sent (the token value is never part of the message).
- `signBody: true` throws at runtime if the project's signing keys (private key, key id, project id and the key-publishing URL) are not configured on the service. That is by design: silent unsigned calls would defeat the purpose.
- A malformed `apiCallRequest` (missing URL or method) fails validation.
- A `httpRequestPath` value that is `null`, `undefined`, an empty string, an object, or the dot segment `.` / `..` throws before the request is sent (`httpRequestPath value for {<name>} is ...`); the action fails like any other thrown error (`onActionError` applies).

## See also

- [`InterserviceCallAction`](./interservice-call-action.md): call another service
- [`IntegrationAction`](./integration-action.md): call a catalogue integration
- [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md): sign without making an HTTP call
- [`VerifyWebhookAction`](./verify-webhook-action.md): verify inbound signatures
- [`HTTPRequest`](../../spec/HTTPRequest.md), [`HTTPRequestParameters`](../../spec/HTTPRequestParameters.md)
