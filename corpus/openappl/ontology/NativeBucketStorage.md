# NativeBucketStorage

**Level:** `section` · **Family:** [NativeBucket](./families.md#nativebucket) (domain `Service`)

**Specification:** [NativeBucketStorage in Part 2](../spec/NativeBucketStorage.md)

Storage configuration for a NativeBucket. Slim, provider-less variant of RemoteBucketStorage — there is NO `providerName` because the store is the platform-managed SeaweedFS (resolved from project-scoped NATIVEBUCKET_* env at runtime, forcePathStyle always true). Keeps the object-store knobs: optional physical-bucket override, key prefix, URL strategy, presign TTL, and server-side encryption.

## Contained in

- [NativeBucket](./NativeBucket.md) as `bucketStorage`

Blueprint paths:

- `services.nativeBuckets.bucketStorage`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
