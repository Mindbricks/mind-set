# DbBucketOwnerConfig

**Level:** `section` · **Family:** [DbBucket](./families.md#dbbucket) (domain `Service`)

**Specification:** [DbBucketOwnerConfig in Part 2](../spec/DbBucketOwnerConfig.md)

Optional pairing with another data object. When configured, each file in the bucket has a foreign key relation to the owner data object (e.g., a product's images, a user's documents). This enables filtering files by owner and cascading deletes.

## Contained in

- [DbBucket](./DbBucket.md) as `ownerDataObject`

Blueprint paths:

- `services.dbBuckets.ownerDataObject`

## Contains

- `configuration`: [DbBucketOwnerConfigSettings](./DbBucketOwnerConfigSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
