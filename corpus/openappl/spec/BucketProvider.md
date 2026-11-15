# BucketProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BucketProvider in Part 1](../ontology/BucketProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [bucketProvider](./providers/bucketProvider.md).

A named cloud-storage bucket provider configuration. The `name` is the lookup key used by RemoteBuckets and the env-var prefix (e.g. `mainStorage` → `BUCKET_MAINSTORAGE_*`). The `provider` enum decides which credentials in `configuration` are read.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from RemoteBucket.providerName and the env-var prefix. Must be a valid codeName. |
| `provider` | `RemoteBucketStorageProvider` | no | `"s3"` | `s3`, `gcs`, `azure`, `r2`, `s3Compatible` |  | The storage backend type. 's3' = AWS S3; 'r2' = Cloudflare R2 (S3-compatible); 's3Compatible' = any other S3-compatible object store reached via a custom endpoint (e.g. MinIO, SeaweedFS, Ceph, company-owned storage); 'gcs' = Google Cloud Storage; 'azure' = Azure Blob Storage. Providers configure EXTERNAL storage only — for platform-provisioned self-hosted storage define `nativeBuckets` (no provider entry needed). |
| `configuration` | [`BucketProviderConfig`](./BucketProviderConfig.md) | no |  |  |  | Provider credentials and defaults. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env; sensitive fields are marked secret and masked in API responses. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AZURE_ACCOUNT_KEY_PAIR_INCOMPLETE` | error | Azure bucket provider "…" supplies … without the matching …. |
| `AZURE_AUTH_MODE_AMBIGUOUS` | error | Azure bucket provider "…" configures … authentication modes (…). |
| `AZURE_AUTH_MODE_REQUIRED` | error | Azure bucket provider "…" must configure exactly one authentication mode: connectionString, useManagedIdentity=true, or accountName+accountKey. |
| `BUCKET_CONFIG_LIST_CANONICALIZED` | warning | Bucket provider "…" configuration was written as a [{name,value}] list — the DataMapItem idiom the OTHER provider families use. |
| `BUCKET_GCS_API_ENDPOINT_INVALID` | error | GCS apiEndpoint must be an absolute HTTP(S) URL containing only a scheme, host and optional port. |
| `BUCKET_NAME_INVALID` | error, warning | … s3Compatible servers vary, so this is a warning: ignore it if your server accepts the name. |
| `BUCKET_NAME_PLACEHOLDER` | warning | … names the bucket "…", the unfilled credential placeholder. |
| `BUCKET_PROVIDER_AWS_REGION_UNCONFIRMED` | warning | Bucket provider "…" targets REAL AWS S3 (no endpoint) and its region is …. |
| `BUCKET_PROVIDER_MISSING_CONFIGURATION` | error | Bucket provider "…" (…) is missing the required configuration key…: …. |
