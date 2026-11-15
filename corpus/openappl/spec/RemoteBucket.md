# RemoteBucket

**Level:** `chapter` · **Family:** [RemoteBucket](../ontology/families.md#remotebucket) (domain `Service`)

**Ontology:** [RemoteBucket in Part 1](../ontology/RemoteBucket.md)

**Name:** an instance is named by `bucketBasics.name`.

A cloud-storage-backed file bucket. Files are uploaded to an external storage provider (S3, GCS, Azure Blob, R2, or any S3-compatible store) and only their metadata is stored in the service database. Each bucket auto-generates a data object ({name}RemoteFile) with file metadata (fileName, mimeType, fileSize, storageKey, accessKey, uploaderUserId, the scan columns, etc.; designer-declared extra columns go in remoteBucketSettings.additionalColumns), system upload/download routes at /bucket/{name}/ (POST /upload multipart, POST /upload-url presigned, GET /download/:key, DELETE /object/:key — the /remotebucket/{name}/ prefix older docs cite is not mounted), and metadata CRUD APIs. Supports presigned-URL or proxy-stream download strategies, configurable authorization (public/private/authenticated read, role-based access, custom auth scripts), and optional pairing with an owner data object. Use for large files, images, videos, and documents where DbBucket's BYTEA blob storage isn't appropriate. Prefer NativeBucket when you want platform-managed object storage without configuring a cloud provider.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `readBucketObject` | `const { readBucketObject } = require("bucketLayer/bucket-router")` | Read one object's bytes in process: `readBucketObject(bucketName, storageKey, opts?)` accepts optional `maxBytes` and `kind`, and resolves `{ bucket, storageKey, body, contentType, size }`. A trusted server-side read with no read gate; authorize your own caller first. | nodejs, java, dotnet, rust |
| `writeBucketObject` | `const { writeBucketObject } = require("bucketLayer/bucket-router")` | Store one object in process through the bucket's own upload route body (gate, MIME sniff, scan, size cap, twin row): `writeBucketObject(bucketName, input, opts?)` takes required Buffer `input.body`, optional `fileName`, `contentType`, `fields`, and optional `opts.caller` / `opts.kind`; resolves the upload answer (`storageKey`, ...). `fields` are the multipart fields an upload would carry: a twin column flagged `uploadSettings.fromUploadField` is set from the field of the same name. | nodejs, java, dotnet, rust |
| `deleteBucketObject` | `const { deleteBucketObject } = require("bucketLayer/bucket-router")` | Delete one object in process through the bucket's own delete route body and gate: `deleteBucketObject(bucketName, storageKey, opts?)` accepts optional `caller` and `kind`. Removes the object only; delete the twin row through its dbLayer function. | nodejs, java, dotnet, rust |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `bucketBasics` | [`RemoteBucketBasics`](./RemoteBucketBasics.md) | yes |  |  |  | Core bucket settings: name, description, size limits, allowed file types and antivirus scanning. |
| `bucketStorage` | [`RemoteBucketStorage`](./RemoteBucketStorage.md) | yes |  |  |  | Storage configuration: which named project `bucketProvider` to use, the optional physical bucket override, and how download URLs are generated. |
| `bucketAuthorization` | [`RemoteBucketAuthorization`](./RemoteBucketAuthorization.md) | yes |  |  |  | Read/write authorization for the remote bucket — who can upload and download files, via role-based access, access keys, or custom authorization scripts. |
| `ownerDataObject` | [`RemoteBucketOwnerConfig`](./RemoteBucketOwnerConfig.md) | no |  |  |  | Optional pairing with an owner data object — each file gains a foreign-key relation to it (e.g. a product's images, a user's documents), enabling owner-filtered listing and cascading deletes. |
| `remoteBucketSettings` | [`RemoteBucketSettings`](./RemoteBucketSettings.md) | no |  |  |  | Optional extension settings of the bucket's auto-generated {name}RemoteFile metadata data object. additionalColumns appends designer-declared columns after its base columns; compositeIndexSettings declares composite indexes over the twin's base, owner, tenant and additional columns using the normal DataObject CompositeIndex shape. Leave null for the fixed column set and no composite indexes. |

## Constraints

Property rules:

- `bucketBasics`, `bucketStorage`, `bucketAuthorization` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `REMOTE_BUCKET_COLUMN_NAME_RESERVED` | error | … "…" declares an additional column "…" on "…", which collides with … ("…"; names compare case-insensitively). |
| `REMOTE_BUCKET_COLUMN_REQUIRED_WITHOUT_DEFAULT` | error | … "…" declares the additional column "…" on "…" as required with no default. |
| `REMOTE_BUCKET_COLUMNS_NOT_PERSISTED` | warning | … "…" declares additional columns for "…", but service "…" builds as …, whose generator persists no … twin: the columns have no effect in this service. |
| `REMOTE_BUCKET_DUPLICATE_NAME` | error | RemoteBucket name "…" is duplicated within this service. |
| `REMOTE_BUCKET_NAME_CONFLICT` | error | RemoteBucket "…" collides with a system data-object name "…". |
| `REMOTE_BUCKET_NAME_EMPTY` | error | RemoteBucket "…" has no physical bucket name: bucketStorage.remoteBucketName is not set and bucket provider "…" declares no configuration.defaultBucketName. |
| `REMOTE_BUCKET_OWNER_NOT_CONFIGURED` | warning | RemoteBucket "…" has no owner dataObject configured. |
| `REMOTE_BUCKET_OWNER_NOT_FOUND` | warning | RemoteBucket "…" references owner dataObject "…" which is not declared in this service. |
| `REMOTE_BUCKET_PROVIDER_MISSING` | error | RemoteBucket "…" is missing bucketStorage.providerName. |
| `REMOTE_BUCKET_PROVIDER_NOT_FOUND` | warning | RemoteBucket "…" references provider "…" which is not configured in projectSettings.bucketProvidersSettings.bucketProviders. |
| `REMOTE_BUCKET_UPLOAD_FIELD_NAME_RESERVED` | error | … "…" flags the additional column "…" on "…" with uploadSettings.fromUploadField, but the upload route already reads the multipart field "…" itself (the file part is "file", "fileKey" is the name hint of the stored … |
| `REMOTE_BUCKET_UPLOAD_FIELD_NOT_IMPLEMENTED` | warning | … "…" flags … with uploadSettings.fromUploadField, but service "…" builds as …, whose upload route does not copy upload fields into the twin yet: the upload writes the column default, and the value has to be written … |
| `REMOTE_BUCKET_UPLOAD_FIELD_UNSUPPORTED` | error | … "…" flags the additional column "…" on "…" with uploadSettings.fromUploadField, but …. |
