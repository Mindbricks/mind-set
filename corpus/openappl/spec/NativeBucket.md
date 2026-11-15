# NativeBucket

**Level:** `chapter` · **Family:** [NativeBucket](../ontology/families.md#nativebucket) (domain `Service`)

**Ontology:** [NativeBucket in Part 1](../ontology/NativeBucket.md)

**Name:** an instance is named by `bucketBasics.name`.

A self-hosted object-storage bucket backed by a platform-PROVISIONED, SeaweedFS (S3-API-compatible) store (docs/ADR-native-bucket-pattern.md, docs/ADR-seaweedfs-nativebucket.md). Full object-store semantics (presign, large files, streaming, server-side encryption) with NO cloud account, NO cloud credentials, and NO cloud cost — on-prem / data-sovereignty friendly. The designer just declares the bucket; the hosting platform provisions and manages the SeaweedFS store (lifecycle, root creds, default-bucket creation). Unlike RemoteBucket there is NO `bucketStorage.providerName` to configure — the managed store is implicit and project-scoped. Each native bucket creates a metadata data object named {name}RemoteFile (the SAME twin suffix RemoteBucket uses) holding storageKey + file info; binary content lives in the managed SeaweedFS store. That twin is materialized at BUILD time, so listBlueprint(dataObjects) does not list it, but it is nevertheless a legal childObject / fetch target at design time. Locally backed by the FARM SeaweedFS S3 gateway (mb-seaweedfs, S3 API :19900, dev creds minioadmin/minioadmin); in deploy the deployer stands up a per-project SeaweedFS store. Reuses RemoteBucket's basics/authorization/owner sub-patterns and the RemoteBucket S3 adapter under the hood. Upload and download routes are auto-generated at /nativebucket/{name}/. Prefer DbBucket for small files stored directly as BYTEA in PostgreSQL; prefer RemoteBucket when you want to configure your own cloud provider.

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
| `bucketBasics` | [`RemoteBucketBasics`](./RemoteBucketBasics.md) | yes |  |  |  | Core settings for the native bucket: name, description, size limits, allowed MIME types, and antivirus scanning. Shares the RemoteBucket basics shape. |
| `bucketStorage` | [`NativeBucketStorage`](./NativeBucketStorage.md) | yes |  |  |  | Storage configuration for the native bucket: optional physical-bucket override, key prefix, and how download URLs are generated. Unlike RemoteBucket there is NO provider to name — the managed SeaweedFS store is implicit. |
| `bucketAuthorization` | [`RemoteBucketAuthorization`](./RemoteBucketAuthorization.md) | yes |  |  |  | Authorization settings for read and write access to the native bucket. Shares the RemoteBucket authorization shape. |
| `ownerDataObject` | [`RemoteBucketOwnerConfig`](./RemoteBucketOwnerConfig.md) | no |  |  |  | Optional pairing with another data object. Shares the RemoteBucket owner-config shape. |
| `remoteBucketSettings` | [`RemoteBucketSettings`](./RemoteBucketSettings.md) | no |  |  |  | Optional extension settings of the bucket's auto-generated {name}RemoteFile metadata data object. additionalColumns appends designer-declared columns after its base columns; compositeIndexSettings declares composite indexes over the twin's base, owner, tenant and additional columns using the normal DataObject CompositeIndex shape. Leave null for the fixed column set and no composite indexes. |

## Constraints

Property rules:

- `bucketBasics`, `bucketStorage`, `bucketAuthorization` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `NATIVE_BUCKET_DUPLICATE_NAME` | error | NativeBucket name "…" is duplicated within this service. |
| `NATIVE_BUCKET_NAME_CONFLICT` | error | NativeBucket "…" collides with a system data-object name "…". |
| `NATIVE_BUCKET_NAME_FOREIGN` | error | NativeBucket "…" names its physical bucket "…", which is outside this project's bucket namespace. |
| `NATIVE_BUCKET_NAME_INVALID` | error | NativeBucket "…" names its physical bucket "…", which is not a valid S3 bucket name: it …. |
| `NATIVE_BUCKET_OWNER_NOT_CONFIGURED` | warning | NativeBucket "…" has no owner dataObject configured. |
| `NATIVE_BUCKET_OWNER_NOT_FOUND` | warning | NativeBucket "…" references owner dataObject "…" which is not declared in this service. |
