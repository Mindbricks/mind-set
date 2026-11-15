# RemoteBucketOwnerConfig

**Level:** `section` · **Family:** [RemoteBucket](./families.md#remotebucket) (domain `Service`)

**Specification:** [RemoteBucketOwnerConfig in Part 2](../spec/RemoteBucketOwnerConfig.md)

Optional pairing with another data object. When configured, each file in the bucket has a foreign key relation to the owner data object (e.g., a product's images, a user's documents). This enables filtering files by owner and cascading deletes.

## Contained in

- [NativeBucket](./NativeBucket.md) as `ownerDataObject`
- [RemoteBucket](./RemoteBucket.md) as `ownerDataObject`

Blueprint paths:

- `services.remoteBuckets.ownerDataObject`
- `services.nativeBuckets.ownerDataObject`

## Contains

- `configuration`: [RemoteBucketOwnerConfigSettings](./RemoteBucketOwnerConfigSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
