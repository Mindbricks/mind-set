# BucketProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BucketProvidersSettings in Part 2](../spec/BucketProvidersSettings.md)

Container for cloud-storage bucket provider configurations. Each entry is a named provider (e.g. 'mainStorage', 'videoArchive') that can be referenced by RemoteBucket assets via `providerName`. The generator emits BUCKET_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `bucketProvidersSettings`

Blueprint paths:

- `projectSettings.bucketProvidersSettings`

## Contains

- `bucketProviders`: [BucketProvider](./BucketProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
