# SeedDataBasics

**Level:** `section` · **Family:** [SeedData](./families.md#seeddata) (domain `Service`)

**Specification:** [SeedDataBasics in Part 2](../spec/SeedDataBasics.md)

Identity and upsert policy of one seed record: the target DataObject, the matchBy idempotency key, and the value names that are seeded once and never refreshed.

## Contained in

- [SeedData](./SeedData.md) as `seedBasics`

Blueprint paths:

- `services.seedData.seedBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
