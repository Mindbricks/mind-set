# RemoteBucketSettings

**Level:** `section` · **Family:** [RemoteBucket](./families.md#remotebucket) (domain `Service`)

**Specification:** [RemoteBucketSettings in Part 2](../spec/RemoteBucketSettings.md)

Extension settings of a RemoteBucket's auto-generated {name}RemoteFile metadata data object. The twin keeps its framework-owned base columns; this section adds designer-declared columns to it.

## Contained in

- [NativeBucket](./NativeBucket.md) as `remoteBucketSettings`
- [RemoteBucket](./RemoteBucket.md) as `remoteBucketSettings`

Blueprint paths:

- `services.remoteBuckets.remoteBucketSettings`
- `services.nativeBuckets.remoteBucketSettings`

## Contains

- `additionalColumns`: [DataProperty](./DataProperty.md), a list
- `compositeIndexSettings`: [CompositeIndex](./CompositeIndex.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
