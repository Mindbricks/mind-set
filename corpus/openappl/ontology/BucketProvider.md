# BucketProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BucketProvider in Part 2](../spec/BucketProvider.md)

A named cloud-storage bucket provider configuration. The `name` is the lookup key used by RemoteBuckets and the env-var prefix (e.g. `mainStorage` → `BUCKET_MAINSTORAGE_*`). The `provider` enum decides which credentials in `configuration` are read.

## Contained in

- [BucketProvidersSettings](./BucketProvidersSettings.md) as `bucketProviders` (a list)

## Contains

- `configuration`: [BucketProviderConfig](./BucketProviderConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
