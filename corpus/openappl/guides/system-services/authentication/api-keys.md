---
title: API keys
---

# API keys

OpenAPPL supports **API-key authentication** for programmatic access on behalf of a user:
server-to-server integrations, CI/CD pipelines, automated scripts, and any scenario where
a user's interactive credentials should not be used directly.

## Enabling API-key authentication

Enable it in the [`AuthBasics`](../../../spec/AuthBasics.md) chapter
([`APIKeyAuth`](../../../spec/APIKeyAuth.md) /
[`APIKeyAuthConfig`](../../../spec/APIKeyAuthConfig.md)):

```json
{
  "authentication": {
    "authenticationEssentials": {
      "apiKeyAuthentication": {
        "useAPIKeyForAuthentication": true,
        "configuration": {
          "apiKeyType": "secret",
          "secretApiKeyLocation": "bearer",
          "secretApiKeyName": null
        }
      }
    }
  }
}
```

- `apiKeyType`: `'secret'` (default) generates `sk_mbx_`-prefixed keys that authenticate
  on behalf of a user. `'public'` and `'both'` are **reserved for a future release; only
  `secret` is implemented today.**
- `secretApiKeyLocation`: where the key is read from. Defaults to `'bearer'`
  (`Authorization: Bearer sk_mbx_...`). With `'header'`, `'query'`, `'cookie'` or
  `'body'` the key is read from the header, query parameter, cookie or request-body field
  that `secretApiKeyName` names. The location enum has further values (`urlpath`,
  `session`, `request`); no key is read from them.
- `secretApiKeyName`: the header, query-parameter, cookie or body-field name when the
  location is not `bearer`. Without it no key is read from those locations. Ignored for
  `bearer` (the `sk_mbx_` prefix drives automatic detection).

```json
{
  "authentication": {
    "authenticationEssentials": {
      "apiKeyAuthentication": {
        "useAPIKeyForAuthentication": true,
        "configuration": {
          "apiKeyType": "secret",
          "secretApiKeyLocation": "header",
          "secretApiKeyName": "X-Api-Key"
        }
      }
    }
  }
}
```

## How it works

1. **Key creation.** An authenticated user calls `createSecretApiKey`
   (`POST /auth-api/v1/secretapikey`) to generate a key. The body takes only an optional
   `name` and an optional `expiresAt`:

   ```json
   { "name": "ci-pipeline", "expiresAt": "2027-01-01T00:00:00Z" }
   ```

   The plaintext key (`sk_mbx_` plus 64 random hex characters) is returned **only once**,
   in the `secretKey` field of the response; the system stores only its SHA-256 hash and
   the first 12 characters as `keyPrefix`.
2. **Making requests.** The client sends each request with the key in the configured
   location. Every request must include the key: API-key sessions are tokenless (no JWT,
   no cookie).
3. **Session resolution.** When a service receives an API-key request it:
   - computes the SHA-256 hash of the key,
   - checks its session cache for an entry for that hash,
   - uses the cached session if found, unless it was minted before the user's
     session-invalidation epoch (a block, a user delete / archive, or any
     log-out-everywhere retire stamps it), in which case the entry is treated as a miss,
   - otherwise calls the auth service's `POST /validateapikey` route, which looks up the
     hash, verifies it, loads the user, and creates a session,
   - caches the session with a **1-day TTL**. After 1 day the cache expires and the next
     request triggers a fresh validation. A session resolved through the remote
     `/validateapikey` call is cached for **5 minutes** instead (see the revoke note
     below).
4. **Key management.** Users list, create, and revoke (delete) their keys via the auth
   service profile APIs; an admin can revoke another user's keys (see [Revoke a leaked
   key](#revoke-a-leaked-key)).

## Bearer-token discrimination

When `secretApiKeyLocation` is `bearer`, both JWT tokens and API keys share the
`Authorization: Bearer` header. The service uses the `sk_mbx_` prefix to tell them apart:

- If the bearer value starts with `sk_mbx_`, it is treated as an API key.
- Otherwise it is treated as a user JWT and follows the standard JWT flow (see [Access
  tokens](./access-tokens.md)).

This lets both methods coexist seamlessly on the same endpoints.

## Generated assets

When API-key authentication is enabled, the compiler emits:

- **`apiKey` data object**: stores key records (hash, prefix, userId, expiry, etc.).
- **`createSecretApiKey`** (`POST /secretapikey`): creates a new secret key and answers
  the plaintext once as `secretKey`.
- **`deleteApiKey`**: revokes (deletes) one key and ends its sessions; the key's owner or
  an admin.
- **`revokeUserApiKeys`** (`POST /revokeapikeys`): revokes every key of the caller.
- **`revokeApiKeysOfUser`** (`POST /users/:userId/revokeapikeys`): an admin revokes every
  key of a user.
- **`listApiKeys`**: lists the user's keys (prefix only).
- **`POST /validateapikey`**: internal inter-service validation route (not for client
  use).

For the full contract of the generated auth service see [the compiler
specification](../../../compiler/index.md).

### Lifecycle guarantees

- **Creation persists the server-generated material.** `createSecretApiKey` stores the
  `keyHash` / `keyPrefix` / `keyType` it generates (these are **not** client-postable;
  only `name` and an optional `expiresAt` are accepted from the caller), and the raw
  `keyHash` is stripped from the create response (so the secret never leaks).
- **Revocation ends the key's sessions immediately.** Revoking a key (`deleteApiKey`, or
  the revoke-all doors) writes a revocation tombstone, evicts the key's cached session
  and retires every access session `/validateapikey` minted from the key, all before the
  key row is revoked. A request that was resolving the key at the same moment re-checks
  the tombstone after it cached its session and gives it back, so a revoked key is
  rejected immediately rather than surviving for the cache TTL. When that re-check cannot
  read the tombstone (a cache error), the request is still answered, but the session it
  cached is removed again, so the next request re-validates the key instead of reusing
  that cache entry.
- **Retiring a user ends their cached key sessions.** Deleting or archiving a user,
  `deleteAllUserSessions` and the admin `POST /users/:userId/deletesessions` stamp the
  user's session-invalidation epoch, so a cached key session minted before it never
  answers again. The next request re-validates the key: a deleted / archived user is
  refused; a still-valid key of an active user gets a fresh session.
- **Log-out-everywhere does not revoke api keys.** `/deleteallsessions` and the admin
  `POST /users/:userId/deletesessions` end sessions, not credentials: a still-valid key
  re-validates and gets a fresh session. Revoke the key to stop it.
- **The auth service validates locally.** Auth, the source of truth for keys, resolves a
  presented `sk_mbx_` key against its own data layer (key lookup, then user, then session)
  instead of a remote self-call. Other services use the remote `validateapikey` path.

### Revoke a leaked key

To revoke a leaked key, revoke the key itself; logging the user out is not enough:

1. **One key.** The owner (or an admin) calls `DELETE /auth-api/v1/apikeys/:apiKeyId`.
   Find the id with `listApiKeys` (it shows each key's `keyPrefix`, the first characters
   of the leaked value). An admin revoking ANOTHER user's key must outrank the key's
   owner, as on the revoke-all admin door: a key of the superAdmin account, or of an
   account of the same or a higher role, is refused with **400** and nothing is revoked.
   The owner can always revoke their own key.
2. **Every key of a user.** The user calls `POST /revokeapikeys`; an admin calls
   `POST /users/:userId/revokeapikeys` (the same admin gate as deleting a user). The
   answer lists `revokedApiKeyIds` and the `retiredSessionIds` of the access tokens that
   were minted from those keys.

The revoke takes effect on the next request on every service that shares the auth
service's session cache: the cached session is evicted, the access tokens exchanged from
the key through `/validateapikey` are retired, and the key is refused (**401**). A service
with its own cache stores the session it got from `/validateapikey` there, which the
revoke does not reach; that copy lives at most **5 minutes**, so the key is refused there
once it expires. The user's other sessions (a password login, a different key) stay live.
Log-out-everywhere does not revoke api keys: it only makes a still-valid key re-validate,
so a leaked key keeps working until it is revoked. Create a new key for the integration
after revoking the leaked one.

### As a `commKey` for chat surfaces

Because an API key already resolves a presented key to a full session, it doubles as a
persistent **`commKey`** for a [chat surface](../../capabilities/ai-chat-surfaces.md): one stored, auditable, revocable credential
per comm line. Use it when you want a stable, revoke-on-unlink credential; otherwise the
ephemeral `mintSessionForUser` JWT is lighter (no lookup).

## API key vs password login vs M2M

| Feature | Password login | API key | M2M |
|---|---|---|---|
| Session created | Yes (JWT + cookie) | Yes (cache only, tokenless) | No session |
| Token returned | Yes (access token) | No | EdDSA-signed token |
| Session TTL | Configurable (days) | 1 day in the cache | 60 seconds per `InterserviceCallAction` token (5 minutes by default for a hand-signed one) |
| User identity | Direct login | On behalf of key owner | Service identity |
| Use case | Interactive users | Programmatic access | Inter-service calls |

## See also

- [Access tokens](./access-tokens.md): the JWT path API keys coexist with.
- [Machine-to-machine](./m2m.md): service identity for inter-service calls.
- Spec: [`APIKeyAuth`](../../../spec/APIKeyAuth.md),
  [`APIKeyAuthConfig`](../../../spec/APIKeyAuthConfig.md).
