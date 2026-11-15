# WriteToRedisAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [WriteToRedisAction in Part 1](../ontology/WriteToRedisAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Writes a value to Redis under a computed key. The value is defined via MScript and can include dynamic data from the current context. This is typically used for storing transient data such as verification tokens, process state, or temporary API results.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `redisKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that resolves to the Redis key where the message will be stored. You can use contextual values to create scoped or namespaced keys. |
| `message` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the value to store. This can be a string, number, or object. Complex objects will be serialized to JSON automatically. |
| `ttl` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript expression that evaluates to a time-to-live in seconds. When set, the cached value expires after this many seconds (e.g. a session cache). Omit it, or set it to null, for a non-expiring key: the action then issues a plain SET with no expiry (which also clears any expiry an earlier write set on the same key). A value that is present must be a number of seconds, at least 1: a static zero, negative, boolean or non-numeric literal is refused at design time (REDIS_TTL_NOT_NUMERIC) and a static literal below one second (e.g. 0.5) is refused too (REDIS_TTL_BELOW_ONE_SECOND). At runtime the value is coerced with Number(...) and floored to whole seconds; a positive value below one second rounds UP to 1 (an expiry was asked for, so it never falls to a non-expiring write), and a value that is not a finite positive number (NaN, 0, negative, Infinity, a non-numeric string) degrades to the same no-expiry SET. |

## Constraints

Property rules:

- `redisKey`, `message` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `REDIS_KEY_REQUIRED` | error | WriteToRedisAction.redisKey is required — provide an MScript expression for the cache key. |
| `REDIS_MESSAGE_REQUIRED` | error | WriteToRedisAction.message is required — provide an MScript expression for the value to cache. |
| `REDIS_TTL_BELOW_ONE_SECOND` | error | WriteToRedisAction.ttl is …; a Redis expiry must be at least 1 second. |
| `REDIS_TTL_NOT_NUMERIC` | error | WriteToRedisAction.ttl is …; a Redis expiry must be a positive number of seconds. |
| `REDIS_TTL_TYPE_COERCED` | warning | WriteToRedisAction.ttl is the string … where a number of seconds was expected; it will be coerced to …. |

## Example

Use to write transient state to Redis under a computed key — store a verification code, process state, or short-lived cache value (objects are JSON-serialized automatically).

```json
{
  "name": "storeOtpCode",
  "description": "Persist the generated OTP keyed by phone for later verification.",
  "redisKey": { "js": "`otp:code:${this.data.phone}`" },
  "message": { "js": "{ code: this.otpCode, expiresAt: Date.now() + 300000 }" }
}
```
