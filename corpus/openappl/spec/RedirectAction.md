# RedirectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [RedirectAction in Part 1](../ontology/RedirectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Redirects the client to a new URL after the API execution. This is often used in web-based flows like OAuth callbacks, login success handlers, or conditional navigation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `redirectUrl` | [`HTTPRequest`](./HTTPRequest.md) | yes |  |  |  | The URL to redirect the client to. Supports templated HTTPRequest objects, which may include path parameters or query strings dynamically generated using MScript. |

## Constraints

Property rules:

- `redirectUrl` must be present. (`REQUIRED_FIELD_MISSING`)

## Example

Use to redirect the browser after execution — OAuth callbacks, post-login landing, or conditional navigation — with a URL that may be templated from context.

```json
{
  "name": "redirectAfterOAuth",
  "description": "Send the user back to the app with their freshly minted session token.",
  "redirectUrl": {
    "httpRequestUrl": "https://app.example.com/auth/callback",
    "httpRequestMethod": "GET",
    "httpRequestParameters": {
      "httpRequestQuery": [
        {
          "name": "token",
          "value": { "js": "this.sessionToken" }
        },
        {
          "name": "next",
          "value": { "js": "this.request.query.next || '/dashboard'" }
        }
      ]
    }
  }
}
```
