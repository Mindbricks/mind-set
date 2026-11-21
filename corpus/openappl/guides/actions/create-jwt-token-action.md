---
title: CreateJWTTokenAction
---

# CreateJWTTokenAction

Generates a signed JWT from a payload and a signing key resolved from the workflow context (typically an environment variable). Use it to mint short-lived tokens for share links, email-verification flows, password-reset URLs, or ad-hoc API access.

This is **not** the cross-project verifiable signature path: for that, use [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md), which signs with the project's Ed25519 key and emits a JWKS-resolvable envelope. To verify an incoming JWT, use [`ReadJwtTokenAction`](./read-jwt-token-action.md).

## When to use it

- Issue a short-lived share token (e.g. "view this document for 24 hours").
- Mint an email-verification or password-reset link token.
- Hand a third party a signed claim about the caller (e.g. embed-app SSO).
- Create a temporary scoped API token for use in the same project.

`payload` must resolve to a non-null string or object (including a
Buffer). Other values are refused with `ApiError(400, 'JWT payload must be a string or object')`
before signing. Objects retain their identity and are not stringified by the action.
An omitted payload keeps the default empty object.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `JWTKey` | `MScript` | yes | Expression that yields the signing key. Most often references an environment variable such as `process.env.SHARE_TOKEN_SECRET`. |
| `payload` | `MScript` | yes | Expression that yields the payload object. Include claims like `sub`, `scope`, `exp`, or anything the consumer needs. |

## Behaviour

The action signs the payload with the key. The default algorithm is `HS256` (symmetric). The returned token string is stored on `this.<contextPropertyName>` (when set) and written to the response when `writeToResponse` is true.

The key is **not** the project's Ed25519 signing key: it is whatever string the `JWTKey` MScript evaluates to, typically a service-scoped HS256 secret. Manage the secret as a regular environment variable; the action does not own any rotation or JWKS publishing.

Standard JWT claims like `exp`, `iat`, `nbf`, and `iss` are **not** added automatically. Include them in `payload` if the consumer expects them.

## Example

Mint a 24-hour share token for a fetched document:

```json
{
  "name": "issueShareToken",
  "writeToResponse": true,
  "contextPropertyName": "shareToken",
  "JWTKey": { "js": "process.env.SHARE_TOKEN_SECRET" },
  "payload": { "js": "({ docId: this.document.id, sub: this.session.userId, scope: 'doc.read', exp: Math.floor(Date.now() / 1000) + 86400 })" }
}
```

The client receives `{ shareToken: "eyJhbGciOi..." }` and can use it in a follow-up request, where a [`ReadJwtTokenAction`](./read-jwt-token-action.md) configured against the same secret verifies and decodes it.

## Errors

- A null or malformed `JWTKey` throws from the signing step. Use `onActionError: "completeApi"` to inspect via `this.<actionName>Error`.
- The action does not validate the payload shape: it is whatever the MScript evaluates to.

## See also

- [`ReadJwtTokenAction`](./read-jwt-token-action.md): verify and decode
- [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md): Ed25519, JWKS-verifiable
- [`VerifyWebhookAction`](./verify-webhook-action.md): provider-signed webhook verification
- [Membership and share tokens](../composition/membership.md)
