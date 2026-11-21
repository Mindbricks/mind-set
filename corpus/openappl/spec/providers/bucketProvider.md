# Provider catalog: bucketProvider

Entries of this family are written with [`BucketProvider`](../BucketProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

**Behaviour rules:** what every compiler must do for this family beyond the keys (webhook signatures, field rules, documented quirks) is in [bucketProvider behaviour](../../guides/providers/bucket.md).

## Environment names

| Prefix | Key style |
|---|---|
| `BUCKET` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`s3`](#s3) | 7 | 2 | 2 |
| [`r2`](#r2) | 7 | 3 | 2 |
| [`s3Compatible`](#s3compatible) | 7 | 3 | 2 |
| [`gcs`](#gcs) | 5 | 3 | 1 |
| [`azure`](#azure) | 5 | 0 | 2 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | bucket |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live","mock"] |
| `mockCredentialMode` | allowed |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |
| `note` | Mock runs the managed native store. |

## s3

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accessKeyId` | string | yes | yes |  |  |  | AWS access key id (AKIA…/ASIA…, 20 chars). |
| `secretAccessKey` | string | yes | yes |  |  |  | AWS secret access key (40 chars). |
| `region` | string |  |  | `us-east-1` |  |  | AWS region the bucket ACTUALLY lives in, e.g. us-east-2. The default is a starting value, not a guess to leave alone: real AWS S3 answers 301 PermanentRedirect to a request signed for the wrong region, and on a PRESIGNED url that failure lands in the end user's browser at upload time - past every build, validation and health check. A pilot lost every upload path in its product to a us-east-1 signature against a us-east-2 bucket, which is why validation warns (BUCKET_PROVIDER_AWS_REGION_UNCONFIRMED) when this brand has no endpoint and the region is unset or still the default. S3-COMPATIBLE stores (s3Compatible, r2) ignore the region entirely and are never warned about. |
| `endpoint` | string |  |  |  |  |  | Custom endpoint URL; leave empty for AWS S3. |
| `forcePathStyle` | boolean |  |  | `false` |  |  | Force path-style URLs; usually false for AWS S3. |
| `publicPresignBase` | string |  |  |  |  |  | Public base URL presigned URLs are signed against when the endpoint is not client-reachable; leave empty for AWS S3. |
| `defaultBucketName` | string |  |  |  |  |  | Default physical bucket for RemoteBuckets without remoteBucketName; must already exist. |

## r2

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accessKeyId` | string | yes | yes |  |  |  | R2 API token access key id. |
| `secretAccessKey` | string | yes | yes |  |  |  | R2 API token secret access key. |
| `endpoint` | string |  | yes |  |  |  | R2 S3 endpoint: https://<accountId>.r2.cloudflarestorage.com. |
| `region` | string |  |  | `auto` |  |  | Region string; use auto for R2. |
| `forcePathStyle` | boolean |  |  | `false` |  |  | Force path-style URLs; usually false for R2. |
| `publicPresignBase` | string |  |  |  |  |  | Public base URL presigned URLs are signed against when the endpoint is not client-reachable; usually empty for R2. |
| `defaultBucketName` | string |  |  |  |  |  | Default physical bucket for RemoteBuckets without remoteBucketName; must already exist. |

## s3Compatible

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accessKeyId` | string | yes | yes |  |  |  | Access key id for the S3-compatible store. |
| `secretAccessKey` | string | yes | yes |  |  |  | Secret access key for the S3-compatible store. |
| `endpoint` | string |  | yes |  |  |  | The store's S3 API URL (MinIO, SeaweedFS, Ceph, ...). |
| `region` | string |  |  | `us-east-1` |  |  | Any region string the endpoint accepts (often us-east-1). |
| `forcePathStyle` | boolean |  |  | `true` |  |  | Force path-style URLs; usually true for S3-compatible stores. |
| `publicPresignBase` | string |  |  |  |  |  | Public base URL presigned URLs are signed against when the store's endpoint is private/in-cluster behind an ingress; leave empty when the endpoint is client-reachable. |
| `defaultBucketName` | string |  |  |  |  |  | Default physical bucket for RemoteBuckets without remoteBucketName; must already exist. |

## gcs

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiEndpoint` | string |  |  |  |  |  | Optional absolute HTTP(S) GCS API endpoint (env: BUCKET_<NAME>_GCS_API_ENDPOINT). Unset uses Google Cloud Storage; HTTP endpoints bypass Google authentication for emulators, HTTPS endpoints retain it. |
| `projectId` | string |  | yes |  |  |  | Google Cloud project id that owns the bucket (env: BUCKET_<NAME>_GCS_PROJECT_ID). |
| `clientEmail` | string |  | yes |  |  |  | Service-account email used to sign API requests (env: BUCKET_<NAME>_GCS_CLIENT_EMAIL). |
| `privateKey` | text | yes | yes |  |  |  | Service-account private key (PEM; full BEGIN/END block; env: BUCKET_<NAME>_GCS_PRIVATE_KEY). |
| `defaultBucketName` | string |  |  |  |  |  | Default physical bucket for RemoteBuckets without remoteBucketName; must already exist. |

## azure

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `connectionString` | text | yes |  |  |  | group `auth` (one full group is required) | Full Azure Blob connection string (env: BUCKET_<NAME>_AZURE_CONNECTION_STRING). Provide this OR useManagedIdentity=true OR accountName+accountKey. |
| `useManagedIdentity` | boolean |  |  | `false` |  | group `auth` (one full group is required) | Authenticate via DefaultAzureCredential (managed/workload identity); no secret in config. |
| `accountName` | string |  |  |  |  | group `auth` (one full group is required) | Storage account name (shared-key mode; set together with accountKey). |
| `accountKey` | text | yes |  |  |  | group `auth` (one full group is required) | Storage account shared key (set together with accountName); masked in API responses. |
| `defaultBucketName` | string |  |  |  |  |  | Default container name for RemoteBuckets without remoteBucketName; must already exist. |
