# ListOrderSet

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListOrderSet in Part 2](../spec/ListOrderSet.md)

One named row order a list api can switch to per request: the `key` a `listOrderSelector` request value is matched against, and the `sortBy` items that become the order when it matches. Declared under `ListOptions.listOrderSets`.

## Contained in

- [ListOptions](./ListOptions.md) as `listOrderSets` (a list)

## Contains

- `sortBy`: [SortByItem](./SortByItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
