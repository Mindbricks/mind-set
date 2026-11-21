---
title: ReadFromRedisAction
---

# ReadFromRedisAction

`ReadFromRedisAction` reads a value from Redis using a computed key and binds it to the workflow context. Pair with [`WriteToRedisAction`](./write-to-redis-action.md) for typical patterns, idempotency tokens, short-TTL caches, cross-API rate-limit counters, OAuth state, email-verification codes.

## When to use it

- Read a value that another API (or an earlier call of the same API) cached under a known key.
- Resolve an idempotency / verification token written during a recent flow.
- Fetch a session-adjacent value that lives outside the standard auth session.

## Configuration

A null or undefined key is a read miss. Object/function keys are
refused with a `400` error (`Redis key must be a scalar value`) before Redis
is called; they cannot become the key `[object Object]`. Scalar values are
coerced to strings, including the valid empty-string Redis action key.
The route parameter reader separately skips an empty key.

| Property | Type | Req | Description |
|---|---|---|---|
| `redisKey` | `MScript` | ✓ | Expression evaluating to the Redis key to fetch. Typically composed from session, request, or context values (e.g., `` `verify:${this.session.userId}` ``). |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties. The fetched value is written under `contextPropertyName` (if set) and made available as `this.<contextPropertyName>` to subsequent actions.

## Behaviour

The Redis instance is provisioned with the project by the hosting platform, there is no provider configuration at the action level. The runtime evaluates `redisKey`, performs a `GET`, and writes the deserialized value to context. A missing key yields `null` (the action does not throw on cache-miss); inspect the result downstream with a [`ValidationAction`](./validation-action.md) if the value is required.

Stored objects (written by [`WriteToRedisAction`](./write-to-redis-action.md)) are JSON-deserialized on read; primitives come back as-is.

## Example

```json
{
  "name": "readVerificationCode",
  "redisKey": { "js": "`verify:${this.session.userId}`" },
  "contextPropertyName": "storedCode"
}
```

A downstream validation rejects the request if the code is missing or doesn't match:

```json
{
  "name": "ensureCodeMatches",
  "validationScript": { "js": "this.storedCode && this.storedCode === this.code" },
  "checkType": "liveCheck",
  "errorMessage": "Verification code is invalid or expired.",
  "errorStatus": "401"
}
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`WriteToRedisAction`](./write-to-redis-action.md): the write side of the same store.
- [`ValidationAction`](./validation-action.md): guard against missing values after a read.
