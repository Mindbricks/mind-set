# BucketProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BucketProvidersSettings in Part 1](../ontology/BucketProvidersSettings.md)

Container for cloud-storage bucket provider configurations. Each entry is a named provider (e.g. 'mainStorage', 'videoArchive') that can be referenced by RemoteBucket assets via `providerName`. The generator emits BUCKET_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `bucketProviders` | [`BucketProvider`](./BucketProvider.md)[] | no |  |  |  | List of configured bucket providers. Add an entry per cloud-storage account you want available to remote buckets. Multiple entries can share a provider type (e.g. two S3 accounts). |

## Constraints

Property rules:

- The items of `bucketProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
