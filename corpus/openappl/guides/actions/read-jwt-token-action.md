---
title: ReadJwtTokenAction
---

# ReadJwtTokenAction

`ReadJwtTokenAction` verifies an HMAC-signed JWT, decodes its payload, and binds the validated payload to the workflow context. Use it to admit a request based on a signed token instead of (or in addition to) the standard auth session, share links, email-verification callbacks, single-use action tokens, custom subscription bearers.

## When to use it

- Verify a signed share / view-only / one-use access token presented in a query parameter or header.
- Validate a webhook callback that carries an HMAC token your service issued earlier.
- Decode a token whose payload drives downstream authorization (`storedCheck`-style, load now, validate further later).

The action is the read-side counterpart to [`CreateJWTTokenAction`](./create-jwt-token-action.md). For Ed25519 envelope signatures intended for cross-project trust, see [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md) instead.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `readTokenFrom` | `MScript` | ✓ | Expression evaluating to the encoded token string. Typical sources: a declared request parameter (`this.token`), `this.request.query.payToken`, `this.session.userSubscription`. |
| `jwtKey` | `MScript` | ✓ | Expression evaluating to the HMAC key used to verify the token signature. Can be a literal, a context reference, or `process.env.<KEY>`. |
| `isRequired` | `Boolean` | ✓ | When `true`, the action throws if the token is missing or invalid. When `false`, a missing / invalid token resolves to a `null` payload on context and execution continues. |
| `statusCheck` | `MScript` |   | Optional expression evaluated after the signature check. If it returns falsy, the token is treated as invalid (subject to `isRequired`). It runs against the API context (`this`), and the decoded payload is not on the context yet, it lands on `this.<contextPropertyName>` only when the action returns, so use it for request- or context-level conditions. Check the token's claims with a [`ValidationAction`](./validation-action.md) placed after this action, reading `this.<contextPropertyName>.<claim>`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties. The decoded payload is written under `contextPropertyName` (when set) and accessible as `this.<contextPropertyName>` to subsequent actions.

## Behaviour

The runtime resolves the encoded token from `readTokenFrom`, verifies the HMAC signature with `jwtKey` (a standard JWT verification, so an expired token, a past `exp` claim, fails verification too), and decodes the payload. If `statusCheck` is set, it is evaluated next.

- `isRequired: true`, any failure (missing token, bad signature, expired, `statusCheck` returns falsy) throws and aborts the API.
- `isRequired: false`, the same failures resolve to a `null` payload; downstream actions can branch on `this.<contextPropertyName> == null`.

Once the payload is on context, any subsequent action can reference fields on it (`this.<contextPropertyName>.userId`, `…role`, etc.) just like any other context value.

## Example

A share-link API admits requests with a valid token in the query string (it declares a `token` request parameter with `httpLocation: "query"`). The claims are checked by a `ValidationAction` after the token is read, and the shared article is loaded by the id the token carries:

```json
"actions": {
  "readJwtTokenActions": [
    {
      "name": "readShareToken",
      "readTokenFrom": { "js": "this.token" },
      "jwtKey": { "js": "process.env.SHARE_TOKEN_KEY" },
      "isRequired": true,
      "contextPropertyName": "shareClaims"
    }
  ],
  "validationActions": [
    {
      "name": "checkSharePurpose",
      "description": "The token must be a view-share token.",
      "validationScript": { "js": "this.shareClaims.purpose === 'view-share'" },
      "shouldBeTrue": true,
      "checkType": "liveCheck",
      "errorStatus": "403",
      "errorMessage": "This link does not grant view access."
    }
  ],
  "fetchObjectActions": [
    {
      "name": "loadSharedArticle",
      "targetObject": "article",
      "matchValue": { "js": "this.shareClaims.articleId" },
      "localKey": "id",
      "isRequired": true,
      "contextPropertyName": "sharedArticle",
      "writeToResponse": true
    }
  ]
},
"workflow": {
  "get": { "afterCheckParameters": ["readShareToken", "checkSharePurpose", "loadSharedArticle"] }
}
```

Expiry needs no check of its own: a token whose `exp` has passed fails the signature verification.

## Errors

When `isRequired: true`, every failure path throws a `400` error. The action does not distinguish auth-style 401 from validation-style 400, all four cases surface as a 400 with a descriptive message:

- Missing token → `400 "JWT token not found"`.
- Missing key → `400 "JWT key not found"`.
- Signature mismatch / decode failure → `400 "JWT signature validation failed"`.
- `statusCheck` returns falsy → `400 "JWT token is not valid"`.

When `isRequired: false`, the same failures resolve to a `null` payload and execution continues.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`CreateJWTTokenAction`](./create-jwt-token-action.md): the write side of HMAC JWTs.
- [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md): Ed25519-signed envelopes for cross-project trust.
- [Membership and share tokens](../composition/membership.md).
