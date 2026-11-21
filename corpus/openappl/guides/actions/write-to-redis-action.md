---
title: WriteToRedisAction
---

# WriteToRedisAction

`WriteToRedisAction` writes a value to Redis under a computed key. Both key and value are MScript expressions evaluated against the workflow context. Pair with [`ReadFromRedisAction`](./read-from-redis-action.md) for the read side of the same store.

## When to use it

- Cache an expensive computation under a stable key so subsequent calls short-circuit.
- Store a verification / idempotency / one-use token to be checked by a follow-up API.
- Persist a counter across API calls: rate limits, retry budgets, OAuth state.
- Bridge two cooperating APIs when a value needs to outlive the calling context but doesn't deserve a database row.

## Configuration

Null or undefined keys fail with 400. Object/function keys are
refused with `ApiError(400, 'Redis key must be a scalar value')` before Redis
is called; they cannot become the key `[object Object]`. Scalar values are
coerced to strings, including the valid empty-string Redis action key.
The route parameter reader separately skips an empty key.

| Property | Type | Req | Description |
|---|---|---|---|
| `redisKey` | `MScript` | ✓ | Expression evaluating to the Redis key the value is written under. Compose namespaced keys from session, request, or context values (e.g., `` `verify:${this.session.userId}` ``). |
| `message` | `MScript` | ✓ | Expression evaluating to the value to store. Strings and numbers go in as-is; objects are JSON-serialized automatically. |
| `ttl` | `MScript` |  | Time-to-live in seconds. Omit it, or set it to `null`, for a key that never expires. A present value must be a positive number of seconds (see Behaviour). |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The Redis instance is project-provisioned by the hosting platform: no provider configuration at the action level. At runtime the action evaluates `redisKey` and `message`, then writes the key:

- **No `ttl`** (omitted, JSON `null`, or the MScript literal `null`): a plain `SET` with no expiry. The key lives until something overwrites or deletes it. A plain `SET` also clears an expiry an earlier write put on the same key.
- **A `ttl`**: evaluated, coerced with `Number(...)` and floored to whole seconds, and written with that expiry (`SETEX`). A positive value below one second (`0.5`) rounds UP to 1 second: an expiry was asked for, so it never silently becomes a key that does not expire. A result that is not a finite positive number (a non-numeric string, `0`, a negative number, `NaN`, `Infinity`) degrades to the no-expiry `SET` rather than reaching Redis as an invalid expiry.
- At design time, a STATIC `ttl` literal that can never be an expiry (`0`, `-30`, `true`, `'one day'`) is an error (`REDIS_TTL_NOT_NUMERIC`), a static literal below one second (`0.5`, `'0.5'`) is an error too (`REDIS_TTL_BELOW_ONE_SECOND`), and a numeric string such as `'86400'` is a warning (`REDIS_TTL_TYPE_COERCED`): it is coerced.

## Example

Write a one-time verification code keyed by user id:

```json
{
  "name": "storeVerificationCode",
  "redisKey": { "js": "`verify:${this.user.id}`" },
  "message": { "js": "{ code: this.generatedCode, exp: Date.now() + 5 * 60 * 1000 }" }
}
```

A separate "verify code" Business API later reads the same key, compares the supplied code, and proceeds. To have Redis drop the code on its own after five minutes, add `"ttl": { "js": "300" }`; leave `ttl` out for a key that should never expire (an entitlement read model, say).

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`ReadFromRedisAction`](./read-from-redis-action.md): the read side of the same store.
- [`ValidationAction`](./validation-action.md): typical companion when consuming a stored value.
