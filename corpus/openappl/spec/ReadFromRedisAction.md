# ReadFromRedisAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ReadFromRedisAction in Part 1](../ontology/ReadFromRedisAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Reads a value from Redis using a dynamically computed key and writes the result into the context under a specified property name (contextPropertyName). This action is typically used to retrieve session data, temporary values, or cached results that are needed later in the API flow. The retrieved value becomes accessible to other actions using `this.<contextName>`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `redisKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the Redis key to fetch. Can include values from the current context, session, or request (e.g., `{ "js": "this.session.userId" }`). |

## Constraints

Property rules:

- `redisKey` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `REDIS_KEY_REQUIRED` | error | ReadFromRedisAction.redisKey is required — provide an MScript expression for the cache key. |

## Example

Use to read transient state from Redis by a computed key — verification tokens, cached results, rate-limit counters — into context for later steps.

```json
{
  "name": "readOtpAttempts",
  "description": "Load the current OTP attempt count for this phone number.",
  "redisKey": { "js": "`otp:attempts:${this.data.phone}`" },
  "contextPropertyName": "otpAttempts"
}
```
