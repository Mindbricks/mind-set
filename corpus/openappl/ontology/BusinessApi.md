# BusinessApi

**Level:** `namespace` · **Family:** [BusinessApi](./families.md#businessapi)

**Specification:** [BusinessApi in Part 2](../spec/BusinessApi.md)

Defines a Business API, a high-level abstraction representing a specific business operation on a primary data object. It encapsulates intent (e.g., get, create, delete), parameters, trigger mechanisms, and a structured workflow composed of modular actions. Each Business API offers more expressive and decoupled control over behavior and access.

## Field applicability by `apiOptions.crudType`

Most option blocks apply to every crudType, but the data-shaping clauses and the `*Options` blocks are restricted. Populating a block on a crudType that ignores it is a design-time mistake: the codegen silently drops the configuration. The validator emits a `BUSINESSAPI_BLOCK_IGNORED` warning when this happens.

| Block               | create | get | list | update | delete |
|---------------------|:------:|:---:|:----:|:------:|:------:|
| `apiOptions`        |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `authOptions`       |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `requestParameters` |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `dataClauseItems`   |   ✓    |  —  |  —   |   ✓    |   —    |
| `redisParameters`   |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `restSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `grpcSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `kafkaSettings`     |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `sseSettings`       |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `cronSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `internalCallSettings` | ✓   |  ✓  |  ✓   |   ✓    |   ✓    |
| `actions`           |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `workflow`          |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `selectClause`      |  ans.  |  ✓  |  ✓   |  ans.  |  ans.  |
| `whereClause`       |   —    |  ✓  |  ✓   |   ✓    |   ✓    |
| `getOptions`        |   —    |  ✓  |  —   |   —    |   —    |
| `listOptions`       |   —    |  —  |  ✓   |   —    |   —    |
| `paginationOptions` |   —    |  —  |  ✓   |   —    |   —    |
| `deleteOptions`     |   —    |  —  |  —   |   —    |   ✓    |

Reader's guide:
- `selectClause` shapes the read projection on `get` / `list`. On `create` / `update` / `delete` (`ans.`) only `selectProperties` is read, as the boundary of the answer: the written row narrowed to the declared properties + `id`, the write itself never projected; `selectJoins` there is ignored.
- `whereClause` locates the target record(s). It applies to every read or mutation that has to identify what to operate on; `create` is excluded because it makes a new record.
- `dataClauseItems` carries the write payload — each entry maps a property name to a value MScript or literal that the framework writes at create / update time. `sessionSettings` and `staticJoin` properties are auto-injected and don't need entries here. Only `create` and `update` mutate fields; a `delete` writes no payload at all — it either archives the row (`isActive: false`) or removes it, and that choice is made by the data object's `objectSettings.basicSettings.useSoftDelete`, NOT by `deleteOptions`.
- `getOptions` / `listOptions` / `paginationOptions` / `deleteOptions` are the four crudType-specific knobs. Each is meaningful for exactly one crudType. `deleteOptions.useSoftDelete` is the one exception that is inert: no generator reads it, so a per-API soft-vs-hard override does not exist; the validator warns (DELETE_OPTIONS_SOFTDELETE_IGNORED) when it contradicts the data object's flag.

When in doubt, consult the per-field doc on each option block — every block whose applicability is restricted repeats the rule in its own `__doc`.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `businessLogic` (a list)
- [Service](./Service.md) as `businessLogic` (a list)

Blueprint paths:

- `authentication.businessLogic`
- `services.businessLogic`

## Contains

- `basics`: [BusinessApiBasics](./BusinessApiBasics.md)
- `parameters`: [BusinessApiParameters](./BusinessApiParameters.md)
- `controllers`: [BusinessApiControllers](./BusinessApiControllers.md)
- `query`: [BusinessApiQuery](./BusinessApiQuery.md)
- `actions`: [BusinessApiActionStore](./BusinessApiActionStore.md)
- `workflow`: [BusinessWorkflow](./BusinessWorkflow.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
