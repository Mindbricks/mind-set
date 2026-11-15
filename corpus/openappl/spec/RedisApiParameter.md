# RedisApiParameter

**Level:** `section` · **Family:** [BusinessApiParameters](../ontology/families.md#businessapiparameters) (domain `BusinessApi`)

**Ontology:** [RedisApiParameter in Part 1](../ontology/RedisApiParameter.md)

**Name:** an instance is named by `name`.

Defines a parameter whose value is fetched from Redis before Business API execution begins. The result is written directly to the context as `this.<name>`, making it accessible like any other parameter. This is useful for injecting server-side or cached state without requiring the client to send it explicitly.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The name under which the Redis value will be stored in the context. For example, setting this to `tenantConfig` makes it accessible as `this.tenantConfig`. Like request parameters, the name binds as `this.<name>` on the generated manager and therefore must not collide with a manager base-chain member (validation refuses it with BUSINESS_API_PARAM_RESERVED_NAME; the name `session` with PARAM_NAMED_SESSION). |
| `type` | `DataTypes` | yes |  | 16 values, see [DataTypes](#datatypes) |  | The expected data type for the Redis value (e.g., String, Boolean, Object). Used for validation and type enforcement. |
| `required` | `Boolean` | yes |  |  |  | If true, the API will throw an error if the Redis key is missing or the value is null. If false, the value is optional and `defaultValue` may apply. |
| `defaultValue` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional fallback if the Redis lookup fails — an MScript expression evaluated at request time (not a raw literal). A literal is authored with the value's own syntax (`{ "js": "'default'" }`, `{ "js": "0" }`); computed/context forms (`{ "js": "this.session.userId" }`) are also allowed. Leave null to keep the Redis parameter strictly required-or-null. The expression is spliced into the generated manager's `readRedisParameters()` method, so its scope is `this` (the manager), `LIB` and the JS/Node globals — in the `{ "js": … }` form any other root identifier is a design-time ERROR (`MSCRIPT_UNKNOWN_ROOT_BINDING`), because it would be a guaranteed TS2304 at build. |
| `redisKey` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the Redis key from which to read the value. This can include dynamic tokens like `this.session.userId` or a request parameter such as `this.socialCode` — raw request parameters are already bound when redis parameters are read, and the fetched value is available to `requestParameters` transforms. |

## Allowed values

### DataTypes

`ID`, `String`, `Text`, `Integer`, `Boolean`, `Double`, `Decimal`, `Float`, `Short`, `Object`, `Date`, `Enum`, `GeoPoint`, `GeoRoute`, `GeoArea`, `Blob`

## Constraints

Property rules:

- `name`, `type`, `required`, `redisKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `type` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
