# RemoteBucketStorage

**Level:** `section` · **Family:** [RemoteBucket](./families.md#remotebucket) (domain `Service`)

**Specification:** [RemoteBucketStorage in Part 2](../spec/RemoteBucketStorage.md)

Storage configuration for the remote bucket. Selects which named project bucketProvider to use, the (optional) physical bucket override, and how download URLs are generated. For object storage without a project bucketProvider, prefer NativeBucket with NativeBucketStorage: the hosting platform manages the store.

## Contained in

- [RemoteBucket](./RemoteBucket.md) as `bucketStorage`

Blueprint paths:

- `services.remoteBuckets.bucketStorage`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
