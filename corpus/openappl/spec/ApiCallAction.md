# ApiCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ApiCallAction in Part 1](../ontology/ApiCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Calls an external or internal HTTP API during Business API execution. This is ideal for integrating with third-party services or internal utility endpoints. The fetched result is stored in context and optionally written to the response. Input and output transformation are supported.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiCallRequest` | [`HTTPRequest`](./HTTPRequest.md) | yes |  |  |  | Configuration object defining the HTTP call. Includes method, URL, headers, query parameters, and body. |
| `httpRequestPath` | [`WireKeyMapItem`](./WireKeyMapItem.md)[] | no |  |  |  | Values for the `{name}` placeholders in the PATH of `apiCallRequest.httpRequestUrl`, e.g. `https://api.example.com/v1/projects/{projectId}/stats` with `[{ "name": "projectId", "value": { "js": "this.project.id" } }]`. Each value is MScript, evaluated at call time, converted to a string and URL-encoded as ONE path segment (`encodeURIComponent`: a `/`, `?` or `#` in the value cannot add a segment or a query). Names match the placeholder exactly, case included. Every path placeholder must have an entry and every entry must have a placeholder: an unbound placeholder (API_CALL_PATH_PLACEHOLDER_UNBOUND), an unused entry (API_CALL_PATH_PARAM_UNUSED) and a placeholder in the host or the query string (API_CALL_PATH_PLACEHOLDER_OUTSIDE_PATH) are design-time errors, and the generated call refuses to run with them; a value that evaluates to null, undefined, an empty string or an object, or to the dot segment `.` / `..` (which a URL parser would collapse, moving the call to another path), is refused at run time before the request is sent; an entry is refused as unused whether or not it has a value. The URL itself stays a static literal (not MScript). Only ApiCallAction has this family: the shared HTTPRequest of RemoteSessionConfig, RemoteServiceAuthenticationConfig and RedirectAction sends its URL verbatim. |
| `isArray` | `Boolean` | yes |  |  |  | If true, the result is expected to be an array and will be treated as such during response and context processing. |
| `apiFetchProperty` | `String` | no |  |  |  | Used when the response is a complex object but only one specific property is needed. The extracted property will be stored in context. |
| `signBody` | `Boolean` | no | `false` |  |  | When true, the outbound request body is signed with the project's Ed25519 private key. The receiver verifies that the call originated from this project by fetching the project JWKS. Three headers are added: `Mindbricks-Signature` (base64url EdDSA signature over the raw body bytes), `Mindbricks-Kid` (key id), and `Mindbricks-Jwks-Url` (where to resolve the public key). Use this for outbound webhooks to receivers that need to verify the call's origin — the inverse of how Stripe-style callbacks are verified coming IN. |

## Constraints

Property rules:

- `apiCallRequest`, `isArray` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `httpRequestPath` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Example

Use to call an external or internal HTTP endpoint and capture the result into context — third-party lookups, webhooks, utility services. Set signBody=true for outbound calls whose receiver must verify origin via the project JWKS.

```json
{
  "name": "geocodeAddress",
  "description": "Resolve a shipping address to lat/lng via the maps provider.",
  "apiCallRequest": {
    "httpRequestUrl": "https://api.maps.example.com/v1/geocode",
    "httpRequestMethod": "GET",
    "tokenLocation": "header",
    "tokenName": "Authorization",
    "tokenValue": "Bearer ${process.env.MAPS_API_KEY}",
    "httpRequestParameters": {
      "httpRequestQuery": [
        {
          "name": "address",
          "value": { "js": "this.shippingAddress.formatted" }
        }
      ]
    },
    "cacheResponse": true
  },
  "isArray": false,
  "apiFetchProperty": "location",
  "signBody": false,
  "contextPropertyName": "geocode"
}
```
