---
title: Access tokens
---

# Access tokens

After any successful login (native, social, or SSO) the `auth` service issues a **JWT**
(JSON Web Token). This token is the main credential for authenticating API requests
throughout the user's session.

> **Two token surfaces: don't conflate them.** The **user session JWT** described on this
> page is issued by the auth service and signed **EdDSA (Ed25519)** with the auth
> service's own service-identity key; downstream services fetch the matching public key
> from the auth service's `GET /publickey` to verify it. The **service-identity / M2M**
> token is a different surface: every service signs it **EdDSA** with its own key, pins
> it to one target service, and the receiver resolves the key from the hosting
> platform's key (JWKS) endpoint. See [Machine-to-machine](./m2m.md) for that path.

## Token expiration

JWTs have a limited lifetime. In the blueprint this is set via
[`JWTAuthConfig`](../../../spec/JWTAuthConfig.md)`.tokenPeriodInDays`:

```json
{
  "authentication": {
    "authenticationEssentials": {
      "JWTAuthentication": {
        "useJWTForAuthentication": true,
        "configuration": { "tokenPeriodInDays": 30 }
      }
    }
  }
}
```

- After the configured period the token becomes invalid.
- Services return HTTP 401 `Unauthorized` when an expired token is used.
- The client must perform a new login to obtain a fresh token.

## Key management and rotation

Each user token is signed EdDSA by the auth service with its own Ed25519 service-identity
key; the token's `kid` header is the key's id. The auth service publishes the public half
at `GET /publickey` (`{ status, keyId, keyData }`, `keyData` an SPKI PEM; a
`?keyId=<kid>` that is not the current key answers `404`). Every other service reads that
route from the auth service's address and caches the key per `kid` for 10 minutes, so
services verify tokens without ever holding the private key. The service reading the
public key can be pointed at another URL by an environment override
(`JWT_PUBLIC_KEY_URL`).

```json
{
  "authentication": {
    "authenticationEssentials": {
      "JWTAuthentication": {
        "useJWTForAuthentication": true,
        "configuration": {
          "tokenPeriodInDays": 30
        }
      }
    }
  }
}
```

| Field | Default | Purpose |
|---|---|---|
| `tokenPeriodInDays` | `30` | Lifetime of an issued access token. |

Changing `tokenPeriodInDays` does not shorten sessions already issued: they keep the
period they were minted with. The per-user "every session minted before now is invalid"
epoch (written when a user is blocked) is therefore kept for the LONGEST period any
deployment of the project has registered, not only the current one: each service records
its period (a high-water mark that is only ever raised), and the epoch is written with
the larger of 30 days, the current period and that mark. Re-saving a live session (for
example when a password change clears the `passwordChangeRequired` flag) keeps its
remaining lifetime; it does not start a fresh period.

There is **no rotation schedule to configure**: `JWTAuthConfig` has no key-rotation
setting, and a `keyRefreshPeriodInDays` key found in a blueprint is removed when the
blueprint is validated, with a `RETIRED_SETTING` warning. A signing key is replaced by
re-provisioning the auth service's identity. `/publickey` serves only the current `kid`,
so a token signed with the previous key stops verifying: a verifier that asks for the old
`kid` gets the `404`, drops any cached copy and rejects the token (a copy cached less
than 10 minutes earlier still answers until it is refetched). The client gets a new token
by signing in again, or through a refresh-token `/relogin` when refresh tokens are
enabled. A refresh family that started before the user's session-invalidation epoch (a
password rotation, a block, a log-out-everywhere, an admin role change) is refused on
redeem and burnt, whatever its generation; the family of the session kept by a
self-service password change is moved past the epoch with that session.

Token expiration and key rotation are independent: expiring a token forces a re-login;
rotating a key only affects tokens minted under the previous key.

## Reading the token from a request

When a client calls an API it must present the token. The service resolves it from the
request in this fixed order (every conforming generated backend implements the same six
steps):

1. A pre-stamped internal slot (set by upstream middleware on gRPC / event paths, if any).
2. The `?access_token=` **query parameter**, checked before the `Authorization` header.
3. `Authorization: Bearer <token>` header (a literal `Bearer null` is treated as absent,
   not as a token).
4. A custom header named `<codename>-access-token` (a header whose name starts with
   `<codename>-access-token-` is read too).
5. A cookie of that same custom name.
6. A cookie, query parameter, or body field, in that source order, under any of the
   recognized generic token names.

The recognized generic token names are `access-token`, `accessToken`, `access_token`, and
`token`. `SESSION_TOKEN_NAME` overrides the **primary** name (it is searched first, then
the remaining defaults). For each name step 6 checks cookies, then the query string, then
the request body.

Despite step 2 running before the header check, **prefer the `Authorization` header** for
ordinary API calls on every backend: a token carried in the URL is more likely to be
logged or cached along the way. Reach for the query-string form only where the client
cannot set headers at all, for example an `EventSource` connection (see [SSE
streaming](../../business-apis/sse-streaming.md)); an `EventSource` client has no
competing header to lose to step 2 anyway.

## Writing the token: the session cookie

For browser clients the access token is not only returned in the login response: it is
also written as an **HttpOnly** cookie so subsequent requests authenticate via the cookie
(and so the cookie can be shared across subdomains for SSO). The cookie name is
`SESSION_TOKEN_NAME` when that variable is set, otherwise the codename-scoped
`<codename>-access-token` (the name the token also carries in its `tokenName` claim). It
carries no tenant suffix.

The cookie is set on:

- `POST /login`
- `POST /validateapikey`
- auto-login-after-register (only login-producing APIs issue it)

and cleared on `POST /logout` (same name, `Domain`, and `Path` it was set with; a cookie
under the bare `access-token` name is cleared as well).

Cookie attributes: `HttpOnly`; `Path=/`; `SameSite` from `SESSION_COOKIE_SAMESITE`
(default `lax`); `Secure` when `SameSite` is `none`, the request is over TLS, or
`COOKIE_SECURE=true`; `Max-Age` is the SMALLER of `SESSION_COOKIE_MAX_AGE_MS`, which every
generated service derives from `JWTAuthentication.configuration.sessionCookieMaxAgeDays`
when the project sets it, and otherwise from its own resolved token period
(`JWTAuthentication.configuration.tokenPeriodInDays`, default 30 days) rather than a flat
week, and the time remaining to the `exp` of the token being set. Setting
`sessionCookieMaxAgeDays` is how a project makes the browser cookie expire SOONER than the
token it carries: the token and its server-side session keep the full `tokenPeriodInDays`,
the browser simply stops sending the cookie earlier. Because the setting is a ceiling and
not a floor, a `sessionCookieMaxAgeDays` LARGER than `tokenPeriodInDays` extends nothing.
An explicit non-positive value is a design-time error
(`AUTH_SESSION_COOKIE_MAX_AGE_INVALID`), not a silent fallback. The ceiling is the
configured value and the token the floor, so an absolute or delegated session, whose token
is bounded to 24 hours, gets a 24-hour cookie even under a 30-day period, while an
operator who sets a shorter value still gets the shorter cookie. A token carrying no usable
`exp` leaves the configured value standing; with neither, 7 days.

The `Domain` attribute is resolved over the cookie allow-list (`COOKIE_DOMAINS` plus the
hostnames of `ALLOWED_ORIGINS`): an allow-listed base domain yields a `.<base-domain>`
cookie shared across subdomains, an allow-listed specific host yields a host-scoped
cookie, and allow-listed dev hosts (`localhost`, `127.0.0.1`, `::1`) yield a host-only
cookie (no `Domain`).

When `COOKIE_DOMAINS` is set and the request host falls outside the allow-list, **no
cookie is set at all** and the refusal is logged naming the host and the list. When
`COOKIE_DOMAINS` is unset the allow-list is not a gate: every host gets a host-only
cookie, which is the default for a project that never fills in
`cookieSettings.allowedDomains`. See [Login](./login.md) for the full description of
cookie issuance.

## See also

- [Login](./login.md): how a session and token are issued.
- [Machine-to-machine](./m2m.md): the EdDSA service-identity token.
- Spec: [`JWTAuth`](../../../spec/JWTAuth.md),
  [`JWTAuthConfig`](../../../spec/JWTAuthConfig.md),
  [`CookieSettings`](../../../spec/CookieSettings.md).
