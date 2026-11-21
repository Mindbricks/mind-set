---
title: RedirectAction
---

# RedirectAction

`RedirectAction` returns an HTTP 3xx redirect as the API's response. Use it for OAuth callbacks, post-authentication landings, email-verification "you're in" pages, and any workflow that needs to send the browser somewhere instead of returning a JSON payload.

## When to use it

- OAuth / SSO callback that completes the login then bounces the user to the app.
- Email-verification handler that confirms the token then lands the user on a success page.
- Short-link expansion APIs.

A `RedirectAction` is only meaningful when it is the **last** thing the API does, the response is the redirect, not data. Don't pair it with `writeToResponse: true` on other actions; their results are discarded by the controller.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `redirectUrl` | `HTTPRequest` | ✓ | Templated URL the client is redirected to. Supports path parameters and query strings filled in via MScript. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The runtime evaluates the templated `redirectUrl`, keeps it as the pending redirect, and returns. After the workflow finishes, the HTTP layer checks for a pending redirect and emits a `302` response with the resolved URL in the `Location` header. The action's own return value is the URL string (so `writeToResponse: true` would put the URL in the body, usually you don't want that on a redirect response).

## Example

A post-login redirect that preserves the original `returnTo`:

```json
{
  "name": "completeLogin",
  "redirectUrl": {
    "httpRequestUrl": "`${process.env.APP_URL}${this.session.returnTo || '/'}`"
  }
}
```

## Errors

- A null / empty resolved URL leaves the response without a redirect target, typically a project-validation-time issue. Use a `RenderDataAction` or fallback expression to guarantee a value.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [Authentication](../system-services/authentication/overview.md): typical home of OAuth and verification redirects.
