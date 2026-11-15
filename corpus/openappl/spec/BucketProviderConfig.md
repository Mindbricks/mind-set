# BucketProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [BucketProviderConfig in Part 1](../ontology/BucketProviderConfig.md)

Provider credentials and defaults. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env. Sensitive fields are marked secret and masked in API responses.

Azure auth modes (exactly one must be configured when provider='azure'):
- `connectionString` — full Azure Blob connection string (includes account name + key + endpoint).
- `useManagedIdentity=true` — authenticate via `DefaultAzureCredential` (managed identity / workload identity); no secret in config.
- `accountName` + `accountKey` — shared-key pair, supplied separately.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `defaultBucketName` | `String` | no |  |  |  | Default physical bucket name at the provider. Used by any RemoteBucket that doesn't override `remoteBucketName`. The bucket must already exist — it is not auto-created. Names are checked against the bound provider: s3 uses 3-63 lowercase letters, digits, dots and hyphens, begins and ends alphanumeric, rejects adjacent dots, IP-shaped names and reserved prefixes/suffixes (including xn-- and -s3alias); r2 uses 3-63 lowercase letters, digits and hyphens with alphanumeric ends; gcs allows lowercase letters, digits, dots, underscores and hyphens, alphanumeric ends, 3-63 characters without dots or up to 222 with 1-63-character components, and rejects IP-shaped and Google-reserved names; azure uses 3-63 lowercase letters, digits and hyphens with alphanumeric ends and no consecutive hyphens (the reserved containers $root, $web and $logs are allowed). Violations are BUCKET_NAME_INVALID errors, except s3Compatible receives warnings. The exact REPLACE_ME placeholder is a BUCKET_NAME_PLACEHOLDER warning. A RemoteBucket with no effective override or provider default is a REMOTE_BUCKET_NAME_EMPTY error. See the bucket-providers integration guide for details. |
| `accessKeyId` | `String` | no |  |  |  | (s3/r2/s3Compatible) Access Key ID for the storage account. |
| `secretAccessKey` | `String` | no |  |  | **secret** | (s3/r2/s3Compatible) Secret Access Key for the storage account. |
| `region` | `String` | no |  |  |  | (s3/r2/s3Compatible) AWS region, e.g. 'us-east-1'. For R2 use 'auto'; for s3Compatible stores use any region string the endpoint accepts (often 'us-east-1'). |
| `endpoint` | `String` | no |  |  |  | (r2/s3Compatible, optional for s3) Custom endpoint URL. Required for R2 (https://<accountId>.r2.cloudflarestorage.com) and for s3Compatible stores (the store's S3 API URL); leave empty for AWS S3. |
| `forcePathStyle` | `Boolean` | no | `false` |  |  | (r2/s3Compatible) Set true to force path-style URLs. Usually true for s3Compatible stores (MinIO, SeaweedFS, Ceph, ...); usually false for AWS and R2. |
| `publicPresignBase` | `String` | no |  |  |  | (s3/r2/s3Compatible) PUBLIC base URL (scheme + host[:port]) that presigned upload/download URLs are signed against, for stores whose `endpoint` is a private/in-cluster address behind an ingress or reverse proxy. Presigned URLs are SIGNED against this base (SigV4 binds the Host header, so a post-hoc host rewrite would fail signature validation); server-side operations keep dialing `endpoint`. Leave empty when the endpoint is already reachable by clients (AWS S3, R2, a public MinIO). |
| `apiEndpoint` | `String` | no |  |  |  | (gcs, optional) Absolute HTTP(S) API endpoint URL. Leave empty for Google Cloud Storage. HTTP endpoints use emulator credentials without Google authentication; HTTPS custom endpoints retain service-account authentication (env: BUCKET_<NAME>_GCS_API_ENDPOINT). |
| `projectId` | `String` | no |  |  |  | (gcs) Google Cloud project ID that owns the bucket. |
| `clientEmail` | `String` | no |  |  |  | (gcs) Service-account email used to sign API requests. |
| `privateKey` | `Text` | no |  |  | **secret** | (gcs) Service-account private key (PEM). Multi-line value — paste the full BEGIN/END block as a single string. |
| `connectionString` | `Text` | no |  |  | **secret** | (azure) Full Azure Blob connection string (DefaultEndpointsProtocol=...;AccountName=...;AccountKey=...). One of `connectionString`, `useManagedIdentity=true`, or `accountName`+`accountKey` is required for the azure provider. |
| `useManagedIdentity` | `Boolean` | no | `false` |  |  | (azure) When true, the adapter authenticates using `DefaultAzureCredential` (managed identity / workload identity / az login chain) instead of a shared key. The hosting environment must supply the credential — no secret is needed in the config. Mutually exclusive with `connectionString` and `accountName`+`accountKey`. |
| `accountName` | `String` | no |  |  |  | (azure) Storage account name. Paired with `accountKey` to build a `StorageSharedKeyCredential`. Use this when you have the account name + key separately rather than a connection string. Both `accountName` and `accountKey` must be set together. |
| `accountKey` | `Text` | no |  |  | **secret** | (azure) Storage account shared key. Paired with `accountName`. Sensitive value — masked in API responses and emitted to env at codegen time. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
