# PaginationOptions

**Level:** `section` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [PaginationOptions in Part 2](../spec/PaginationOptions.md)

Defines how pagination is handled in list-type Business APIs. Paginated lists take 1-based `page` and `pageSize` request parameters (legacy `pageNumber`/`pageRowCount` spellings are accepted as aliases) and respond with the list envelope `{ data: [...], paging: { page, pageSize, totalCount, totalPages } }`.

## Contained in

- [BusinessApiQuery](./BusinessApiQuery.md) as `paginationOptions`

Blueprint paths:

- `authentication.businessLogic.query.paginationOptions`
- `services.businessLogic.query.paginationOptions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
