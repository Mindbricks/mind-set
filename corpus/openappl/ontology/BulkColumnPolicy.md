# BulkColumnPolicy

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [BulkColumnPolicy in Part 2](../spec/BulkColumnPolicy.md)

The onExisting policy of one column when an UpsertBulkCrudAction updates a matched row. A column without a policy is overwritten by the incoming value.

## Contained in

- [UpsertBulkCrudAction](./UpsertBulkCrudAction.md) as `columnPolicies` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
