# BusinessApiParameters

**Level:** `chapter` · **Family:** [BusinessApiParameters](../ontology/families.md#businessapiparameters) (domain `BusinessApi`)

**Ontology:** [BusinessApiParameters in Part 1](../ontology/BusinessApiParameters.md)

Parameter sources of a `BusinessApi` (section): custom `requestParameters` (validated request inputs fed into the workflow context) and `redisParameters` (values read from Redis into the context).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `requestParameters` | [`BusinessApiParameter`](./BusinessApiParameter.md)[] | no |  |  |  | The full request shape of this API — every parameter the caller can supply, declared inline. The framework binds `this.<name>` from the request based ONLY on this list. Element shape: name, type, isArray, required, httpLocation, defaultValue, transform, description, isSecret, hidden. URL placeholders in `restSettings.routePath` (e.g. `:teamId`) auto-promote into this list with `httpLocation: 'urlpath'` if not declared explicitly. |
| `redisParameters` | [`RedisApiParameter`](./RedisApiParameter.md)[] | no |  |  |  | An array of parameters fetched from Redis based on dynamically computed keys. These are defined using `RedisApiParameter` and are written to the context as `this.<name>`, just like request parameters. |

## Constraints

Property rules:

- The items of `requestParameters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `redisParameters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
