# SelectClauseSettings

**Level:** `section` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [SelectClauseSettings in Part 2](../spec/SelectClauseSettings.md)

Defines which fields are included in the response of a Business API. Use this to limit returned properties for performance or visibility. On `get` and `list` APIs it shapes the read and its output; on `create`, `update` and `delete` APIs only `selectProperties` is read, as the boundary of the answer (the written row narrowed to the declared properties + `id`, the write itself never projected). The system `id` column is always kept: an explicit selection that omits `id` still returns it, so rows remain addressable. A declared select list is always the response boundary; the runtime may read more columns but never returns them.

## Contained in

- [BusinessApiQuery](./BusinessApiQuery.md) as `selectClause`

Blueprint paths:

- `authentication.businessLogic.query.selectClause`
- `services.businessLogic.query.selectClause`

## Contains

- `selectJoins`: [SelectJoin](./SelectJoin.md), a list

## References

- `selectProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
