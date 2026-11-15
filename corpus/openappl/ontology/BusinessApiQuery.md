# BusinessApiQuery

**Level:** `chapter` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [BusinessApiQuery in Part 2](../spec/BusinessApiQuery.md)

Data-access shape of a `BusinessApi` (section): the select / where / data clauses plus delete / get / list / pagination options that drive the API's primary data-object query.

## Contained in

- [BusinessApi](./BusinessApi.md) as `query`

Blueprint paths:

- `authentication.businessLogic.query`
- `services.businessLogic.query`

## Contains

- `selectClause`: [SelectClauseSettings](./SelectClauseSettings.md)
- `dataClauseItems`: [DataMapItem](./DataMapItem.md), a list
- `whereClause`: [WhereClauseSettings](./WhereClauseSettings.md)
- `deleteOptions`: [DeleteOptions](./DeleteOptions.md)
- `getOptions`: [GetOptions](./GetOptions.md)
- `listOptions`: [ListOptions](./ListOptions.md)
- `paginationOptions`: [PaginationOptions](./PaginationOptions.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
